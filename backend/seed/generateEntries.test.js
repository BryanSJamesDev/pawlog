import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBetween, makePet, makeDay } from './generateEntries.js';
import { SYMPTOMS, extractFeatures } from '../ml/features.js';

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

// makeDay: shared test data
const testPet = {
    petName: 'Luna',
    petSpecies: 'dog',
    userId: 'seed-user-1',
    normal: { food: 3, water: 4, activity: 60, weight: 50 },
};
const testDate = new Date('2026-11-01');

function assertNear(actual, expected) {
    assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);
}

// makeDay: normal cases
test('makeDay healthy day at the middle of the range matches normal', () => {
    // random 0.5 gives a 1.0x change, and 0.5 is not below 0.05, so no symptom
    const day = makeDay(testPet, testDate, false, always(0.5));
    assertNear(day.food, 3);
    assertNear(day.water, 4);
    assert.equal(day.activity, 60);
    assertNear(day.weight, 50);
    assert.deepEqual(day.symptoms, []);
    assert.equal(day.needsAttention, false);
});

test('makeDay healthy day at the low end is 90% of normal with one symptom', () => {
    // random 0 gives 0.9x, and 0 is below 0.05, so one symptom at index 0
    const day = makeDay(testPet, testDate, false, always(0));
    assertNear(day.food, 2.7);
    assertNear(day.water, 3.6);
    assert.equal(day.activity, 54);
    assertNear(day.weight, 45);
    assert.deepEqual(day.symptoms, ['not eating']);
});

test('makeDay sick day matches hand-worked values', () => {
    // food 3*0.5, water 4*0.95, activity 60*0.45, weight 50*0.985
    // 0.5 is not below 0.5, so 2 symptoms starting at index 2
    const day = makeDay(testPet, testDate, true, always(0.5));
    assertNear(day.food, 1.5);
    assertNear(day.water, 3.8);
    assert.equal(day.activity, 27);
    assertNear(day.weight, 49.25);
    assert.deepEqual(day.symptoms, ['diarrhea', 'low energy']);
    assert.equal(day.needsAttention, true);
});

test('makeDay sick day at the low end has one symptom', () => {
    const day = makeDay(testPet, testDate, true, always(0));
    assertNear(day.food, 0.9);
    assertNear(day.water, 2.4);
    assert.equal(day.activity, 18);
    assertNear(day.weight, 48.5);
    assert.deepEqual(day.symptoms, ['not eating']);
});

test('makeDay wraps around the symptom list for the second symptom', () => {
    // start = floor(0.9 * 5) = 4 (coughing), next wraps to 0 (not eating)
    const day = makeDay(testPet, testDate, true, always(0.9));
    assert.deepEqual(day.symptoms, ['coughing', 'not eating']);
});

test('makeDay copies the pet info and date into the entry', () => {
    const day = makeDay(testPet, testDate, false);
    assert.equal(day.petName, 'Luna');
    assert.equal(day.petSpecies, 'dog');
    assert.equal(day.userId, 'seed-user-1');
    assert.equal(day.date.getTime(), testDate.getTime());
    assert.equal(day.predictedProbability, null);
});

test('makeDay returns every field in the entries schema', () => {
    const day = makeDay(testPet, testDate, false);
    assert.deepEqual(Object.keys(day).sort(), [
        'activity', 'date', 'food', 'needsAttention', 'petName', 'petSpecies',
        'predictedProbability', 'symptoms', 'userId', 'water', 'weight',
    ]);
});

test('makeDay rounds food, water, and weight to 2 decimals and activity to whole numbers', () => {
    const pet = { ...testPet, normal: { food: 1 / 3, water: 2 / 3, activity: 33.7, weight: 10 / 3 } };
    const day = makeDay(pet, testDate, false, always(0.5));
    assert.equal(day.food, 0.33);
    assert.equal(day.water, 0.67);
    assert.equal(day.activity, 34);
    assert.equal(day.weight, 3.33);
});

test('healthy days stay within 90% to 110% of normal', () => {
    for (let i = 0; i < 500; i++) {
        const day = makeDay(testPet, testDate, false);
        assert.ok(day.food >= 2.7 - 0.01 && day.food <= 3.3 + 0.01);
        assert.ok(day.activity >= 54 && day.activity <= 66);
    }
});

test('sick days have much lower food and activity', () => {
    for (let i = 0; i < 500; i++) {
        const day = makeDay(testPet, testDate, true);
        assert.ok(day.food >= 0.9 - 0.01 && day.food <= 2.1 + 0.01);
        assert.ok(day.activity >= 18 && day.activity <= 36);
    }
});

test('healthy days have 0 or 1 symptoms and sick days have 1 or 2', () => {
    for (let i = 0; i < 500; i++) {
        const healthy = makeDay(testPet, testDate, false);
        const sick = makeDay(testPet, testDate, true);
        assert.ok(healthy.symptoms.length <= 1);
        assert.ok(sick.symptoms.length >= 1 && sick.symptoms.length <= 2);
    }
});

test('makeDay symptoms are always from the list, lowercase, and not repeated', () => {
    for (let i = 0; i < 500; i++) {
        const { symptoms } = makeDay(testPet, testDate, true);
        assert.equal(new Set(symptoms).size, symptoms.length);
        for (const s of symptoms) {
            assert.ok(SYMPTOMS.includes(s));
        }
    }
});

test('makeDay output works with extractFeatures', () => {
    const past = [makeDay(testPet, new Date('2026-10-31'), false)];
    const today = makeDay(testPet, testDate, true);
    assert.equal(extractFeatures(today, past).length, 10);
});

test('makeDay does not change the pet', () => {
    const pet = { ...testPet, normal: { ...testPet.normal } };
    makeDay(pet, testDate, true);
    assert.deepEqual(pet, testPet);
});

// makeDay: boundary and large inputs
test('makeDay handles zero normal values', () => {
    const pet = { ...testPet, normal: { food: 0, water: 0, activity: 0, weight: 0 } };
    const day = makeDay(pet, testDate, true, always(0.5));
    assert.equal(day.food, 0);
    assert.equal(day.activity, 0);
});

test('makeDay handles very large normal values', () => {
    const pet = { ...testPet, normal: { food: 1e6, water: 1e6, activity: 1e6, weight: 1e6 } };
    const day = makeDay(pet, testDate, false, always(0.5));
    assert.equal(day.food, 1e6);
    assert.equal(day.activity, 1e6);
});

// makeDay: error handling
test('makeDay rejects a missing or bad pet', () => {
    assert.throws(() => makeDay(null, testDate, false), TypeError);
    assert.throws(() => makeDay(undefined, testDate, false), TypeError);
    assert.throws(() => makeDay('Luna', testDate, false), TypeError);
    assert.throws(() => makeDay({ petName: 'Luna' }, testDate, false), TypeError);
    assert.throws(() => makeDay({ normal: 'high' }, testDate, false), TypeError);
});

test('makeDay rejects bad normal values', () => {
    const bad = (normal) => ({ ...testPet, normal: { ...testPet.normal, ...normal } });
    assert.throws(() => makeDay(bad({ food: '3' }), testDate, false), TypeError);
    assert.throws(() => makeDay(bad({ water: null }), testDate, false), TypeError);
    assert.throws(() => makeDay(bad({ activity: NaN }), testDate, false), TypeError);
    assert.throws(() => makeDay(bad({ weight: Infinity }), testDate, false), TypeError);
    assert.throws(() => makeDay({ ...testPet, normal: { food: 1, water: 1, activity: 1 } }, testDate, false), TypeError);
});

test('makeDay rejects a bad date', () => {
    assert.throws(() => makeDay(testPet, '2026-11-01', false), TypeError);
    assert.throws(() => makeDay(testPet, new Date('not a date'), false), TypeError);
    assert.throws(() => makeDay(testPet, null, false), TypeError);
    assert.throws(() => makeDay(testPet, undefined, false), TypeError);
    assert.throws(() => makeDay(testPet, 1730419200000, false), TypeError);
});

test('makeDay rejects isSick that is not true or false', () => {
    assert.throws(() => makeDay(testPet, testDate, 'true'), TypeError);
    assert.throws(() => makeDay(testPet, testDate, 1), TypeError);
    assert.throws(() => makeDay(testPet, testDate, null), TypeError);
    assert.throws(() => makeDay(testPet, testDate, undefined), TypeError);
    assert.throws(() => makeDay(testPet, testDate), TypeError);
});