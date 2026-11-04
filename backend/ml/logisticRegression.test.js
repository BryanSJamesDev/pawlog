import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sigmoid, predict } from './logisticRegression.js';

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