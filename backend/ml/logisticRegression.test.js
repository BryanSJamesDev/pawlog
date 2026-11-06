import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sigmoid,
  predict,
  train,
  accuracy,
  trainTestSplit,
} from './logisticRegression.js';

// Normal cases
test('sigmoid returns 0.5 when input is 0', () => {
  assert.equal(sigmoid(0), 0.5);
});

test('sigmoid returns a value greater than 0.5 for positive input', () => {
  assert.ok(sigmoid(2) > 0.5);
});

test('sigmoid returns a value less than 0.5 for negative input', () => {
  assert.ok(sigmoid(-2) < 0.5);
});

test('sigmoid is symmetric: sigmoid(z) + sigmoid(-z) equals 1', () => {
  for (const z of [0.5, 2, 10]) {
    const sum = sigmoid(z) + sigmoid(-z);
    assert.ok(Math.abs(sum - 1) < 1e-10);
  }
});

test('sigmoid always returns a value between 0 and 1', () => {
  for (const z of [-50, -5, -0.1, 0.1, 5, 50]) {
    const result = sigmoid(z);
    assert.ok(result >= 0 && result <= 1);
  }
});

// Boundary and large inputs
test('sigmoid returns close to 1 for very large positive input', () => {
  assert.ok(sigmoid(1000) > 0.999);
});

test('sigmoid returns close to 0 for very large negative input without NaN', () => {
  const result = sigmoid(-1000);
  assert.ok(!Number.isNaN(result));
  assert.ok(result < 0.001);
});

test('sigmoid handles very small inputs near 0', () => {
  assert.ok(Math.abs(sigmoid(1e-10) - 0.5) < 1e-9);
});

// Error handling
test('sigmoid rejects non-number inputs', () => {
  assert.throws(() => sigmoid('2'), TypeError);
  assert.throws(() => sigmoid(null), TypeError);
  assert.throws(() => sigmoid(undefined), TypeError);
  assert.throws(() => sigmoid([]), TypeError);
  assert.throws(() => sigmoid({}), TypeError);
  assert.throws(() => sigmoid(true), TypeError);
});

test('sigmoid rejects missing input', () => {
  assert.throws(() => sigmoid(), TypeError);
});

test('sigmoid rejects non-finite numbers', () => {
  assert.throws(() => sigmoid(Infinity), TypeError);
  assert.throws(() => sigmoid(-Infinity), TypeError);
  assert.throws(() => sigmoid(NaN), TypeError);
});

// predict: normal cases
test('predict matches the hand-worked example', () => {
  // (2 * 1) + (0.5 * -2) + 0.5 = 1.5
  assert.ok(Math.abs(predict([2, 0.5], [1, -2], 0.5) - sigmoid(1.5)) < 1e-10);
});

test('predict returns 0.5 when all weights and bias are 0', () => {
  assert.equal(predict([5, 10, 3], [0, 0, 0], 0), 0.5);
});

test('predict returns sigmoid(bias) when all features are 0', () => {
  assert.ok(Math.abs(predict([0, 0], [3, -4], 1.2) - sigmoid(1.2)) < 1e-10);
});

test('predict works with a single feature', () => {
  assert.ok(Math.abs(predict([3], [2], 0) - sigmoid(6)) < 1e-10);
});

test('predict always returns a value between 0 and 1', () => {
  const result = predict([1, -2, 3.5], [0.4, 0.9, -1.1], -0.3);
  assert.ok(result >= 0 && result <= 1);
});

test('higher weighted total gives higher probability', () => {
  const low = predict([1], [1], 0);
  const high = predict([5], [1], 0);
  assert.ok(high > low);
});

// predict: boundary and large inputs
test('predict handles very large weighted totals without NaN', () => {
  assert.ok(predict([1000], [1000], 0) > 0.999);
  const veryLow = predict([1000], [-1000], 0);
  assert.ok(!Number.isNaN(veryLow) && veryLow < 0.001);
});

test('predict handles many features', () => {
  const features = new Array(10000).fill(0.001);
  const weights = new Array(10000).fill(0.001);
  const result = predict(features, weights, 0);
  assert.ok(result > 0.5 && result < 1);
});

test('predict does not change the input arrays', () => {
  const features = [1, 2];
  const weights = [3, 4];
  predict(features, weights, 0);
  assert.deepEqual(features, [1, 2]);
  assert.deepEqual(weights, [3, 4]);
});

// predict: error handling
test('predict rejects non-array features or weights', () => {
  assert.throws(() => predict('1,2', [1, 2], 0), TypeError);
  assert.throws(() => predict([1, 2], null, 0), TypeError);
  assert.throws(() => predict(undefined, [1], 0), TypeError);
  assert.throws(() => predict({ 0: 1 }, [1], 0), TypeError);
});

test('predict rejects mismatched lengths', () => {
  assert.throws(() => predict([1, 2], [1], 0), Error);
  assert.throws(() => predict([1], [1, 2], 0), Error);
});

test('predict rejects empty arrays', () => {
  assert.throws(() => predict([], [], 0), Error);
});

test('predict rejects invalid bias', () => {
  assert.throws(() => predict([1], [1], '0'), TypeError);
  assert.throws(() => predict([1], [1], null), TypeError);
  assert.throws(() => predict([1], [1], undefined), TypeError);
  assert.throws(() => predict([1], [1], NaN), TypeError);
  assert.throws(() => predict([1], [1], Infinity), TypeError);
});

test('predict rejects non-number values inside the arrays', () => {
  assert.throws(() => predict(['2'], [1], 0), TypeError);
  assert.throws(() => predict([null], [1], 0), TypeError);
  assert.throws(() => predict([undefined], [1], 0), TypeError);
  assert.throws(() => predict([1], ['1'], 0), TypeError);
  assert.throws(() => predict([true], [1], 0), TypeError);
});

test('predict rejects NaN or Infinity inside the arrays', () => {
  assert.throws(() => predict([NaN], [1], 0), TypeError);
  assert.throws(() => predict([Infinity], [1], 0), TypeError);
});

// train: shared test data
// Simple pattern: small values are 0, large values are 1
const simpleX = [[0], [1], [2], [3], [4], [5]];
const simpleY = [0, 0, 0, 1, 1, 1];

// train: normal cases
test('train returns weights and bias with the right shape', () => {
  const model = train(simpleX, simpleY);
  assert.ok(Array.isArray(model.weights));
  assert.equal(model.weights.length, 1);
  assert.equal(typeof model.bias, 'number');
  assert.ok(Number.isFinite(model.bias));
  assert.ok(model.weights.every(Number.isFinite));
});

test('train matches a hand-worked single epoch', () => {
  // Start: weights [0], bias 0, prediction 0.5, error 0.5 - 1 = -0.5
  // weight = 0 - 0.1 * (-0.5 * 1) / 1 = 0.05
  // bias   = 0 - 0.1 * (-0.5) / 1 = 0.05
  const model = train([[1]], [1], { learningRate: 0.1, epochs: 1 });
  assert.ok(Math.abs(model.weights[0] - 0.05) < 1e-10);
  assert.ok(Math.abs(model.bias - 0.05) < 1e-10);
});

test('train learns a simple increasing pattern', () => {
  const { weights, bias } = train(simpleX, simpleY, {
    learningRate: 0.5,
    epochs: 2000,
  });
  assert.ok(predict([0], weights, bias) < 0.5);
  assert.ok(predict([5], weights, bias) > 0.5);
  assert.ok(weights[0] > 0);
});

test('train learns a decreasing pattern with a negative weight', () => {
  const flippedY = [1, 1, 1, 0, 0, 0];
  const { weights, bias } = train(simpleX, flippedY, {
    learningRate: 0.5,
    epochs: 2000,
  });
  assert.ok(predict([0], weights, bias) > 0.5);
  assert.ok(predict([5], weights, bias) < 0.5);
  assert.ok(weights[0] < 0);
});

test('train classifies all training examples correctly on clear data', () => {
  const { weights, bias } = train(simpleX, simpleY, {
    learningRate: 0.5,
    epochs: 3000,
  });
  for (let i = 0; i < simpleX.length; i++) {
    const guess = predict(simpleX[i], weights, bias) >= 0.5 ? 1 : 0;
    assert.equal(guess, simpleY[i]);
  }
});

test('train works with multiple features', () => {
  // Only the first feature matters; the second is noise
  const X = [
    [0, 3],
    [1, 1],
    [2, 4],
    [8, 2],
    [9, 5],
    [10, 1],
  ];
  const y = [0, 0, 0, 1, 1, 1];
  const { weights, bias } = train(X, y, { learningRate: 0.1, epochs: 3000 });
  assert.equal(weights.length, 2);
  assert.ok(predict([0, 3], weights, bias) < 0.5);
  assert.ok(predict([10, 3], weights, bias) > 0.5);
});

test('more epochs move predictions closer to the right answer', () => {
  const short = train(simpleX, simpleY, { epochs: 10 });
  const long = train(simpleX, simpleY, { epochs: 2000 });
  const shortGuess = predict([5], short.weights, short.bias);
  const longGuess = predict([5], long.weights, long.bias);
  assert.ok(longGuess > shortGuess);
});

test('train with all 0 answers predicts below 0.5', () => {
  const { weights, bias } = train([[1], [2], [3]], [0, 0, 0], { epochs: 500 });
  assert.ok(predict([2], weights, bias) < 0.5);
});

test('train with all 1 answers predicts above 0.5', () => {
  const { weights, bias } = train([[1], [2], [3]], [1, 1, 1], { epochs: 500 });
  assert.ok(predict([2], weights, bias) > 0.5);
});

test('train uses default options when none are given', () => {
  const withDefaults = train(simpleX, simpleY);
  const explicit = train(simpleX, simpleY, { learningRate: 0.1, epochs: 1000 });
  assert.deepEqual(withDefaults, explicit);
});

test('train gives the same result every time for the same input', () => {
  assert.deepEqual(train(simpleX, simpleY), train(simpleX, simpleY));
});

test('train does not change the input arrays', () => {
  const X = [
    [1, 2],
    [3, 4],
  ];
  const y = [0, 1];
  train(X, y, { epochs: 5 });
  assert.deepEqual(X, [
    [1, 2],
    [3, 4],
  ]);
  assert.deepEqual(y, [0, 1]);
});

// train: boundary and large inputs
test('train works with a single example', () => {
  const model = train([[2]], [1], { epochs: 10 });
  assert.equal(model.weights.length, 1);
});

test('train handles 1000+ examples', () => {
  const X = [];
  const y = [];
  for (let i = 0; i < 1200; i++) {
    const value = i % 10;
    X.push([value]);
    y.push(value >= 5 ? 1 : 0);
  }
  const { weights, bias } = train(X, y, { learningRate: 0.5, epochs: 300 });
  assert.ok(predict([9], weights, bias) > 0.5);
  assert.ok(predict([0], weights, bias) < 0.5);
});

// train: error handling
test('train rejects non-array X or y', () => {
  assert.throws(() => train('abc', [0]), TypeError);
  assert.throws(() => train([[1]], null), TypeError);
  assert.throws(() => train(undefined, [0]), TypeError);
  assert.throws(() => train([[1]], { 0: 1 }), TypeError);
});

test('train rejects empty or mismatched X and y', () => {
  assert.throws(() => train([], []), Error);
  assert.throws(() => train([[1], [2]], [0]), Error);
  assert.throws(() => train([[1]], [0, 1]), Error);
});

test('train rejects bad rows', () => {
  assert.throws(() => train([1, 2], [0, 1]), Error);
  assert.throws(() => train([[]], [0]), Error);
  assert.throws(() => train([[1, 2], [3]], [0, 1]), Error);
  assert.throws(() => train([[1], 'x'], [0, 1]), Error);
});

test('train rejects y values that are not exactly 0 or 1', () => {
  assert.throws(() => train([[1]], [2]), Error);
  assert.throws(() => train([[1]], [-1]), Error);
  assert.throws(() => train([[1]], [0.5]), Error);
  assert.throws(() => train([[1]], ['1']), Error);
  assert.throws(() => train([[1]], [true]), Error);
  assert.throws(() => train([[1]], [null]), Error);
});

test('train rejects invalid learning rates', () => {
  assert.throws(() => train(simpleX, simpleY, { learningRate: 0 }), Error);
  assert.throws(() => train(simpleX, simpleY, { learningRate: -0.1 }), Error);
  assert.throws(() => train(simpleX, simpleY, { learningRate: NaN }), Error);
  assert.throws(
    () => train(simpleX, simpleY, { learningRate: Infinity }),
    Error,
  );
  assert.throws(() => train(simpleX, simpleY, { learningRate: '0.1' }), Error);
});

test('train rejects invalid epochs', () => {
  assert.throws(() => train(simpleX, simpleY, { epochs: 0 }), Error);
  assert.throws(() => train(simpleX, simpleY, { epochs: -5 }), Error);
  assert.throws(() => train(simpleX, simpleY, { epochs: 1.5 }), Error);
  assert.throws(() => train(simpleX, simpleY, { epochs: '10' }), Error);
  assert.throws(() => train(simpleX, simpleY, { epochs: NaN }), Error);
});

test('train rejects non-number feature values', () => {
  assert.throws(() => train([['1']], [1]), TypeError);
  assert.throws(() => train([[null]], [1]), TypeError);
  assert.throws(() => train([[NaN]], [1]), TypeError);
});

// accuracy: normal cases
test('accuracy returns 1 for a model that gets everything right', () => {
  // 10x - 25: negative for 0-2, positive for 3-5
  const model = { weights: [10], bias: -25 };
  assert.equal(accuracy(simpleX, simpleY, model), 1);
});

test('accuracy returns 0 for a model that gets everything wrong', () => {
  const model = { weights: [-10], bias: 25 };
  assert.equal(accuracy(simpleX, simpleY, model), 0);
});

test('accuracy returns the right fraction for partly correct guesses', () => {
  // Always predicts 1 (prob 0.5 >= 0.5), so it gets 2 of 3 right
  const model = { weights: [0], bias: 0 };
  const result = accuracy([[1], [2], [3]], [1, 1, 0], model);
  assert.ok(Math.abs(result - 2 / 3) < 1e-10);
});

test('accuracy works with the output of train', () => {
  const model = train(simpleX, simpleY, { learningRate: 0.5, epochs: 3000 });
  assert.equal(accuracy(simpleX, simpleY, model), 1);
});

test('accuracy works with multiple features', () => {
  const model = { weights: [1, 0], bias: -5 };
  const X = [
    [0, 9],
    [2, 9],
    [8, 0],
    [10, 0],
  ];
  const y = [0, 0, 1, 1];
  assert.equal(accuracy(X, y, model), 1);
});

test('accuracy always returns a value between 0 and 1', () => {
  const model = { weights: [0.3], bias: -1 };
  const result = accuracy(simpleX, simpleY, model);
  assert.ok(result >= 0 && result <= 1);
});

// accuracy: threshold behavior
test('a probability exactly at the threshold counts as 1', () => {
  // prob is exactly 0.5
  const model = { weights: [0], bias: 0 };
  assert.equal(accuracy([[0]], [1], model, 0.5), 1);
  assert.equal(accuracy([[0]], [0], model, 0.5), 0);
});

test('changing the threshold changes the guesses', () => {
  const model = { weights: [0], bias: 0 }; // prob 0.5
  assert.equal(accuracy([[0]], [0], model, 0.6), 1);
  assert.equal(accuracy([[0]], [0], model, 0.4), 0);
});

test('threshold of 0 guesses 1 for everything', () => {
  const model = { weights: [-5], bias: 0 };
  assert.equal(accuracy([[1], [2]], [1, 1], model, 0), 1);
});

test('accuracy uses 0.5 as the default threshold', () => {
  const model = { weights: [0.3], bias: -1 };
  assert.equal(
    accuracy(simpleX, simpleY, model),
    accuracy(simpleX, simpleY, model, 0.5),
  );
});

// accuracy: boundary and large inputs
test('accuracy works with a single example', () => {
  const model = { weights: [1], bias: 0 };
  assert.equal(accuracy([[5]], [1], model), 1);
});

test('accuracy handles 1000+ examples', () => {
  const X = [];
  const y = [];
  for (let i = 0; i < 1500; i++) {
    X.push([i % 10]);
    y.push(i % 10 >= 5 ? 1 : 0);
  }
  const model = { weights: [10], bias: -45 };
  assert.equal(accuracy(X, y, model), 1);
});

test('accuracy does not change the inputs', () => {
  const X = [[1], [2]];
  const y = [0, 1];
  const model = { weights: [1], bias: 0 };
  accuracy(X, y, model);
  assert.deepEqual(X, [[1], [2]]);
  assert.deepEqual(y, [0, 1]);
  assert.deepEqual(model, { weights: [1], bias: 0 });
});

// accuracy: error handling
test('accuracy rejects non-array X or y', () => {
  const model = { weights: [1], bias: 0 };
  assert.throws(() => accuracy('abc', [0], model), TypeError);
  assert.throws(() => accuracy([[1]], null, model), TypeError);
  assert.throws(() => accuracy(undefined, [0], model), TypeError);
});

test('accuracy rejects empty or mismatched X and y', () => {
  const model = { weights: [1], bias: 0 };
  assert.throws(() => accuracy([], [], model), Error);
  assert.throws(() => accuracy([[1], [2]], [0], model), Error);
});

test('accuracy rejects y values that are not 0 or 1', () => {
  const model = { weights: [1], bias: 0 };
  assert.throws(() => accuracy([[1]], [2], model), Error);
  assert.throws(() => accuracy([[1]], ['1'], model), Error);
  assert.throws(() => accuracy([[1]], [true], model), Error);
  assert.throws(() => accuracy([[1]], [null], model), Error);
});

test('accuracy rejects a missing or bad model', () => {
  assert.throws(() => accuracy([[1]], [1], null), TypeError);
  assert.throws(() => accuracy([[1]], [1], undefined), TypeError);
  assert.throws(() => accuracy([[1]], [1], {}), TypeError);
  assert.throws(
    () => accuracy([[1]], [1], { weights: 'abc', bias: 0 }),
    TypeError,
  );
});

test('accuracy rejects a model with a missing or bad bias', () => {
  assert.throws(() => accuracy([[1]], [1], { weights: [1] }), TypeError);
  assert.throws(
    () => accuracy([[1]], [1], { weights: [1], bias: '0' }),
    TypeError,
  );
});

test('accuracy rejects rows that do not match the number of weights', () => {
  const model = { weights: [1, 2], bias: 0 };
  assert.throws(() => accuracy([[1]], [1], model), Error);
});

test('accuracy rejects invalid thresholds', () => {
  const model = { weights: [1], bias: 0 };
  assert.throws(() => accuracy([[1]], [1], model, -0.1), TypeError);
  assert.throws(() => accuracy([[1]], [1], model, 1.1), TypeError);
  assert.throws(() => accuracy([[1]], [1], model, NaN), TypeError);
  assert.throws(() => accuracy([[1]], [1], model, '0.5'), TypeError);
  assert.throws(() => accuracy([[1]], [1], model, null), TypeError);
});

// trainTestSplit: shared test data
// Each row is [i] and its answer is i % 2, so we can check pairs stay together
function makeData(m) {
  const X = [];
  const y = [];
  for (let i = 0; i < m; i++) {
    X.push([i]);
    y.push(i % 2);
  }
  return { X, y };
}

// Fake random that never swaps (j always equals i), so order stays the same
const noShuffle = () => 0.999999;

// trainTestSplit: normal cases
test('trainTestSplit makes the right sizes with the default ratio', () => {
  const { X, y } = makeData(10);
  const split = trainTestSplit(X, y);
  assert.equal(split.XTest.length, 2);
  assert.equal(split.yTest.length, 2);
  assert.equal(split.XTrain.length, 8);
  assert.equal(split.yTrain.length, 8);
});

test('trainTestSplit uses a custom ratio', () => {
  const { X, y } = makeData(10);
  const split = trainTestSplit(X, y, 0.3);
  assert.equal(split.XTest.length, 3);
  assert.equal(split.XTrain.length, 7);
});

test('every example ends up in exactly one set', () => {
  const { X, y } = makeData(20);
  const split = trainTestSplit(X, y);
  const all = [...split.XTrain, ...split.XTest]
    .map((row) => row[0])
    .sort((a, b) => a - b);
  assert.deepEqual(
    all,
    X.map((row) => row[0]),
  );
});

test('rows stay paired with their answers', () => {
  const { X, y } = makeData(50);
  const split = trainTestSplit(X, y);
  split.XTrain.forEach((row, i) => assert.equal(split.yTrain[i], row[0] % 2));
  split.XTest.forEach((row, i) => assert.equal(split.yTest[i], row[0] % 2));
});

test('with no shuffling, the test set is the first rows', () => {
  const { X, y } = makeData(10);
  const split = trainTestSplit(X, y, 0.2, noShuffle);
  assert.deepEqual(split.XTest, [[0], [1]]);
  assert.deepEqual(split.yTest, [0, 1]);
  assert.deepEqual(split.XTrain, X.slice(2));
});

test('the same fake random gives the same split every time', () => {
  const { X, y } = makeData(15);
  const fake = () => 0.3;
  assert.deepEqual(
    trainTestSplit(X, y, 0.2, fake),
    trainTestSplit(X, y, 0.2, fake),
  );
});

test('shuffling mixes ordered data into the test set', () => {
  // First half all 0s, second half all 1s
  const X = [];
  const y = [];
  for (let i = 0; i < 1000; i++) {
    X.push([i]);
    y.push(i < 500 ? 0 : 1);
  }
  const { yTest } = trainTestSplit(X, y);
  assert.ok(yTest.includes(0));
  assert.ok(yTest.includes(1));
});

test('trainTestSplit does not change the inputs', () => {
  const { X, y } = makeData(10);
  const XCopy = X.map((row) => [...row]);
  const yCopy = [...y];
  trainTestSplit(X, y);
  assert.deepEqual(X, XCopy);
  assert.deepEqual(y, yCopy);
});

test('trainTestSplit output works with train and accuracy', () => {
  const X = [];
  const y = [];
  for (let i = 0; i < 200; i++) {
    X.push([i % 10]);
    y.push(i % 10 >= 5 ? 1 : 0);
  }
  const { XTrain, yTrain, XTest, yTest } = trainTestSplit(X, y);
  const model = train(XTrain, yTrain, { learningRate: 0.5, epochs: 2000 });
  assert.ok(accuracy(XTest, yTest, model) > 0.9);
});

// trainTestSplit: boundary and large inputs
test('trainTestSplit works with exactly 2 examples', () => {
  const split = trainTestSplit([[1], [2]], [0, 1]);
  assert.equal(split.XTest.length, 1);
  assert.equal(split.XTrain.length, 1);
});

test('a tiny ratio still puts at least 1 example in the test set', () => {
  const { X, y } = makeData(10);
  const split = trainTestSplit(X, y, 0.01);
  assert.equal(split.XTest.length, 1);
  assert.equal(split.XTrain.length, 9);
});

test('a huge ratio still leaves at least 1 example for training', () => {
  const { X, y } = makeData(10);
  const split = trainTestSplit(X, y, 0.99);
  assert.equal(split.XTest.length, 9);
  assert.equal(split.XTrain.length, 1);
});

test('trainTestSplit rounds the test size', () => {
  const { X, y } = makeData(7);
  const split = trainTestSplit(X, y, 0.5); // 3.5 rounds to 4
  assert.equal(split.XTest.length, 4);
  assert.equal(split.XTrain.length, 3);
});

test('trainTestSplit handles 10000 examples', () => {
  const { X, y } = makeData(10000);
  const split = trainTestSplit(X, y);
  assert.equal(split.XTest.length, 2000);
  assert.equal(split.XTrain.length, 8000);
});

// trainTestSplit: error handling
test('trainTestSplit rejects non-array X or y', () => {
  assert.throws(() => trainTestSplit('abc', [0, 1]), TypeError);
  assert.throws(() => trainTestSplit([[1], [2]], null), TypeError);
  assert.throws(() => trainTestSplit(undefined, [0, 1]), TypeError);
});

test('trainTestSplit rejects mismatched lengths', () => {
  assert.throws(() => trainTestSplit([[1], [2], [3]], [0, 1]), Error);
});

test('trainTestSplit rejects fewer than 2 examples', () => {
  assert.throws(() => trainTestSplit([], []), Error);
  assert.throws(() => trainTestSplit([[1]], [0]), Error);
});

test('trainTestSplit rejects invalid ratios', () => {
  const { X, y } = makeData(10);
  assert.throws(() => trainTestSplit(X, y, 0), TypeError);
  assert.throws(() => trainTestSplit(X, y, 1), TypeError);
  assert.throws(() => trainTestSplit(X, y, -0.2), TypeError);
  assert.throws(() => trainTestSplit(X, y, 1.5), TypeError);
  assert.throws(() => trainTestSplit(X, y, NaN), TypeError);
  assert.throws(() => trainTestSplit(X, y, '0.2'), TypeError);
  assert.throws(() => trainTestSplit(X, y, null), TypeError);
});

test('trainTestSplit rejects a random that is not a function', () => {
  const { X, y } = makeData(10);
  assert.throws(() => trainTestSplit(X, y, 0.2, 'abc'), TypeError);
  assert.throws(() => trainTestSplit(X, y, 0.2, 5), TypeError);
  assert.throws(() => trainTestSplit(X, y, 0.2, null), TypeError);
});

test('trainTestSplit rejects a random that returns bad values', () => {
  const { X, y } = makeData(10);
  assert.throws(() => trainTestSplit(X, y, 0.2, () => 1), TypeError);
  assert.throws(() => trainTestSplit(X, y, 0.2, () => -0.1), TypeError);
  assert.throws(() => trainTestSplit(X, y, 0.2, () => NaN), TypeError);
  assert.throws(() => trainTestSplit(X, y, 0.2, () => '0.5'), TypeError);
});
