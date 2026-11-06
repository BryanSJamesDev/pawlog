import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBaseline,
  extractFeatures,
  countLowDays,
  SYMPTOMS,
} from './features.js';
import { predict } from './logisticRegression.js';

// Helper to build an entry quickly (date defaults to one day)
function entry(food, water, activity, weight, date = '2026-11-01') {
  return { food, water, activity, weight, date };
}

// getBaseline: normal cases
test('getBaseline returns the averages of all four fields', () => {
  const past = [entry(2, 3, 30, 10), entry(4, 5, 50, 12)];
  assert.deepEqual(getBaseline(past), {
    food: 3,
    water: 4,
    activity: 40,
    weight: 11,
  });
});

test("getBaseline with one entry returns that entry's values", () => {
  assert.deepEqual(getBaseline([entry(1.5, 2, 20, 9)]), {
    food: 1.5,
    water: 2,
    activity: 20,
    weight: 9,
  });
});

test('getBaseline handles decimal averages', () => {
  const past = [entry(1, 1, 10, 10), entry(2, 2, 20, 10), entry(2, 2, 20, 11)];
  const result = getBaseline(past);
  assert.ok(Math.abs(result.food - 5 / 3) < 1e-10);
  assert.ok(Math.abs(result.weight - 31 / 3) < 1e-10);
});

test('getBaseline ignores extra fields like symptoms and petName', () => {
  const past = [
    { ...entry(2, 2, 20, 10), symptoms: ['vomiting'], petName: 'Luna' },
    { ...entry(4, 4, 40, 12), needsAttention: true },
  ];
  assert.deepEqual(getBaseline(past), {
    food: 3,
    water: 3,
    activity: 30,
    weight: 11,
  });
});

test('getBaseline returns only the four numeric fields', () => {
  const result = getBaseline([{ ...entry(1, 1, 1, 1), extra: 5 }]);
  assert.deepEqual(Object.keys(result).sort(), [
    'activity',
    'food',
    'water',
    'weight',
  ]);
});

test('getBaseline does not change the input entries', () => {
  const past = [entry(2, 3, 30, 10), entry(4, 5, 50, 12)];
  const copy = past.map((e) => ({ ...e }));
  getBaseline(past);
  assert.deepEqual(past, copy);
});

// getBaseline: boundary and large inputs
test('getBaseline returns null for an empty array', () => {
  assert.equal(getBaseline([]), null);
});

test('getBaseline handles zeros', () => {
  assert.deepEqual(getBaseline([entry(0, 0, 0, 0), entry(0, 0, 0, 0)]), {
    food: 0,
    water: 0,
    activity: 0,
    weight: 0,
  });
});

test('getBaseline handles negative numbers without crashing', () => {
  // Shouldn't happen with real data, but the math should still work
  assert.deepEqual(
    getBaseline([entry(-2, 0, 0, 0), entry(2, 0, 0, 0)]).food,
    0,
  );
});

test('getBaseline handles a large number of entries', () => {
  const past = [];
  for (let i = 0; i < 10000; i++) {
    past.push(entry(2, 3, 30, 10));
  }
  assert.deepEqual(getBaseline(past), {
    food: 2,
    water: 3,
    activity: 30,
    weight: 10,
  });
});

test('getBaseline handles large values', () => {
  const result = getBaseline([
    entry(1e6, 1e6, 1e6, 1e6),
    entry(3e6, 3e6, 3e6, 3e6),
  ]);
  assert.equal(result.food, 2e6);
});

// getBaseline: error handling
test('getBaseline rejects non-array input', () => {
  assert.throws(() => getBaseline(null), TypeError);
  assert.throws(() => getBaseline(undefined), TypeError);
  assert.throws(() => getBaseline('entries'), TypeError);
  assert.throws(() => getBaseline({ food: 1 }), TypeError);
  assert.throws(() => getBaseline(), TypeError);
});

test('getBaseline rejects entries that are not objects', () => {
  assert.throws(() => getBaseline([null]), TypeError);
  assert.throws(() => getBaseline([undefined]), TypeError);
  assert.throws(() => getBaseline([5]), TypeError);
  assert.throws(() => getBaseline(['entry']), TypeError);
});

test('getBaseline rejects entries missing a field', () => {
  assert.throws(
    () => getBaseline([{ food: 1, water: 1, activity: 1 }]),
    TypeError,
  );
  assert.throws(() => getBaseline([{}]), TypeError);
});

test('getBaseline rejects fields with the wrong type', () => {
  assert.throws(
    () => getBaseline([{ ...entry(1, 1, 1, 1), food: '2' }]),
    TypeError,
  );
  assert.throws(
    () => getBaseline([{ ...entry(1, 1, 1, 1), water: null }]),
    TypeError,
  );
  assert.throws(
    () => getBaseline([{ ...entry(1, 1, 1, 1), activity: true }]),
    TypeError,
  );
  assert.throws(
    () => getBaseline([{ ...entry(1, 1, 1, 1), weight: [10] }]),
    TypeError,
  );
});

test('getBaseline rejects NaN and Infinity values', () => {
  assert.throws(
    () => getBaseline([{ ...entry(1, 1, 1, 1), food: NaN }]),
    TypeError,
  );
  assert.throws(
    () => getBaseline([{ ...entry(1, 1, 1, 1), weight: Infinity }]),
    TypeError,
  );
});

test('getBaseline rejects if any one entry is bad, even with good ones', () => {
  const past = [
    entry(1, 1, 1, 1),
    entry(2, 2, 2, 2),
    { ...entry(3, 3, 3, 3), food: 'x' },
  ];
  assert.throws(() => getBaseline(past), TypeError);
});

// extractFeatures: helper to compare arrays of decimals
function assertClose(actual, expected) {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    assert.ok(
      Math.abs(actual[i] - expected[i]) < 1e-10,
      `Index ${i}: expected ${expected[i]}, got ${actual[i]}`,
    );
  }
}

const normalPast = [entry(2, 4, 40, 10)];

// extractFeatures: normal cases
test('extractFeatures matches a hand-worked example', () => {
  // food: (1.4 - 2) / 2 = -0.3, water: 0, activity: (60 - 40) / 40 = 0.5, weight: 0.05
  // low days: 1.4 is below 1.6 (80% of 2), past day is normal, so 1
  const current = { ...entry(1.4, 4, 60, 10.5), symptoms: [] };
  assertClose(
    extractFeatures(current, normalPast),
    [-0.3, 0, 0.5, 0.05, 0, 0, 0, 0, 0, 1],
  );
});

test('extractFeatures always returns 10 features', () => {
  assert.equal(extractFeatures(entry(1, 1, 1, 1), []).length, 10);
  assert.equal(
    extractFeatures({ ...entry(1, 1, 1, 1), symptoms: SYMPTOMS }, normalPast)
      .length,
    10,
  );
});

test('extractFeatures returns 0 changes when there are no past entries', () => {
  const current = { ...entry(5, 5, 5, 5), symptoms: ['vomiting'] };
  assert.deepEqual(
    extractFeatures(current, []),
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  );
});

test('extractFeatures returns all 0 when the entry matches the baseline', () => {
  assertClose(
    extractFeatures(entry(2, 4, 40, 10), normalPast),
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  );
});

test('extractFeatures uses the average of several past entries', () => {
  // averages: 2, 4, 40, 10. Newest past day (food 1) is also low, so low days = 2
  const past = [
    entry(1, 2, 20, 8, '2026-11-02'),
    entry(3, 6, 60, 12, '2026-11-01'),
  ];
  assertClose(
    extractFeatures(entry(1, 4, 40, 10), past),
    [-0.5, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  );
});

test('extractFeatures sets symptom flags in the fixed order', () => {
  const current = {
    ...entry(2, 4, 40, 10),
    symptoms: ['coughing', 'vomiting'],
  };
  assert.deepEqual(
    extractFeatures(current, normalPast).slice(4, 9),
    [0, 1, 0, 0, 1],
  );
});

test('extractFeatures sets every flag when all symptoms are present', () => {
  const current = { ...entry(2, 4, 40, 10), symptoms: [...SYMPTOMS] };
  assert.deepEqual(
    extractFeatures(current, normalPast).slice(4, 9),
    [1, 1, 1, 1, 1],
  );
});

test('extractFeatures treats missing symptoms as none', () => {
  assert.deepEqual(
    extractFeatures(entry(2, 4, 40, 10), normalPast).slice(4, 9),
    [0, 0, 0, 0, 0],
  );
});

test('extractFeatures treats an empty symptoms array as none', () => {
  const current = { ...entry(2, 4, 40, 10), symptoms: [] };
  assert.deepEqual(
    extractFeatures(current, normalPast).slice(4, 9),
    [0, 0, 0, 0, 0],
  );
});

test('extractFeatures ignores symptoms not on the list', () => {
  const current = { ...entry(2, 4, 40, 10), symptoms: ['sneezing', 'limping'] };
  assert.deepEqual(
    extractFeatures(current, normalPast).slice(4, 9),
    [0, 0, 0, 0, 0],
  );
});

test('extractFeatures counts a repeated symptom only once', () => {
  const current = {
    ...entry(2, 4, 40, 10),
    symptoms: ['vomiting', 'vomiting'],
  };
  assert.deepEqual(
    extractFeatures(current, normalPast).slice(4, 9),
    [0, 1, 0, 0, 0],
  );
});

test('extractFeatures is case-sensitive, so symptoms must be saved lowercase', () => {
  const current = { ...entry(2, 4, 40, 10), symptoms: ['Vomiting'] };
  assert.deepEqual(
    extractFeatures(current, normalPast).slice(4, 9),
    [0, 0, 0, 0, 0],
  );
});

test('extractFeatures puts low days last', () => {
  const current = entry(1, 4, 40, 10);
  assert.equal(
    extractFeatures(current, normalPast)[9],
    countLowDays(current, normalPast),
  );
});

test('extractFeatures output works with predict', () => {
  const current = { ...entry(1, 4, 40, 10), symptoms: ['not eating'] };
  const features = extractFeatures(current, normalPast);
  const result = predict(features, new Array(10).fill(0.5), 0);
  assert.ok(result >= 0 && result <= 1);
});

// extractFeatures: boundary and large inputs
test('extractFeatures returns 0 for a field whose baseline is 0', () => {
  const past = [entry(2, 4, 0, 10)];
  assertClose(
    extractFeatures(entry(2, 4, 30, 10), past),
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  );
});

test('extractFeatures returns -1 when the value drops to 0', () => {
  assertClose(
    extractFeatures(entry(0, 4, 40, 10), normalPast).slice(0, 1),
    [-1],
  );
});

test('extractFeatures handles a very large increase', () => {
  assertClose(
    extractFeatures(entry(200, 4, 40, 10), normalPast).slice(0, 1),
    [99],
  );
});

test('extractFeatures handles many past entries', () => {
  const past = [];
  for (let i = 0; i < 10000; i++) {
    past.push(entry(2, 4, 40, 10));
  }
  assertClose(
    extractFeatures(entry(1, 4, 40, 10), past),
    [-0.5, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  );
});

test('extractFeatures does not change its inputs', () => {
  const current = { ...entry(1, 4, 40, 10), symptoms: ['vomiting'] };
  const past = [entry(2, 4, 40, 10)];
  const currentCopy = { ...current, symptoms: [...current.symptoms] };
  const pastCopy = past.map((e) => ({ ...e }));
  extractFeatures(current, past);
  assert.deepEqual(current, currentCopy);
  assert.deepEqual(past, pastCopy);
});

// extractFeatures: error handling
test('extractFeatures rejects an entry that is not an object', () => {
  assert.throws(() => extractFeatures(null, normalPast), TypeError);
  assert.throws(() => extractFeatures(undefined, normalPast), TypeError);
  assert.throws(() => extractFeatures('entry', normalPast), TypeError);
  assert.throws(() => extractFeatures([1, 2, 3, 4], normalPast), TypeError);
});

test('extractFeatures rejects an entry with missing or bad fields', () => {
  assert.throws(
    () => extractFeatures({ food: 1, water: 1, activity: 1 }, normalPast),
    TypeError,
  );
  assert.throws(
    () => extractFeatures({ ...entry(1, 1, 1, 1), food: '1' }, normalPast),
    TypeError,
  );
  assert.throws(
    () => extractFeatures({ ...entry(1, 1, 1, 1), weight: NaN }, normalPast),
    TypeError,
  );
  assert.throws(
    () => extractFeatures({ ...entry(1, 1, 1, 1), water: null }, normalPast),
    TypeError,
  );
});

test('extractFeatures rejects symptoms that are not an array', () => {
  assert.throws(
    () =>
      extractFeatures(
        { ...entry(1, 1, 1, 1), symptoms: 'vomiting' },
        normalPast,
      ),
    TypeError,
  );
  assert.throws(
    () => extractFeatures({ ...entry(1, 1, 1, 1), symptoms: null }, normalPast),
    TypeError,
  );
  assert.throws(
    () =>
      extractFeatures(
        { ...entry(1, 1, 1, 1), symptoms: { 0: 'vomiting' } },
        normalPast,
      ),
    TypeError,
  );
});

test('extractFeatures rejects symptoms that are not strings', () => {
  assert.throws(
    () => extractFeatures({ ...entry(1, 1, 1, 1), symptoms: [1] }, normalPast),
    TypeError,
  );
  assert.throws(
    () =>
      extractFeatures({ ...entry(1, 1, 1, 1), symptoms: [null] }, normalPast),
    TypeError,
  );
  assert.throws(
    () =>
      extractFeatures(
        { ...entry(1, 1, 1, 1), symptoms: ['vomiting', true] },
        normalPast,
      ),
    TypeError,
  );
});

test('extractFeatures rejects bad past entries', () => {
  assert.throws(() => extractFeatures(entry(1, 1, 1, 1), null), TypeError);
  assert.throws(() => extractFeatures(entry(1, 1, 1, 1), 'past'), TypeError);
  assert.throws(() => extractFeatures(entry(1, 1, 1, 1), [null]), TypeError);
  assert.throws(
    () => extractFeatures(entry(1, 1, 1, 1), [{ food: 'x' }]),
    TypeError,
  );
});

test('extractFeatures rejects past entries without a date', () => {
  const past = [{ food: 2, water: 4, activity: 40, weight: 10 }];
  assert.throws(() => extractFeatures(entry(1, 4, 40, 10), past), TypeError);
});

// countLowDays: shared test data
// Average food = 15 / 7 ≈ 2.14, so the limit is about 1.71
const streakPast = [
  entry(1, 4, 40, 10, '2026-11-03'),
  entry(1, 4, 40, 10, '2026-11-02'),
  entry(3, 4, 40, 10, '2026-11-01'), // normal day breaks the streak
  entry(1, 4, 40, 10, '2026-10-31'),
  entry(3, 4, 40, 10, '2026-10-30'),
  entry(3, 4, 40, 10, '2026-10-29'),
  entry(3, 4, 40, 10, '2026-10-28'),
];

// countLowDays: normal cases
test('countLowDays returns 0 when today is not low', () => {
  assert.equal(countLowDays(entry(2, 4, 40, 10), normalPast), 0);
});

test('countLowDays returns 1 when only today is low', () => {
  assert.equal(countLowDays(entry(1, 4, 40, 10), normalPast), 1);
});

test('countLowDays counts today plus the low days right before it', () => {
  // today (1) + 11-03 (1) + 11-02 (1), then 11-01 (3) breaks it
  assert.equal(countLowDays(entry(1, 4, 40, 10), streakPast), 3);
});

test('countLowDays does not count low days after the streak breaks', () => {
  // 10-31 is low, but it comes after the normal day on 11-01
  assert.equal(countLowDays(entry(1, 4, 40, 10), streakPast), 3);
});

test('countLowDays gives the same result when past entries are out of order', () => {
  const shuffled = [
    streakPast[3],
    streakPast[6],
    streakPast[0],
    streakPast[2],
    streakPast[5],
    streakPast[1],
    streakPast[4],
  ];
  assert.equal(countLowDays(entry(1, 4, 40, 10), shuffled), 3);
});

test('countLowDays counts every past day when they are all low until an old normal day', () => {
  // Average = 13 / 4 = 3.25, limit 2.6
  const past = [
    entry(1, 4, 40, 10, '2026-11-03'),
    entry(1, 4, 40, 10, '2026-11-02'),
    entry(1, 4, 40, 10, '2026-11-01'),
    entry(10, 4, 40, 10, '2026-10-31'),
  ];
  assert.equal(countLowDays(entry(1, 4, 40, 10), past), 4);
});

test('countLowDays works with Date objects as well as strings', () => {
  const past = streakPast.map((e) => ({ ...e, date: new Date(e.date) }));
  assert.equal(countLowDays(entry(1, 4, 40, 10), past), 3);
});

test("countLowDays does not need a date on today's entry", () => {
  const today = { food: 1, water: 4, activity: 40, weight: 10 };
  assert.equal(countLowDays(today, streakPast), 3);
});

test('countLowDays does not change the order of past entries', () => {
  const past = [...streakPast].reverse();
  const copy = past.map((e) => ({ ...e }));
  countLowDays(entry(1, 4, 40, 10), past);
  assert.deepEqual(past, copy);
});

// countLowDays: boundary and large inputs
test('countLowDays returns 0 with no past entries', () => {
  assert.equal(countLowDays(entry(0, 4, 40, 10), []), 0);
});

test('countLowDays returns 0 when the food baseline is 0', () => {
  const past = [entry(0, 4, 40, 10), entry(0, 4, 40, 10)];
  assert.equal(countLowDays(entry(0, 4, 40, 10), past), 0);
});

test('food exactly at the limit is not a low day', () => {
  // baseline 2, limit 1.6
  assert.equal(countLowDays(entry(1.6, 4, 40, 10), normalPast), 0);
});

test('food just under the limit is a low day', () => {
  assert.equal(countLowDays(entry(1.59, 4, 40, 10), normalPast), 1);
});

test('countLowDays handles today with 0 food', () => {
  assert.equal(countLowDays(entry(0, 4, 40, 10), normalPast), 1);
});

test('countLowDays handles many past entries', () => {
  const past = [];
  for (let i = 0; i < 1000; i++) {
    const day = new Date(2026, 0, 1 + i);
    // newest 5 days are low, the rest are normal
    past.push(entry(i >= 995 ? 1 : 3, 4, 40, 10, day));
  }
  assert.equal(countLowDays(entry(1, 4, 40, 10), past), 6);
});

// countLowDays: error handling
test('countLowDays rejects a bad entry', () => {
  assert.throws(() => countLowDays(null, normalPast), TypeError);
  assert.throws(() => countLowDays({ food: '1' }, normalPast), TypeError);
  assert.throws(() => countLowDays([1], normalPast), TypeError);
});

test('countLowDays rejects bad past entries', () => {
  assert.throws(() => countLowDays(entry(1, 4, 40, 10), null), TypeError);
  assert.throws(() => countLowDays(entry(1, 4, 40, 10), 'past'), TypeError);
  assert.throws(() => countLowDays(entry(1, 4, 40, 10), [null]), TypeError);
});

test('countLowDays rejects past entries with a missing or bad date', () => {
  const base = { food: 2, water: 4, activity: 40, weight: 10 };
  assert.throws(() => countLowDays(entry(1, 4, 40, 10), [base]), TypeError);
  assert.throws(
    () => countLowDays(entry(1, 4, 40, 10), [{ ...base, date: null }]),
    TypeError,
  );
  assert.throws(
    () => countLowDays(entry(1, 4, 40, 10), [{ ...base, date: 'not a date' }]),
    TypeError,
  );
  assert.throws(
    () => countLowDays(entry(1, 4, 40, 10), [{ ...base, date: NaN }]),
    TypeError,
  );
});

test('countLowDays rejects if any one past entry has a bad date', () => {
  const past = [
    ...streakPast,
    { food: 2, water: 4, activity: 40, weight: 10, date: 'bad' },
  ];
  assert.throws(() => countLowDays(entry(1, 4, 40, 10), past), TypeError);
});
