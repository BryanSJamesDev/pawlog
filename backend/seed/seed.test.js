import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedEntries } from './seed.js';
import { generateEntries } from './generateEntries.js';

// Fake collection that records what it was asked to do
function fakeCollection({
  existing = 0,
  failDelete = false,
  failInsert = false,
} = {}) {
  const calls = [];
  return {
    calls,
    async deleteMany(filter) {
      calls.push({ op: 'deleteMany', filter });
      if (failDelete) {
        throw new Error('delete failed');
      }
      return { deletedCount: existing };
    },
    async insertMany(docs) {
      calls.push({ op: 'insertMany', docs });
      if (failInsert) {
        throw new Error('insert failed');
      }
      return { insertedCount: docs.length };
    },
  };
}

const seedEntry = (userId = 'seed-user-1') => ({
  userId,
  petName: 'Luna',
  food: 2,
});

// seedEntries: normal cases
test('seedEntries returns how many were deleted and inserted', async () => {
  const collection = fakeCollection({ existing: 1500 });
  const result = await seedEntries(collection, [
    seedEntry(),
    seedEntry('seed-user-2'),
  ]);
  assert.deepEqual(result, { deleted: 1500, inserted: 2 });
});

test('seedEntries deletes only seed users', async () => {
  const collection = fakeCollection();
  await seedEntries(collection, [seedEntry()]);
  assert.deepEqual(collection.calls[0].filter, {
    userId: { $regex: '^seed-user-' },
  });
});

test('seedEntries deletes old data before inserting new data', async () => {
  const collection = fakeCollection();
  await seedEntries(collection, [seedEntry()]);
  assert.deepEqual(
    collection.calls.map((c) => c.op),
    ['deleteMany', 'insertMany'],
  );
});

test('seedEntries inserts exactly the entries it was given', async () => {
  const collection = fakeCollection();
  const entries = [seedEntry('seed-user-1'), seedEntry('seed-user-7')];
  await seedEntries(collection, entries);
  assert.deepEqual(collection.calls[1].docs, entries);
});

test('seedEntries works when there is no old seed data', async () => {
  const result = await seedEntries(fakeCollection({ existing: 0 }), [
    seedEntry(),
  ]);
  assert.equal(result.deleted, 0);
});

test('seedEntries works with real generated entries (1000+ for the rubric)', async () => {
  const entries = generateEntries();
  const result = await seedEntries(fakeCollection(), entries);
  assert.equal(result.inserted, entries.length);
  assert.ok(result.inserted >= 1000);
});

// seedEntries: boundary and large inputs
test('seedEntries works with a single entry', async () => {
  const result = await seedEntries(fakeCollection(), [seedEntry()]);
  assert.equal(result.inserted, 1);
});

test('seedEntries handles a large number of entries', async () => {
  const entries = Array.from({ length: 20000 }, (_, i) =>
    seedEntry(`seed-user-${(i % 10) + 1}`),
  );
  const result = await seedEntries(fakeCollection(), entries);
  assert.equal(result.inserted, 20000);
});

// seedEntries: safety checks (nothing deleted when input is bad)
test("seedEntries rejects a real user's entry and deletes nothing", async () => {
  const collection = fakeCollection();
  await assert.rejects(
    () => seedEntries(collection, [seedEntry(), seedEntry('real-user-123')]),
    Error,
  );
  assert.equal(collection.calls.length, 0);
});

test('seedEntries rejects userIds that only contain seed-user- in the middle', async () => {
  const collection = fakeCollection();
  await assert.rejects(
    () => seedEntries(collection, [seedEntry('real-seed-user-1')]),
    Error,
  );
  assert.equal(collection.calls.length, 0);
});

test('seedEntries rejects entries with a missing or non-string userId', async () => {
  const collection = fakeCollection();
  await assert.rejects(
    () => seedEntries(collection, [{ petName: 'Luna' }]),
    Error,
  );
  await assert.rejects(() => seedEntries(collection, [{ userId: 123 }]), Error);
  await assert.rejects(
    () => seedEntries(collection, [{ userId: null }]),
    Error,
  );
  await assert.rejects(() => seedEntries(collection, [null]), Error);
  await assert.rejects(() => seedEntries(collection, ['seed-user-1']), Error);
  assert.equal(collection.calls.length, 0);
});

test('seedEntries rejects a non-array or empty entries list', async () => {
  const collection = fakeCollection();
  await assert.rejects(() => seedEntries(collection, null), TypeError);
  await assert.rejects(() => seedEntries(collection, undefined), TypeError);
  await assert.rejects(() => seedEntries(collection, 'entries'), TypeError);
  await assert.rejects(
    () => seedEntries(collection, { 0: seedEntry() }),
    TypeError,
  );
  await assert.rejects(() => seedEntries(collection, []), Error);
  assert.equal(collection.calls.length, 0);
});

test('seedEntries rejects a bad collection', async () => {
  await assert.rejects(() => seedEntries(null, [seedEntry()]), TypeError);
  await assert.rejects(() => seedEntries(undefined, [seedEntry()]), TypeError);
  await assert.rejects(() => seedEntries({}, [seedEntry()]), TypeError);
  await assert.rejects(
    () => seedEntries({ deleteMany: async () => {} }, [seedEntry()]),
    TypeError,
  );
  await assert.rejects(
    () => seedEntries({ insertMany: async () => {} }, [seedEntry()]),
    TypeError,
  );
});

// seedEntries: database errors
test('seedEntries passes up a delete error and does not insert', async () => {
  const collection = fakeCollection({ failDelete: true });
  await assert.rejects(
    () => seedEntries(collection, [seedEntry()]),
    /delete failed/,
  );
  assert.deepEqual(
    collection.calls.map((c) => c.op),
    ['deleteMany'],
  );
});

test('seedEntries passes up an insert error', async () => {
  await assert.rejects(
    () => seedEntries(fakeCollection({ failInsert: true }), [seedEntry()]),
    /insert failed/,
  );
});
