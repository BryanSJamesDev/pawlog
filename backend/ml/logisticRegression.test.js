import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sigmoid } from './logisticRegression.js';

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