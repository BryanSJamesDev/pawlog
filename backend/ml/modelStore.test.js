import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveModel, loadModel } from './modelStore.js';
import { train, predict } from './logisticRegression.js';
import { buildTrainingData } from './buildTrainingData.js';
import { generateEntries } from '../seed/generateEntries.js';

// Fake collection that stores documents in memory by _id
function fakeCollection({ failReplace = false, failFind = false } = {}) {
  const store = new Map();
  const calls = [];
  return {
    store,
    calls,
    async replaceOne(filter, doc, options) {
      calls.push({ op: 'replaceOne', filter, doc, options });
      if (failReplace) {
        throw new Error('replace failed');
      }
      if (store.has(filter._id) || options?.upsert) {
        store.set(filter._id, doc);
      }
      return { acknowledged: true };
    },
    async findOne(filter) {
      calls.push({ op: 'findOne', filter });
      if (failFind) {
        throw new Error('find failed');
      }
      return store.get(filter._id) ?? null;
    },
  };
}

const goodModel = () => ({
  weights: [0.1, -0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  bias: -0.5,
});

// saveModel: normal cases
test('saveModel returns the saved document', async () => {
  const doc = await saveModel(fakeCollection(), goodModel(), {
    accuracy: 0.87,
    trainedOn: 1500,
  });
  assert.equal(doc._id, 'health-alerts');
  assert.deepEqual(doc.weights, goodModel().weights);
  assert.equal(doc.bias, -0.5);
  assert.equal(doc.accuracy, 0.87);
  assert.equal(doc.trainedOn, 1500);
  assert.ok(doc.trainedAt instanceof Date);
});

test('saveModel uses replaceOne with upsert and the fixed id', async () => {
  const collection = fakeCollection();
  await saveModel(collection, goodModel());
  assert.deepEqual(collection.calls[0].filter, { _id: 'health-alerts' });
  assert.deepEqual(collection.calls[0].options, { upsert: true });
});

test('saveModel sets accuracy and trainedOn to null when not given', async () => {
  const doc = await saveModel(fakeCollection(), goodModel());
  assert.equal(doc.accuracy, null);
  assert.equal(doc.trainedOn, null);
});

test('saveModel keeps an accuracy of 0 instead of turning it into null', async () => {
  const doc = await saveModel(fakeCollection(), goodModel(), {
    accuracy: 0,
    trainedOn: 0,
  });
  assert.equal(doc.accuracy, 0);
  assert.equal(doc.trainedOn, 0);
});

test('saving twice replaces the model instead of adding a second one', async () => {
  const collection = fakeCollection();
  await saveModel(collection, goodModel(), { accuracy: 0.8 });
  await saveModel(collection, { ...goodModel(), bias: 2 }, { accuracy: 0.9 });
  assert.equal(collection.store.size, 1);
  assert.equal(collection.store.get('health-alerts').bias, 2);
});

// loadModel: normal cases
test('loadModel returns null when no model has been saved', async () => {
  assert.equal(await loadModel(fakeCollection()), null);
});

test('loadModel returns the model that was saved', async () => {
  const collection = fakeCollection();
  await saveModel(collection, goodModel(), { accuracy: 0.87 });
  const loaded = await loadModel(collection);
  assert.deepEqual(loaded.weights, goodModel().weights);
  assert.equal(loaded.accuracy, 0.87);
});

test('loadModel searches by the fixed id', async () => {
  const collection = fakeCollection();
  await loadModel(collection);
  assert.deepEqual(collection.calls[0].filter, { _id: 'health-alerts' });
});

test('a model trained on seed data can be saved, loaded, and used to predict', async () => {
  const { X, y } = buildTrainingData(generateEntries({ petCount: 10 }));
  const model = train(X, y, { learningRate: 0.5, epochs: 200 });
  const collection = fakeCollection();
  await saveModel(collection, model, { trainedOn: X.length });
  const loaded = await loadModel(collection);
  const probability = predict(X[0], loaded.weights, loaded.bias);
  assert.ok(probability >= 0 && probability <= 1);
});

// saveModel: boundary inputs
test('saveModel accepts weights of exactly 0 and very large values', async () => {
  await saveModel(fakeCollection(), {
    weights: new Array(10).fill(0),
    bias: 0,
  });
  await saveModel(fakeCollection(), {
    weights: new Array(10).fill(1e6),
    bias: -1e6,
  });
});

// saveModel: error handling
test('saveModel rejects a bad collection', async () => {
  await assert.rejects(() => saveModel(null, goodModel()), TypeError);
  await assert.rejects(() => saveModel({}, goodModel()), TypeError);
  await assert.rejects(
    () => saveModel({ replaceOne: 'nope' }, goodModel()),
    TypeError,
  );
});

test('saveModel rejects a missing model', async () => {
  await assert.rejects(() => saveModel(fakeCollection(), null), TypeError);
  await assert.rejects(() => saveModel(fakeCollection(), undefined), TypeError);
  await assert.rejects(() => saveModel(fakeCollection(), {}), TypeError);
});

test('saveModel rejects the wrong number of weights', async () => {
  await assert.rejects(
    () =>
      saveModel(fakeCollection(), { weights: new Array(9).fill(0), bias: 0 }),
    TypeError,
  );
  await assert.rejects(
    () =>
      saveModel(fakeCollection(), { weights: new Array(11).fill(0), bias: 0 }),
    TypeError,
  );
  await assert.rejects(
    () => saveModel(fakeCollection(), { weights: [], bias: 0 }),
    TypeError,
  );
});

test('saveModel rejects weights that are not finite numbers', async () => {
  const bad = (value) => {
    const weights = new Array(10).fill(0);
    weights[3] = value;
    return { weights, bias: 0 };
  };
  for (const value of ['1', null, undefined, NaN, Infinity, true]) {
    await assert.rejects(
      () => saveModel(fakeCollection(), bad(value)),
      TypeError,
    );
  }
});

test('saveModel rejects a bad bias', async () => {
  for (const bias of ['0', null, undefined, NaN, -Infinity]) {
    await assert.rejects(
      () => saveModel(fakeCollection(), { ...goodModel(), bias }),
      TypeError,
    );
  }
});

test('saveModel does not write anything when the model is bad', async () => {
  const collection = fakeCollection();
  await assert.rejects(
    () => saveModel(collection, { weights: [1], bias: 0 }),
    TypeError,
  );
  assert.equal(collection.calls.length, 0);
});

test('saveModel passes up database errors', async () => {
  await assert.rejects(
    () => saveModel(fakeCollection({ failReplace: true }), goodModel()),
    /replace failed/,
  );
});

// loadModel: error handling
test('loadModel rejects a bad collection', async () => {
  await assert.rejects(() => loadModel(null), TypeError);
  await assert.rejects(() => loadModel({}), TypeError);
});

test('loadModel rejects a saved model with the wrong number of weights', async () => {
  const collection = fakeCollection();
  // An old model saved before the features changed
  collection.store.set('health-alerts', {
    _id: 'health-alerts',
    weights: new Array(9).fill(0),
    bias: 0,
  });
  await assert.rejects(() => loadModel(collection), /invalid/);
});

test('loadModel rejects a saved model with bad values', async () => {
  const collection = fakeCollection();
  collection.store.set('health-alerts', {
    _id: 'health-alerts',
    weights: new Array(10).fill('x'),
    bias: 0,
  });
  await assert.rejects(() => loadModel(collection), /invalid/);
  collection.store.set('health-alerts', {
    _id: 'health-alerts',
    weights: new Array(10).fill(0),
  });
  await assert.rejects(() => loadModel(collection), /invalid/);
});

test('loadModel passes up database errors', async () => {
  await assert.rejects(
    () => loadModel(fakeCollection({ failFind: true })),
    /find failed/,
  );
});
