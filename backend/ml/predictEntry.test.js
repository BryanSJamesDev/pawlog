import { test } from 'node:test';
import assert from 'node:assert/strict';
import { predictEntry } from './predictEntry.js';
import { sigmoid, predict } from './logisticRegression.js';
import { extractFeatures } from './features.js';
import { trainFromEntries } from './trainModel.js';
import { generateEntries } from '../seed/generateEntries.js';

// Helper to build an entry quickly
function e(day, food, symptoms = []) {
  return {
    userId: 'u1',
    petName: 'Luna',
    date: new Date(2026, 9, day),
    food,
    water: 4,
    activity: 40,
    weight: 10,
    symptoms,
  };
}

// A model with every weight at 0: always predicts 0.5
const zeroModel = { weights: new Array(10).fill(0), bias: 0 };

// A model that only cares about food: eating less raises the probability
const foodModel = { weights: [-5, 0, 0, 0, 0, 0, 0, 0, 0, 0], bias: -1 };

const normalPast = [e(1, 2), e(2, 2), e(3, 2)];

// predictEntry: normal cases
test('predictEntry returns a probability and a flagged value', () => {
  const result = predictEntry(e(4, 2), normalPast, zeroModel);
  assert.deepEqual(Object.keys(result).sort(), ['flagged', 'probability']);
  assert.equal(result.probability, 0.5);
});

test('predictEntry matches extractFeatures + predict done by hand', () => {
  const entry = e(4, 1, ['vomiting']);
  const expected = predict(
    extractFeatures(entry, normalPast),
    foodModel.weights,
    foodModel.bias,
  );
  assert.ok(
    Math.abs(
      predictEntry(entry, normalPast, foodModel).probability - expected,
    ) < 1e-10,
  );
});

test('eating less gives a higher probability with the food model', () => {
  const normal = predictEntry(e(4, 2), normalPast, foodModel).probability;
  const low = predictEntry(e(4, 1), normalPast, foodModel).probability;
  assert.ok(low > normal);
});

test('a pet with no past entries gets sigmoid(bias) from the food model', () => {
  const result = predictEntry(e(1, 1), [], foodModel);
  assert.ok(Math.abs(result.probability - sigmoid(-1)) < 1e-10);
});

test('predictEntry uses only the 14 most recent past entries', () => {
  // 6 old days at 10 cups, then 14 recent days at 2 cups
  const past = [];
  for (let day = 1; day <= 20; day++) {
    past.push(e(day, day <= 6 ? 10 : 2));
  }
  // Today at 2 cups matches the recent 14 exactly, so no change from normal
  const result = predictEntry(e(21, 2), past, foodModel);
  assert.ok(Math.abs(result.probability - sigmoid(-1)) < 1e-10);
});

test('the order of past entries does not matter', () => {
  const past = [];
  for (let day = 1; day <= 20; day++) {
    past.push(e(day, day <= 6 ? 10 : 2));
  }
  const shuffled = [...past].reverse();
  assert.deepEqual(
    predictEntry(e(21, 1), shuffled, foodModel),
    predictEntry(e(21, 1), past, foodModel),
  );
});

test('predictEntry does not change the order of past entries', () => {
  const past = [e(3, 2), e(1, 2), e(2, 2)];
  const copy = past.map((x) => ({ ...x }));
  predictEntry(e(4, 1), past, foodModel);
  assert.deepEqual(past, copy);
});

test('a model trained on seed data scores sick days higher than healthy days', () => {
  const entries = generateEntries({ petCount: 20 });
  const { model } = trainFromEntries(entries);
  const sick = [];
  const healthy = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const past = entries.slice(0, i).filter((x) => x.petName === entry.petName);
    const { probability } = predictEntry(entry, past, model);
    (entry.needsAttention ? sick : healthy).push(probability);
  }
  const average = (list) => list.reduce((sum, p) => sum + p, 0) / list.length;
  assert.ok(average(sick) > average(healthy));
});

// predictEntry: threshold
test('a probability exactly at the threshold is flagged', () => {
  assert.equal(predictEntry(e(4, 2), normalPast, zeroModel).flagged, true); // 0.5 >= 0.5
});

test('a probability below the threshold is not flagged', () => {
  assert.equal(
    predictEntry(e(4, 2), normalPast, zeroModel, 0.6).flagged,
    false,
  );
});

test('a threshold of 0 flags everything', () => {
  assert.equal(predictEntry(e(4, 2), normalPast, foodModel, 0).flagged, true);
});

test('a threshold of 1 flags nothing for a normal entry', () => {
  assert.equal(predictEntry(e(4, 2), normalPast, foodModel, 1).flagged, false);
});

// predictEntry: error handling
test('predictEntry rejects a missing or bad model', () => {
  assert.throws(() => predictEntry(e(4, 2), normalPast, null), TypeError);
  assert.throws(() => predictEntry(e(4, 2), normalPast, undefined), TypeError);
  assert.throws(() => predictEntry(e(4, 2), normalPast, {}), TypeError);
  assert.throws(
    () => predictEntry(e(4, 2), normalPast, { weights: 'abc', bias: 0 }),
    TypeError,
  );
});

test('predictEntry rejects a model with the wrong number of weights', () => {
  assert.throws(
    () => predictEntry(e(4, 2), normalPast, { weights: [1, 2, 3], bias: 0 }),
    Error,
  );
});

test('predictEntry rejects a model with a missing bias', () => {
  assert.throws(
    () => predictEntry(e(4, 2), normalPast, { weights: new Array(10).fill(0) }),
    TypeError,
  );
});

test('predictEntry rejects a bad threshold', () => {
  for (const threshold of [-0.1, 1.1, NaN, Infinity, '0.5', null]) {
    assert.throws(
      () => predictEntry(e(4, 2), normalPast, zeroModel, threshold),
      TypeError,
    );
  }
});

test('predictEntry rejects past entries that are not an array', () => {
  assert.throws(() => predictEntry(e(4, 2), null, zeroModel), TypeError);
  assert.throws(() => predictEntry(e(4, 2), 'past', zeroModel), TypeError);
});

test('predictEntry rejects a bad entry', () => {
  assert.throws(() => predictEntry(null, normalPast, zeroModel), TypeError);
  assert.throws(
    () => predictEntry({ food: 'lots' }, normalPast, zeroModel),
    TypeError,
  );
});

test('predictEntry rejects past entries without a date', () => {
  const past = [{ food: 2, water: 4, activity: 40, weight: 10 }];
  assert.throws(() => predictEntry(e(4, 1), past, zeroModel), TypeError);
});
