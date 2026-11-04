import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBaseline, extractFeatures, SYMPTOMS } from './features.js';
import { predict } from './logisticRegression.js';

// Helper to build an entry quickly
function entry(food, water, activity, weight) {
    return { food, water, activity, weight };
}

// getBaseline: normal cases
test('getBaseline returns the averages of all four fields', () => {
    const past = [entry(2, 3, 30, 10), entry(4, 5, 50, 12)];
    assert.deepEqual(getBaseline(past), { food: 3, water: 4, activity: 40, weight: 11 });
});

test('getBaseline with one entry returns that entry\'s values', () => {
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
    assert.deepEqual(getBaseline(past), { food: 3, water: 3, activity: 30, weight: 11 });
});

test('getBaseline returns only the four numeric fields', () => {
    const result = getBaseline([{ ...entry(1, 1, 1, 1), extra: 5 }]);
    assert.deepEqual(Object.keys(result).sort(), ['activity', 'food', 'water', 'weight']);
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
    assert.deepEqual(getBaseline([entry(-2, 0, 0, 0), entry(2, 0, 0, 0)]).food, 0);
});

test('getBaseline handles a large number of entries', () => {
    const past = [];
    for (let i = 0; i < 10000; i++) {
        past.push(entry(2, 3, 30, 10));
    }
    assert.deepEqual(getBaseline(past), { food: 2, water: 3, activity: 30, weight: 10 });
});

test('getBaseline handles large values', () => {
    const result = getBaseline([entry(1e6, 1e6, 1e6, 1e6), entry(3e6, 3e6, 3e6, 3e6)]);
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
    assert.throws(() => getBaseline([{ food: 1, water: 1, activity: 1 }]), TypeError);
    assert.throws(() => getBaseline([{}]), TypeError);
});

test('getBaseline rejects fields with the wrong type', () => {
    assert.throws(() => getBaseline([{ ...entry(1, 1, 1, 1), food: '2' }]), TypeError);
    assert.throws(() => getBaseline([{ ...entry(1, 1, 1, 1), water: null }]), TypeError);
    assert.throws(() => getBaseline([{ ...entry(1, 1, 1, 1), activity: true }]), TypeError);
    assert.throws(() => getBaseline([{ ...entry(1, 1, 1, 1), weight: [10] }]), TypeError);
});

test('getBaseline rejects NaN and Infinity values', () => {
    assert.throws(() => getBaseline([{ ...entry(1, 1, 1, 1), food: NaN }]), TypeError);
    assert.throws(() => getBaseline([{ ...entry(1, 1, 1, 1), weight: Infinity }]), TypeError);
});

test('getBaseline rejects if any one entry is bad, even with good ones', () => {
    const past = [entry(1, 1, 1, 1), entry(2, 2, 2, 2), { ...entry(3, 3, 3, 3), food: 'x' }];
    assert.throws(() => getBaseline(past), TypeError);
});

// extractFeatures: helper to compare arrays of decimals
function assertClose(actual, expected) {
    assert.equal(actual.length, expected.length);
    for (let i = 0; i < expected.length; i++) {
        assert.ok(
            Math.abs(actual[i] - expected[i]) < 1e-10,
            `Index ${i}: expected ${expected[i]}, got ${actual[i]}`
        );
    }
}

const normalPast = [entry(2, 4, 40, 10)];

// extractFeatures: normal cases
test('extractFeatures matches a hand-worked example', () => {
    // food: (1.4 - 2) / 2 = -0.3, water: 0, activity: (60 - 40) / 40 = 0.5, weight: 0.05
    const current = { ...entry(1.4, 4, 60, 10.5), symptoms: [] };
    assertClose(extractFeatures(current, normalPast), [-0.3, 0, 0.5, 0.05, 0, 0, 0, 0, 0]);
});

test('extractFeatures always returns 9 features', () => {
    assert.equal(extractFeatures(entry(1, 1, 1, 1), []).length, 9);
    assert.equal(extractFeatures({ ...entry(1, 1, 1, 1), symptoms: SYMPTOMS }, normalPast).length, 9);
});

test('extractFeatures returns 0 changes when there are no past entries', () => {
    const current = { ...entry(5, 5, 5, 5), symptoms: ['vomiting'] };
    assert.deepEqual(extractFeatures(current, []), [0, 0, 0, 0, 0, 1, 0, 0, 0]);
});

test('extractFeatures returns all 0 changes when the entry matches the baseline', () => {
    assertClose(extractFeatures(entry(2, 4, 40, 10), normalPast), [0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('extractFeatures uses the average of several past entries', () => {
    const past = [entry(1, 2, 20, 8), entry(3, 6, 60, 12)]; // averages: 2, 4, 40, 10
    assertClose(extractFeatures(entry(1, 4, 40, 10), past), [-0.5, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('extractFeatures sets symptom flags in the fixed order', () => {
    const current = { ...entry(2, 4, 40, 10), symptoms: ['coughing', 'vomiting'] };
    assert.deepEqual(extractFeatures(current, normalPast).slice(4), [0, 1, 0, 0, 1]);
});

test('extractFeatures sets every flag when all symptoms are present', () => {
    const current = { ...entry(2, 4, 40, 10), symptoms: [...SYMPTOMS] };
    assert.deepEqual(extractFeatures(current, normalPast).slice(4), [1, 1, 1, 1, 1]);
});

test('extractFeatures treats missing symptoms as none', () => {
    assert.deepEqual(extractFeatures(entry(2, 4, 40, 10), normalPast).slice(4), [0, 0, 0, 0, 0]);
});

test('extractFeatures treats an empty symptoms array as none', () => {
    const current = { ...entry(2, 4, 40, 10), symptoms: [] };
    assert.deepEqual(extractFeatures(current, normalPast).slice(4), [0, 0, 0, 0, 0]);
});

test('extractFeatures ignores symptoms not on the list', () => {
    const current = { ...entry(2, 4, 40, 10), symptoms: ['sneezing', 'limping'] };
    assert.deepEqual(extractFeatures(current, normalPast).slice(4), [0, 0, 0, 0, 0]);
});

test('extractFeatures counts a repeated symptom only once', () => {
    const current = { ...entry(2, 4, 40, 10), symptoms: ['vomiting', 'vomiting'] };
    assert.deepEqual(extractFeatures(current, normalPast).slice(4), [0, 1, 0, 0, 0]);
});

test('extractFeatures is case-sensitive, so symptoms must be saved lowercase', () => {
    const current = { ...entry(2, 4, 40, 10), symptoms: ['Vomiting'] };
    assert.deepEqual(extractFeatures(current, normalPast).slice(4), [0, 0, 0, 0, 0]);
});

test('extractFeatures output works with predict', () => {
    const current = { ...entry(1, 4, 40, 10), symptoms: ['not eating'] };
    const features = extractFeatures(current, normalPast);
    const result = predict(features, new Array(9).fill(0.5), 0);
    assert.ok(result >= 0 && result <= 1);
});

// extractFeatures: boundary and large inputs
test('extractFeatures returns 0 for a field whose baseline is 0', () => {
    const past = [entry(2, 4, 0, 10)];
    assertClose(extractFeatures(entry(2, 4, 30, 10), past), [0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('extractFeatures returns -1 when the value drops to 0', () => {
    assertClose(extractFeatures(entry(0, 4, 40, 10), normalPast).slice(0, 1), [-1]);
});

test('extractFeatures handles a very large increase', () => {
    assertClose(extractFeatures(entry(200, 4, 40, 10), normalPast).slice(0, 1), [99]);
});

test('extractFeatures handles many past entries', () => {
    const past = [];
    for (let i = 0; i < 10000; i++) {
        past.push(entry(2, 4, 40, 10));
    }
    assertClose(extractFeatures(entry(1, 4, 40, 10), past), [-0.5, 0, 0, 0, 0, 0, 0, 0, 0]);
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
    assert.throws(() => extractFeatures({ food: 1, water: 1, activity: 1 }, normalPast), TypeError);
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), food: '1' }, normalPast), TypeError);
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), weight: NaN }, normalPast), TypeError);
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), water: null }, normalPast), TypeError);
});

test('extractFeatures rejects symptoms that are not an array', () => {
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), symptoms: 'vomiting' }, normalPast), TypeError);
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), symptoms: null }, normalPast), TypeError);
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), symptoms: { 0: 'vomiting' } }, normalPast), TypeError);
});

test('extractFeatures rejects symptoms that are not strings', () => {
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), symptoms: [1] }, normalPast), TypeError);
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), symptoms: [null] }, normalPast), TypeError);
    assert.throws(() => extractFeatures({ ...entry(1, 1, 1, 1), symptoms: ['vomiting', true] }, normalPast), TypeError);
});

test('extractFeatures rejects bad past entries', () => {
    assert.throws(() => extractFeatures(entry(1, 1, 1, 1), null), TypeError);
    assert.throws(() => extractFeatures(entry(1, 1, 1, 1), 'past'), TypeError);
    assert.throws(() => extractFeatures(entry(1, 1, 1, 1), [null]), TypeError);
    assert.throws(() => extractFeatures(entry(1, 1, 1, 1), [{ food: 'x' }]), TypeError);
});