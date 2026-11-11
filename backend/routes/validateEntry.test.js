import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry } from './validateEntry.js';
import { extractFeatures } from '../ml/features.js';

// A valid body like the form would send
function validBody(overrides = {}) {
  return {
    petName: 'Luna',
    petSpecies: 'dog',
    date: '2026-11-04',
    food: 2,
    water: 3,
    activity: 45,
    weight: 50,
    symptoms: [],
    ...overrides,
  };
}

// validateEntry: normal cases
test('validateEntry returns a clean entry for valid input', () => {
  const result = validateEntry(validBody());
  assert.deepEqual(result, {
    petName: 'Luna',
    petSpecies: 'dog',
    date: new Date('2026-11-04'),
    food: 2,
    water: 3,
    activity: 45,
    weight: 50,
    symptoms: [],
  });
});

test('validateEntry trims pet name and species', () => {
  const result = validateEntry(
    validBody({ petName: '  Luna  ', petSpecies: ' cat ' }),
  );
  assert.equal(result.petName, 'Luna');
  assert.equal(result.petSpecies, 'cat');
});

test('validateEntry converts number strings from forms into numbers', () => {
  const result = validateEntry(
    validBody({ food: '1.5', water: '3', activity: '30', weight: '12.25' }),
  );
  assert.equal(result.food, 1.5);
  assert.equal(result.water, 3);
  assert.equal(result.activity, 30);
  assert.equal(result.weight, 12.25);
});

test('validateEntry turns a date string into a Date', () => {
  const result = validateEntry(validBody());
  assert.ok(result.date instanceof Date);
});

test('validateEntry accepts a Date object', () => {
  const date = new Date('2026-11-04');
  assert.equal(
    validateEntry(validBody({ date })).date.getTime(),
    date.getTime(),
  );
});

test('validateEntry lowercases symptoms', () => {
  const result = validateEntry(
    validBody({ symptoms: ['Vomiting', 'LOW ENERGY'] }),
  );
  assert.deepEqual(result.symptoms, ['vomiting', 'low energy']);
});

test('validateEntry removes duplicate symptoms', () => {
  const result = validateEntry(
    validBody({ symptoms: ['vomiting', 'Vomiting', 'coughing'] }),
  );
  assert.deepEqual(result.symptoms, ['vomiting', 'coughing']);
});

test('validateEntry treats missing or null symptoms as none', () => {
  const noSymptoms = validBody();
  delete noSymptoms.symptoms;
  assert.deepEqual(validateEntry(noSymptoms).symptoms, []);
  assert.deepEqual(validateEntry(validBody({ symptoms: null })).symptoms, []);
});

test('validateEntry drops fields users should not control', () => {
  const result = validateEntry(
    validBody({
      userId: 'someone-else',
      needsAttention: true,
      predictedProbability: 0.99,
      _id: 'abc123',
      isAdmin: true,
    }),
  );
  assert.deepEqual(Object.keys(result).sort(), [
    'activity',
    'date',
    'food',
    'petName',
    'petSpecies',
    'symptoms',
    'water',
    'weight',
  ]);
});

test('validateEntry does not change the original body', () => {
  const body = validBody({
    petName: ' Luna ',
    food: '2',
    symptoms: ['Vomiting'],
  });
  const copy = structuredClone(body);
  validateEntry(body);
  assert.deepEqual(body, copy);
});

test('validateEntry output works with extractFeatures', () => {
  const clean = validateEntry(validBody({ symptoms: ['Vomiting'] }));
  assert.equal(extractFeatures(clean, []).length, 10);
});

// validateEntry: boundary and large inputs
test('validateEntry allows 0 for every number', () => {
  const result = validateEntry(
    validBody({ food: 0, water: '0', activity: 0, weight: 0 }),
  );
  assert.equal(result.food, 0);
  assert.equal(result.water, 0);
});

test('validateEntry allows very large numbers', () => {
  assert.equal(validateEntry(validBody({ weight: 1e9 })).weight, 1e9);
});

test('validateEntry allows every symptom at once', () => {
  const all = ['not eating', 'vomiting', 'diarrhea', 'low energy', 'coughing'];
  assert.deepEqual(validateEntry(validBody({ symptoms: all })).symptoms, all);
});

test('validateEntry handles a very long pet name', () => {
  const name = 'L'.repeat(10000);
  assert.equal(validateEntry(validBody({ petName: name })).petName, name);
});

// validateEntry: error handling
test('validateEntry rejects a body that is not an object', () => {
  assert.throws(() => validateEntry(null), Error);
  assert.throws(() => validateEntry(undefined), Error);
  assert.throws(() => validateEntry('entry'), Error);
  assert.throws(() => validateEntry([validBody()]), Error);
  assert.throws(() => validateEntry(), Error);
});

test('validateEntry rejects a missing or blank pet name', () => {
  const noName = validBody();
  delete noName.petName;
  assert.throws(() => validateEntry(noName), Error);
  assert.throws(() => validateEntry(validBody({ petName: '' })), Error);
  assert.throws(() => validateEntry(validBody({ petName: '   ' })), Error);
  assert.throws(() => validateEntry(validBody({ petName: 123 })), Error);
  assert.throws(() => validateEntry(validBody({ petName: null })), Error);
});

test('validateEntry rejects a missing or blank species', () => {
  assert.throws(() => validateEntry(validBody({ petSpecies: '' })), Error);
  assert.throws(() => validateEntry(validBody({ petSpecies: '  ' })), Error);
  assert.throws(() => validateEntry(validBody({ petSpecies: ['dog'] })), Error);
});

test('validateEntry rejects a missing or bad date', () => {
  const noDate = validBody();
  delete noDate.date;
  assert.throws(() => validateEntry(noDate), Error);
  assert.throws(() => validateEntry(validBody({ date: null })), Error);
  assert.throws(() => validateEntry(validBody({ date: '' })), Error);
  assert.throws(() => validateEntry(validBody({ date: 'not a date' })), Error);
  assert.throws(
    () => validateEntry(validBody({ date: new Date('nope') })),
    Error,
  );
});

test('validateEntry rejects blank number fields instead of saving 0', () => {
  for (const field of ['food', 'water', 'activity', 'weight']) {
    assert.throws(
      () => validateEntry(validBody({ [field]: '' })),
      Error,
      `${field} ''`,
    );
    assert.throws(
      () => validateEntry(validBody({ [field]: '   ' })),
      Error,
      `${field} spaces`,
    );
    assert.throws(
      () => validateEntry(validBody({ [field]: null })),
      Error,
      `${field} null`,
    );
    assert.throws(
      () => validateEntry(validBody({ [field]: undefined })),
      Error,
      `${field} undefined`,
    );
  }
});

test('validateEntry rejects true/false instead of saving 1 or 0', () => {
  for (const field of ['food', 'water', 'activity', 'weight']) {
    assert.throws(() => validateEntry(validBody({ [field]: true })), Error);
    assert.throws(() => validateEntry(validBody({ [field]: false })), Error);
  }
});

test('validateEntry rejects number fields that are not numbers', () => {
  for (const field of ['food', 'water', 'activity', 'weight']) {
    assert.throws(() => validateEntry(validBody({ [field]: 'abc' })), Error);
    assert.throws(() => validateEntry(validBody({ [field]: [2] })), Error);
    assert.throws(
      () => validateEntry(validBody({ [field]: { amount: 2 } })),
      Error,
    );
  }
});

test('validateEntry rejects negative numbers', () => {
  for (const field of ['food', 'water', 'activity', 'weight']) {
    assert.throws(() => validateEntry(validBody({ [field]: -1 })), Error);
    assert.throws(() => validateEntry(validBody({ [field]: '-2' })), Error);
  }
});

test('validateEntry rejects NaN and Infinity', () => {
  assert.throws(() => validateEntry(validBody({ food: NaN })), Error);
  assert.throws(() => validateEntry(validBody({ water: Infinity })), Error);
  assert.throws(() => validateEntry(validBody({ weight: 'Infinity' })), Error);
});

test('validateEntry rejects symptoms that are not an array', () => {
  assert.throws(
    () => validateEntry(validBody({ symptoms: 'vomiting' })),
    Error,
  );
  assert.throws(
    () => validateEntry(validBody({ symptoms: { 0: 'vomiting' } })),
    Error,
  );
});

test('validateEntry rejects symptoms that are not strings', () => {
  assert.throws(() => validateEntry(validBody({ symptoms: [1] })), Error);
  assert.throws(() => validateEntry(validBody({ symptoms: [null] })), Error);
  assert.throws(
    () => validateEntry(validBody({ symptoms: ['vomiting', true] })),
    Error,
  );
});

test('validateEntry rejects symptoms not on the list', () => {
  assert.throws(
    () => validateEntry(validBody({ symptoms: ['sneezing'] })),
    Error,
  );
  assert.throws(
    () => validateEntry(validBody({ symptoms: ['vomiting', 'limping'] })),
    Error,
  );
  assert.throws(() => validateEntry(validBody({ symptoms: [''] })), Error);
});
