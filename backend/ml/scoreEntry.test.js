import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreEntry } from './scoreEntry.js';
import { predictEntry } from './predictEntry.js';
import { sigmoid } from './logisticRegression.js';

// Helper to build an entry quickly
function e(day, food) {
    return { userId: 'u1', petName: 'Luna', date: new Date(2026, 9, day), food, water: 4, activity: 40, weight: 10, symptoms: [] };
}

const zeroModel = { _id: 'health-alerts', weights: new Array(10).fill(0), bias: 0 };
const foodModel = { _id: 'health-alerts', weights: [-5, 0, 0, 0, 0, 0, 0, 0, 0, 0], bias: -1 };

// Fake models collection
function fakeModels(model, { fail = false } = {}) {
    return {
        async findOne() {
            if (fail) {
                throw new Error('models down');
            }
            return model;
        },
    };
}

// Fake entries collection that records the query and returns the given past entries
function fakeEntries(past = [], { fail = false } = {}) {
    const record = {};
    return {
        record,
        find(filter) {
            record.filter = filter;
            if (fail) {
                throw new Error('entries down');
            }
            return {
                sort(sortBy) {
                    record.sort = sortBy;
                    return this;
                },
                limit(count) {
                    record.limit = count;
                    return this;
                },
                async toArray() {
                    return past;
                },
            };
        },
    };
}

// scoreEntry: normal cases
test('scoreEntry returns the probability from the model', async () => {
    const result = await scoreEntry({
        entries: fakeEntries([e(1, 2)]),
        models: fakeModels(zeroModel),
        userId: 'u1',
        entry: e(2, 2),
    });
    assert.equal(result, 0.5);
});

test('scoreEntry matches predictEntry run by hand', async () => {
    const past = [e(1, 2), e(2, 2)];
    const entry = e(3, 1);
    const result = await scoreEntry({ entries: fakeEntries(past), models: fakeModels(foodModel), userId: 'u1', entry });
    assert.ok(Math.abs(result - predictEntry(entry, past, foodModel).probability) < 1e-10);
});

test('scoreEntry uses the past entries it finds', async () => {
    // Eating half as much as before should score higher than having no past
    const withPast = await scoreEntry({ entries: fakeEntries([e(1, 2)]), models: fakeModels(foodModel), userId: 'u1', entry: e(2, 1) });
    assert.ok(withPast > sigmoid(-1));
});

test('scoreEntry gives sigmoid(bias) when a pet has no past entries', async () => {
    const result = await scoreEntry({ entries: fakeEntries([]), models: fakeModels(foodModel), userId: 'u1', entry: e(1, 1) });
    assert.ok(Math.abs(result - sigmoid(-1)) < 1e-10);
});

// scoreEntry: the database query
test('scoreEntry searches only this user and pet, before this date', async () => {
    const entries = fakeEntries();
    const entry = e(5, 2);
    await scoreEntry({ entries, models: fakeModels(zeroModel), userId: 'u1', entry });
    assert.deepEqual(entries.record.filter, { userId: 'u1', petName: 'Luna', date: { $lt: entry.date } });
});

test('scoreEntry gets the 14 most recent entries, newest first', async () => {
    const entries = fakeEntries();
    await scoreEntry({ entries, models: fakeModels(zeroModel), userId: 'u1', entry: e(5, 2) });
    assert.deepEqual(entries.record.sort, { date: -1 });
    assert.equal(entries.record.limit, 14);
});

test('scoreEntry leaves out the entry being edited', async () => {
    const entries = fakeEntries();
    await scoreEntry({ entries, models: fakeModels(zeroModel), userId: 'u1', entry: e(5, 2), excludeId: 'abc123' });
    assert.deepEqual(entries.record.filter._id, { $ne: 'abc123' });
});

test('scoreEntry does not add an _id filter for new entries', async () => {
    const entries = fakeEntries();
    await scoreEntry({ entries, models: fakeModels(zeroModel), userId: 'u1', entry: e(5, 2) });
    assert.equal('_id' in entries.record.filter, false);
});

test('scoreEntry does not change the entry', async () => {
    const entry = e(5, 2);
    const copy = { ...entry };
    await scoreEntry({ entries: fakeEntries(), models: fakeModels(zeroModel), userId: 'u1', entry });
    assert.deepEqual(entry, copy);
});

// scoreEntry: returns null instead of blocking a save
test('scoreEntry returns null when no model has been trained', async () => {
    const entries = fakeEntries();
    const result = await scoreEntry({ entries, models: fakeModels(null), userId: 'u1', entry: e(5, 2) });
    assert.equal(result, null);
    assert.equal(entries.record.filter, undefined); // didn't bother searching
});

test('scoreEntry returns null when loading the model fails', async (t) => {
    t.mock.method(console, 'error', () => {});
    const result = await scoreEntry({ entries: fakeEntries(), models: fakeModels(null, { fail: true }), userId: 'u1', entry: e(5, 2) });
    assert.equal(result, null);
});

test('scoreEntry returns null when the saved model is invalid', async (t) => {
    t.mock.method(console, 'error', () => {});
    const badModel = { _id: 'health-alerts', weights: [1, 2], bias: 0 };
    const result = await scoreEntry({ entries: fakeEntries(), models: fakeModels(badModel), userId: 'u1', entry: e(5, 2) });
    assert.equal(result, null);
});

test('scoreEntry returns null when finding past entries fails', async (t) => {
    t.mock.method(console, 'error', () => {});
    const result = await scoreEntry({ entries: fakeEntries([], { fail: true }), models: fakeModels(zeroModel), userId: 'u1', entry: e(5, 2) });
    assert.equal(result, null);
});

test('scoreEntry returns null for a bad entry', async (t) => {
    t.mock.method(console, 'error', () => {});
    const result = await scoreEntry({ entries: fakeEntries(), models: fakeModels(zeroModel), userId: 'u1', entry: { petName: 'Luna', food: 'lots' } });
    assert.equal(result, null);
});

test('scoreEntry logs the error when it returns null because of a problem', async (t) => {
    const logged = t.mock.method(console, 'error', () => {});
    await scoreEntry({ entries: fakeEntries(), models: fakeModels(null, { fail: true }), userId: 'u1', entry: e(5, 2) });
    assert.equal(logged.mock.callCount(), 1);
});