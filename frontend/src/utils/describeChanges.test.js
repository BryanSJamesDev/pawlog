import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentChange, describeChanges } from './describeChanges.js';

const usual = { food: 4, water: 4, activity: 30, weight: 80 };

// percentChange: normal cases
test('percentChange calculates a drop', () => {
  // -62.5 rounds up to -62 (Math.round rounds halves toward positive)
  assert.equal(percentChange(1.5, 4), -62);
});

test('percentChange calculates an increase', () => {
  assert.equal(percentChange(6, 4), 50);
});

test('percentChange returns 0 when nothing changed', () => {
  assert.equal(percentChange(4, 4), 0);
});

test('percentChange returns -100 when the value drops to 0', () => {
  assert.equal(percentChange(0, 4), -100);
});

test('percentChange handles very large increases', () => {
  assert.equal(percentChange(400, 4), 9900);
});

test('percentChange rounds to a whole number', () => {
  assert.equal(percentChange(1, 3), -67);
});

// percentChange: can't calculate
test('percentChange returns null when usual is 0 or negative', () => {
  assert.equal(percentChange(5, 0), null);
  assert.equal(percentChange(5, -2), null);
});

test('percentChange returns null for missing or wrong-type values', () => {
  assert.equal(percentChange(undefined, 4), null);
  assert.equal(percentChange(4, undefined), null);
  assert.equal(percentChange(null, 4), null);
  assert.equal(percentChange('2', 4), null);
  assert.equal(percentChange(2, '4'), null);
});

test('percentChange returns null for NaN and Infinity', () => {
  assert.equal(percentChange(NaN, 4), null);
  assert.equal(percentChange(2, Infinity), null);
});

// describeChanges: normal cases
test("describeChanges describes Jake's sick day, biggest change first", () => {
  const changes = describeChanges({ food: 1.5, water: 3, activity: 10, weight: 79 }, usual);
  assert.deepEqual(
    changes.map((c) => c.text),
    ['Active 67% less than usual', 'Ate 62% less than usual', 'Drank 25% less than usual'],
  );
});

test('describeChanges includes the key and percent for each change', () => {
  const [first] = describeChanges({ food: 1, water: 4, activity: 30, weight: 80 }, usual);
  assert.deepEqual(first, { key: 'food', percent: -75, text: 'Ate 75% less than usual' });
});

test('describeChanges describes increases with "more"', () => {
  const [first] = describeChanges({ food: 4, water: 8, activity: 30, weight: 80 }, usual);
  assert.equal(first.text, 'Drank 100% more than usual');
});

test('describeChanges returns nothing for a normal day', () => {
  assert.deepEqual(describeChanges({ food: 4, water: 4.2, activity: 28, weight: 80 }, usual), []);
});

// describeChanges: the 20% cutoff
test('a change of exactly 20% counts', () => {
  const changes = describeChanges({ food: 3.2, water: 4, activity: 30, weight: 80 }, usual);
  assert.deepEqual(
    changes.map((c) => c.key),
    ['food'],
  );
});

test('a change of 19% does not count', () => {
  const changes = describeChanges({ food: 3.25, water: 4, activity: 30, weight: 80 }, usual);
  assert.deepEqual(changes, []);
});

// describeChanges: missing data
test('describeChanges returns nothing when there is no usual (first entry)', () => {
  assert.deepEqual(describeChanges({ food: 1, water: 1, activity: 1, weight: 1 }, null), []);
});

test('describeChanges returns nothing for a missing entry', () => {
  assert.deepEqual(describeChanges(null, usual), []);
  assert.deepEqual(describeChanges(undefined, usual), []);
});

test('describeChanges skips fields with a usual of 0', () => {
  const changes = describeChanges(
    { food: 1, water: 4, activity: 30, weight: 80 },
    { food: 0, water: 4, activity: 30, weight: 80 },
  );
  assert.deepEqual(changes, []);
});

test('describeChanges skips fields that are missing or the wrong type', () => {
  const changes = describeChanges({ food: '1', water: 4, activity: 30 }, usual);
  assert.deepEqual(changes, []);
});

test('describeChanges does not change its inputs', () => {
  const entry = { food: 1, water: 4, activity: 30, weight: 80 };
  const usualCopy = { ...usual };
  describeChanges(entry, usual);
  assert.deepEqual(entry, { food: 1, water: 4, activity: 30, weight: 80 });
  assert.deepEqual(usual, usualCopy);
});