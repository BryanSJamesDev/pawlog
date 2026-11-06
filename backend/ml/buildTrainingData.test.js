import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTrainingData } from './buildTrainingData.js';
import { train, accuracy, trainTestSplit } from './logisticRegression.js';
import { generateEntries } from '../seed/generateEntries.js';

// Helper to build an entry quickly
function e(date, food, needsAttention, { userId = 'u1', petName = 'Luna' } = {}) {
    return { userId, petName, date, food, water: 4, activity: 40, weight: 10, symptoms: [], needsAttention };
}

// buildTrainingData: normal cases
test('buildTrainingData returns one row and one label per labeled entry', () => {
    const entries = [e('2026-11-01', 2, false), e('2026-11-02', 2, true), e('2026-11-03', 2, false)];
    const { X, y } = buildTrainingData(entries);
    assert.equal(X.length, 3);
    assert.equal(y.length, 3);
    assert.ok(X.every((row) => row.length === 10));
});

test('buildTrainingData turns true into 1 and false into 0', () => {
    const { y } = buildTrainingData([e('2026-11-01', 2, true), e('2026-11-02', 2, false)]);
    assert.deepEqual(y, [1, 0]);
});

test('buildTrainingData skips entries with no label', () => {
    const entries = [e('2026-11-01', 2, null), e('2026-11-02', 2, undefined), e('2026-11-03', 2, true)];
    const { X, y } = buildTrainingData(entries);
    assert.equal(X.length, 1);
    assert.deepEqual(y, [1]);
});

test('buildTrainingData skips labels that are not exactly true or false', () => {
    const entries = [e('2026-11-01', 2, 'true'), e('2026-11-02', 2, 1), e('2026-11-03', 2, 0)];
    assert.equal(buildTrainingData(entries).X.length, 0);
});

test('a pet\'s first entry has no past, so its change features are 0', () => {
    const { X } = buildTrainingData([e('2026-11-01', 5, true)]);
    assert.deepEqual(X[0].slice(0, 4), [0, 0, 0, 0]);
});

test('unlabeled entries still count as past for later entries', () => {
    // Day 1 (unlabeled) ate 2 cups, day 2 ate 1 cup: 50% less
    const { X } = buildTrainingData([e('2026-11-01', 2, null), e('2026-11-02', 1, true)]);
    assert.ok(Math.abs(X[0][0] - -0.5) < 1e-10);
});

test('buildTrainingData sorts each pet\'s entries by date', () => {
    const inOrder = [e('2026-11-01', 2, false), e('2026-11-02', 1, true), e('2026-11-03', 3, false)];
    const reversed = [...inOrder].reverse();
    assert.deepEqual(buildTrainingData(reversed), buildTrainingData(inOrder));
});

test('buildTrainingData works with Date objects as well as strings', () => {
    const strings = [e('2026-11-01', 2, false), e('2026-11-02', 1, true)];
    const dates = strings.map((x) => ({ ...x, date: new Date(x.date) }));
    assert.deepEqual(buildTrainingData(dates), buildTrainingData(strings));
});

test('each pet is compared only to its own past', () => {
    // Milo eats 10 cups a day, but Luna's first entry should still have no past
    const entries = [
        e('2026-11-01', 10, false, { petName: 'Milo' }),
        e('2026-11-02', 10, false, { petName: 'Milo' }),
        e('2026-11-03', 2, true, { petName: 'Luna' }),
    ];
    const { X, y } = buildTrainingData(entries);
    const lunaRow = X[y.indexOf(1)];
    assert.equal(lunaRow[0], 0);
});

test('two users with a pet of the same name are kept separate', () => {
    const entries = [
        e('2026-11-01', 10, false, { userId: 'u1' }),
        e('2026-11-02', 2, true, { userId: 'u2' }),
    ];
    const { X, y } = buildTrainingData(entries);
    // u2's Luna has no past of her own, so no change from normal
    assert.equal(X[y.indexOf(1)][0], 0);
});

test('only the last 14 entries count as past', () => {
    // 5 old days at 10 cups, then 15 days at 2 cups. Only the last day is labeled.
    const entries = [];
    for (let day = 1; day <= 20; day++) {
        const date = `2026-10-${String(day).padStart(2, '0')}`;
        entries.push(e(date, day <= 5 ? 10 : 2, day === 20 ? true : null));
    }
    const { X } = buildTrainingData(entries);
    // The 14 days before day 20 are all 2 cups, so no change. If the old 10-cup days counted, this wouldn't be 0.
    assert.ok(Math.abs(X[0][0]) < 1e-10);
});

test('buildTrainingData does not change the input order', () => {
    const entries = [e('2026-11-03', 2, false), e('2026-11-01', 2, true)];
    const copy = entries.map((x) => ({ ...x }));
    buildTrainingData(entries);
    assert.deepEqual(entries, copy);
});

test('buildTrainingData works with real seed data and the model learns from it', () => {
    const entries = generateEntries();
    const { X, y } = buildTrainingData(entries);
    assert.equal(X.length, entries.length); // every seed entry is labeled
    const { XTrain, yTrain, XTest, yTest } = trainTestSplit(X, y);
    const model = train(XTrain, yTrain, { learningRate: 0.5, epochs: 500 });
    assert.ok(accuracy(XTest, yTest, model) > 0.75);
});

// buildTrainingData: boundary inputs
test('buildTrainingData returns empty lists for no entries', () => {
    assert.deepEqual(buildTrainingData([]), { X: [], y: [] });
});

test('buildTrainingData returns empty lists when nothing is labeled', () => {
    assert.deepEqual(buildTrainingData([e('2026-11-01', 2, null), e('2026-11-02', 2, null)]), { X: [], y: [] });
});

// buildTrainingData: error handling
test('buildTrainingData rejects a non-array', () => {
    assert.throws(() => buildTrainingData(null), TypeError);
    assert.throws(() => buildTrainingData(undefined), TypeError);
    assert.throws(() => buildTrainingData('entries'), TypeError);
    assert.throws(() => buildTrainingData({ 0: e('2026-11-01', 2, true) }), TypeError);
});

test('buildTrainingData rejects entries that are not objects', () => {
    assert.throws(() => buildTrainingData([null]), TypeError);
    assert.throws(() => buildTrainingData([5]), TypeError);
});

test('buildTrainingData rejects a missing or bad userId or petName', () => {
    assert.throws(() => buildTrainingData([{ ...e('2026-11-01', 2, true), userId: undefined }]), TypeError);
    assert.throws(() => buildTrainingData([{ ...e('2026-11-01', 2, true), userId: 123 }]), TypeError);
    assert.throws(() => buildTrainingData([{ ...e('2026-11-01', 2, true), petName: null }]), TypeError);
});

test('buildTrainingData rejects a missing or bad date', () => {
    assert.throws(() => buildTrainingData([{ ...e('2026-11-01', 2, true), date: null }]), TypeError);
    assert.throws(() => buildTrainingData([{ ...e('2026-11-01', 2, true), date: undefined }]), TypeError);
    assert.throws(() => buildTrainingData([{ ...e('2026-11-01', 2, true), date: 'not a date' }]), TypeError);
});

test('buildTrainingData passes up bad entry values from extractFeatures', () => {
    assert.throws(() => buildTrainingData([{ ...e('2026-11-01', 2, true), food: 'lots' }]), TypeError);
});