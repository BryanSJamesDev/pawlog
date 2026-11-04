import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBaseline } from './features.js';

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