import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBetween, makePet } from './generateEntries.js';

// Fake random that always returns the same value
const always = (value) => () => value;

// randomBetween: normal cases
test('randomBetween returns min when random gives 0', () => {
    assert.equal(randomBetween(2, 10, always(0)), 2);
});

test('randomBetween returns the middle when random gives 0.5', () => {
    assert.equal(randomBetween(2, 10, always(0.5)), 6);
});

test('randomBetween stays below max when random is just under 1', () => {
    const result = randomBetween(2, 10, always(0.999999));
    assert.ok(result < 10 && result > 9.99);
});

test('randomBetween with the default random stays in range', () => {
    for (let i = 0; i < 1000; i++) {
        const result = randomBetween(0.5, 1.5);
        assert.ok(result >= 0.5 && result < 1.5);
    }
});

test('randomBetween works with negative ranges', () => {
    assert.equal(randomBetween(-10, -2, always(0.5)), -6);
});

test('randomBetween works with decimals', () => {
    assert.ok(Math.abs(randomBetween(0.5, 1, always(0.5)) - 0.75) < 1e-10);
});

// randomBetween: boundary and large inputs
test('randomBetween returns min when min equals max', () => {
    assert.equal(randomBetween(5, 5, always(0.7)), 5);
});

test('randomBetween handles a very large range', () => {
    assert.equal(randomBetween(0, 1e9, always(0.5)), 5e8);
});

// randomBetween: error handling
test('randomBetween rejects non-number min or max', () => {
    assert.throws(() => randomBetween('1', 5), TypeError);
    assert.throws(() => randomBetween(1, '5'), TypeError);
    assert.throws(() => randomBetween(null, 5), TypeError);
    assert.throws(() => randomBetween(1, undefined), TypeError);
    assert.throws(() => randomBetween(), TypeError);
});

test('randomBetween rejects NaN and Infinity', () => {
    assert.throws(() => randomBetween(NaN, 5), TypeError);
    assert.throws(() => randomBetween(1, Infinity), TypeError);
    assert.throws(() => randomBetween(-Infinity, 1), TypeError);
});

test('randomBetween rejects min greater than max', () => {
    assert.throws(() => randomBetween(10, 2), Error);
});

// makePet: normal cases
test('makePet uses the first name for index 0', () => {
    assert.equal(makePet(0).petName, 'Luna');
});

test('makePet uses the last name on the list without a number', () => {
    assert.equal(makePet(29).petName, 'Stella');
});

test('makePet adds a number once the names run out', () => {
    assert.equal(makePet(30).petName, 'Luna 2');
    assert.equal(makePet(31).petName, 'Max 2');
    assert.equal(makePet(61).petName, 'Max 3');
});

test('makePet gives every pet a unique name across many pets', () => {
    const names = new Set();
    for (let i = 0; i < 200; i++) {
        names.add(makePet(i).petName);
    }
    assert.equal(names.size, 200);
});

test('makePet picks dog when random is below 0.5', () => {
    assert.equal(makePet(0, always(0.2)).petSpecies, 'dog');
});

test('makePet picks cat when random is 0.5 or higher', () => {
    assert.equal(makePet(0, always(0.5)).petSpecies, 'cat');
    assert.equal(makePet(0, always(0.9)).petSpecies, 'cat');
});

test('makePet spreads pets across 10 seed users', () => {
    assert.equal(makePet(0).userId, 'seed-user-1');
    assert.equal(makePet(9).userId, 'seed-user-10');
    assert.equal(makePet(10).userId, 'seed-user-1');
    assert.equal(makePet(23).userId, 'seed-user-4');
});

test('makePet returns the right shape', () => {
    const pet = makePet(3);
    assert.deepEqual(Object.keys(pet).sort(), ['normal', 'petName', 'petSpecies', 'userId']);
    assert.deepEqual(Object.keys(pet.normal).sort(), ['activity', 'food', 'water', 'weight']);
});

test('makePet gives a dog the minimum values when random is 0', () => {
    const pet = makePet(0, always(0));
    assert.equal(pet.petSpecies, 'dog');
    assert.deepEqual(pet.normal, { food: 2, water: 3, activity: 30, weight: 20 });
});

test('makePet gives a cat values from the cat ranges', () => {
    const pet = makePet(0, always(0.5));
    assert.equal(pet.petSpecies, 'cat');
    assert.ok(Math.abs(pet.normal.food - 0.75) < 1e-10);
    assert.ok(Math.abs(pet.normal.water - 1) < 1e-10);
    assert.ok(Math.abs(pet.normal.activity - 25) < 1e-10);
    assert.ok(Math.abs(pet.normal.weight - 11) < 1e-10);
});

test('makePet keeps normal values inside the species ranges', () => {
    const ranges = {
        dog: { food: [2, 4], water: [3, 6], activity: [30, 90], weight: [20, 80] },
        cat: { food: [0.5, 1], water: [0.5, 1.5], activity: [10, 40], weight: [7, 15] },
    };
    for (let i = 0; i < 500; i++) {
        const pet = makePet(i);
        for (const [field, [min, max]] of Object.entries(ranges[pet.petSpecies])) {
            assert.ok(pet.normal[field] >= min && pet.normal[field] <= max);
        }
    }
});

test('makePet gives the same pet for the same index and fake random', () => {
    assert.deepEqual(makePet(7, always(0.3)), makePet(7, always(0.3)));
});

test('makePet makes both dogs and cats with the default random', () => {
    const species = new Set();
    for (let i = 0; i < 200; i++) {
        species.add(makePet(i).petSpecies);
    }
    assert.deepEqual([...species].sort(), ['cat', 'dog']);
});

// makePet: boundary and large inputs
test('makePet handles a very large index', () => {
    const pet = makePet(100000);
    assert.equal(pet.petName, 'Rocky 3334');
    assert.equal(pet.userId, 'seed-user-1');
});

// makePet: error handling
test('makePet rejects invalid indexes', () => {
    assert.throws(() => makePet(-1), TypeError);
    assert.throws(() => makePet(1.5), TypeError);
    assert.throws(() => makePet('1'), TypeError);
    assert.throws(() => makePet(null), TypeError);
    assert.throws(() => makePet(undefined), TypeError);
    assert.throws(() => makePet(NaN), TypeError);
    assert.throws(() => makePet(Infinity), TypeError);
    assert.throws(() => makePet(), TypeError);
});