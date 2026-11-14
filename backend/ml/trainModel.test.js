import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trainFromEntries } from './trainModel.js';
import { saveModel, loadModel } from './modelStore.js';
import { generateEntries } from '../seed/generateEntries.js';

// Seeded random: same numbers every run, so results can be compared
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Helper to build a small labeled entry
function e(day, food, needsAttention, petName = 'Luna') {
  return {
    userId: 'u1',
    petName,
    date: new Date(2026, 9, day),
    food,
    water: 4,
    activity: 40,
    weight: 10,
    symptoms: [],
    needsAttention,
  };
}

// 10 labeled entries with both answers
function tenLabeled() {
  const entries = [];
  for (let day = 1; day <= 10; day++) {
    entries.push(e(day, day % 2 === 0 ? 1 : 2, day % 2 === 0));
  }
  return entries;
}

const seedData = generateEntries({
  petCount: 20,
  endDate: new Date(2026, 10, 1),
  random: seeded(7),
});

// trainFromEntries: normal cases
test('trainFromEntries returns a model, an accuracy, and a training count', () => {
  const result = trainFromEntries(seedData, { random: seeded(1) });
  assert.equal(result.model.weights.length, 10);
  assert.ok(Number.isFinite(result.model.bias));
  assert.ok(result.accuracy >= 0 && result.accuracy <= 1);
  assert.equal(typeof result.trainedOn, 'number');
});

test('trainFromEntries trains on 80% of the labeled entries', () => {
  const result = trainFromEntries(seedData, { random: seeded(1) });
  assert.equal(
    result.trainedOn,
    seedData.length - Math.round(seedData.length * 0.2),
  );
});

test('trainFromEntries scores well on unseen seed data', () => {
  const result = trainFromEntries(generateEntries({ random: seeded(3) }), {
    random: seeded(4),
  });
  assert.ok(result.accuracy > 0.75, `accuracy was ${result.accuracy}`);
});

test('unlabeled entries are not counted as training rows', () => {
  const unlabeled = seedData
    .slice(0, 50)
    .map((x) => ({ ...x, needsAttention: null }));
  const withUnlabeled = trainFromEntries(
    [...seedData.slice(50), ...unlabeled],
    { random: seeded(1) },
  );
  const labeledCount = seedData.length - 50;
  assert.equal(
    withUnlabeled.trainedOn,
    labeledCount - Math.round(labeledCount * 0.2),
  );
});

test('the same seeded random gives the same model every time', () => {
  const a = trainFromEntries(seedData, { random: seeded(9) });
  const b = trainFromEntries(seedData, { random: seeded(9) });
  assert.deepEqual(a, b);
});

test('trainFromEntries uses the learningRate and epochs it is given', () => {
  const short = trainFromEntries(seedData, { epochs: 1, random: seeded(1) });
  const long = trainFromEntries(seedData, { epochs: 300, random: seeded(1) });
  assert.notDeepEqual(short.model, long.model);
});

test('trainFromEntries does not change the input entries', () => {
  const entries = tenLabeled();
  const copy = entries.map((x) => ({ ...x }));
  trainFromEntries(entries, { random: seeded(1) });
  assert.deepEqual(entries, copy);
});

test('the trained model can be saved and loaded', async () => {
  const store = new Map();
  const collection = {
    async replaceOne(filter, doc) {
      store.set(filter._id, doc);
    },
    async findOne(filter) {
      return store.get(filter._id) ?? null;
    },
  };
  const result = trainFromEntries(seedData, { random: seeded(1) });
  await saveModel(collection, result.model, {
    accuracy: result.accuracy,
    trainedOn: result.trainedOn,
  });
  const loaded = await loadModel(collection);
  assert.equal(loaded.accuracy, result.accuracy);
});

// trainFromEntries: boundary cases
test('trainFromEntries works with exactly 10 labeled entries', () => {
  const result = trainFromEntries(tenLabeled(), { random: seeded(1) });
  assert.equal(result.trainedOn, 8);
});

test('trainFromEntries rejects 9 labeled entries', () => {
  assert.throws(
    () => trainFromEntries(tenLabeled().slice(0, 9)),
    /at least 10/,
  );
});

test('trainFromEntries rejects 10 entries when some are unlabeled', () => {
  const entries = tenLabeled();
  entries[0].needsAttention = null;
  assert.throws(() => trainFromEntries(entries), /at least 10/);
});

test('trainFromEntries rejects an empty list', () => {
  assert.throws(() => trainFromEntries([]), /at least 10/);
});

test('trainFromEntries rejects data with only one kind of answer', () => {
  const allTrue = tenLabeled().map((x) => ({ ...x, needsAttention: true }));
  const allFalse = tenLabeled().map((x) => ({ ...x, needsAttention: false }));
  assert.throws(() => trainFromEntries(allTrue), /both/);
  assert.throws(() => trainFromEntries(allFalse), /both/);
});

// trainFromEntries: error handling
test('trainFromEntries rejects entries that are not an array', () => {
  assert.throws(() => trainFromEntries(null), TypeError);
  assert.throws(() => trainFromEntries('entries'), TypeError);
});

test('trainFromEntries rejects badly shaped entries', () => {
  assert.throws(() => trainFromEntries([{ food: 2 }]), TypeError);
});

test('trainFromEntries rejects bad training options', () => {
  assert.throws(() => trainFromEntries(tenLabeled(), { epochs: 0 }), Error);
  assert.throws(
    () => trainFromEntries(tenLabeled(), { learningRate: -1 }),
    Error,
  );
  assert.throws(
    () => trainFromEntries(tenLabeled(), { random: 'abc' }),
    TypeError,
  );
});
