import { test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { verifyUser, configurePassport } from './passport.js';

// Fake users collection, so no database is needed
function fakeUsers(stored) {
    const calls = [];
    return {
        calls,
        async findOne(query) {
            calls.push(query);
            return stored.find((u) => u.username === query.username) || null;
        },
    };
}

// Low cost (4) keeps tests fast; the real app uses a higher cost
const hash = await bcrypt.hash('secret123', 4);
const storedUser = { _id: 'user-1', username: 'eleah', passwordHash: hash, createdAt: new Date('2026-11-01') };

// verifyUser: normal cases
test('verifyUser returns the user for the right password', async () => {
    const result = await verifyUser(fakeUsers([storedUser]), 'eleah', 'secret123');
    assert.equal(result._id, 'user-1');
    assert.equal(result.username, 'eleah');
});

test('verifyUser never returns the password hash', async () => {
    const result = await verifyUser(fakeUsers([storedUser]), 'eleah', 'secret123');
    assert.equal('passwordHash' in result, false);
});

test('verifyUser keeps the other user fields', async () => {
    const result = await verifyUser(fakeUsers([storedUser]), 'eleah', 'secret123');
    assert.deepEqual(Object.keys(result).sort(), ['_id', 'createdAt', 'username']);
});

test('verifyUser does not change the stored user', async () => {
    const user = { ...storedUser };
    await verifyUser(fakeUsers([user]), 'eleah', 'secret123');
    assert.equal(user.passwordHash, hash);
});

test('verifyUser treats usernames as case-insensitive and trims them', async () => {
    const users = fakeUsers([storedUser]);
    assert.ok(await verifyUser(users, 'Eleah', 'secret123'));
    assert.ok(await verifyUser(users, '  ELEAH  ', 'secret123'));
});

test('verifyUser searches with the lowercased, trimmed username', async () => {
    const users = fakeUsers([storedUser]);
    await verifyUser(users, '  ElEaH ', 'secret123');
    assert.deepEqual(users.calls[0], { username: 'eleah' });
});

// verifyUser: failed logins
test('verifyUser returns null for the wrong password', async () => {
    assert.equal(await verifyUser(fakeUsers([storedUser]), 'eleah', 'wrong'), null);
});

test('verifyUser returns null for an unknown username', async () => {
    assert.equal(await verifyUser(fakeUsers([storedUser]), 'bryan', 'secret123'), null);
});

test('verifyUser treats passwords as case-sensitive', async () => {
    assert.equal(await verifyUser(fakeUsers([storedUser]), 'eleah', 'SECRET123'), null);
});

test('verifyUser does not trim passwords', async () => {
    assert.equal(await verifyUser(fakeUsers([storedUser]), 'eleah', ' secret123'), null);
    assert.equal(await verifyUser(fakeUsers([storedUser]), 'eleah', 'secret123 '), null);
});

test('verifyUser returns null when the stored user has no password hash', async () => {
    const broken = { _id: 'user-2', username: 'broken' };
    assert.equal(await verifyUser(fakeUsers([broken]), 'broken', 'anything'), null);
});

test('verifyUser returns null when the stored hash is not a string', async () => {
    const broken = { _id: 'user-3', username: 'broken', passwordHash: 12345 };
    assert.equal(await verifyUser(fakeUsers([broken]), 'broken', 'anything'), null);
});

// verifyUser: bad input
test('verifyUser returns null for a missing or bad username', async () => {
    const users = fakeUsers([storedUser]);
    assert.equal(await verifyUser(users, '', 'secret123'), null);
    assert.equal(await verifyUser(users, '   ', 'secret123'), null);
    assert.equal(await verifyUser(users, null, 'secret123'), null);
    assert.equal(await verifyUser(users, undefined, 'secret123'), null);
    assert.equal(await verifyUser(users, 123, 'secret123'), null);
    assert.equal(await verifyUser(users, ['eleah'], 'secret123'), null);
});

test('verifyUser returns null for a missing or bad password', async () => {
    const users = fakeUsers([storedUser]);
    assert.equal(await verifyUser(users, 'eleah', ''), null);
    assert.equal(await verifyUser(users, 'eleah', null), null);
    assert.equal(await verifyUser(users, 'eleah', undefined), null);
    assert.equal(await verifyUser(users, 'eleah', 123), null);
    assert.equal(await verifyUser(users, 'eleah', { password: 'secret123' }), null);
});

test('verifyUser does not search the database for bad input', async () => {
    const users = fakeUsers([storedUser]);
    await verifyUser(users, '', 'secret123');
    await verifyUser(users, 'eleah', '');
    await verifyUser(users, null, null);
    assert.equal(users.calls.length, 0);
});

// verifyUser: boundary and large inputs
test('verifyUser works with a long password', async () => {
    const longPassword = 'p'.repeat(60);
    const user = { _id: 'user-4', username: 'long', passwordHash: await bcrypt.hash(longPassword, 4) };
    assert.ok(await verifyUser(fakeUsers([user]), 'long', longPassword));
});

test('verifyUser works with special characters in the password', async () => {
    const special = 'p@$$ w0rd!🐾';
    const user = { _id: 'user-5', username: 'special', passwordHash: await bcrypt.hash(special, 4) };
    assert.ok(await verifyUser(fakeUsers([user]), 'special', special));
});

test('verifyUser finds the right user among many', async () => {
    const many = [];
    for (let i = 0; i < 1000; i++) {
        many.push({ _id: `id-${i}`, username: `user${i}`, passwordHash: hash });
    }
    const result = await verifyUser(fakeUsers(many), 'user777', 'secret123');
    assert.equal(result._id, 'id-777');
});

// verifyUser: error handling
test('verifyUser passes database errors up instead of hiding them as a failed login', async () => {
    const brokenDb = {
        async findOne() {
            throw new Error('database down');
        },
    };
    await assert.rejects(() => verifyUser(brokenDb, 'eleah', 'secret123'), /database down/);
});

// configurePassport: fakes so no real Passport or database is needed
function fakePassport() {
    return {
        use(strategy) {
            this.strategy = strategy;
        },
        serializeUser(fn) {
            this.serialize = fn;
        },
        deserializeUser(fn) {
            this.deserialize = fn;
        },
    };
}

const realId = new ObjectId();
const dbUser = { _id: realId, username: 'eleah', passwordHash: hash, createdAt: new Date('2026-11-01') };

// Fake getDB with a users collection that understands username and _id lookups
function fakeGetDB({ users = [dbUser], fail = false } = {}) {
    const record = { getDBCalls: 0, collections: [], findOneOptions: [] };
    const getDB = async () => {
        record.getDBCalls++;
        if (fail) {
            throw new Error('database down');
        }
        return {
            collection(name) {
                record.collections.push(name);
                return {
                    async findOne(query, options) {
                        record.findOneOptions.push(options);
                        const found = users.find((u) =>
                            query._id ? u._id.equals(query._id) : u.username === query.username
                        );
                        if (!found) {
                            return null;
                        }
                        if (options?.projection?.passwordHash === 0) {
                            const copy = { ...found };
                            delete copy.passwordHash;
                            return copy;
                        }
                        return found;
                    },
                };
            },
        };
    };
    return { getDB, record };
}

// Turn Passport's callback style into a promise so tests can await it
function runVerify(passport, username, password) {
    return new Promise((resolve) => {
        passport.strategy._verify(username, password, (err, user, info) => resolve({ err, user, info }));
    });
}

function runSerialize(passport, user) {
    return new Promise((resolve) => {
        passport.serialize(user, (err, id) => resolve({ err, id }));
    });
}

function runDeserialize(passport, id) {
    return new Promise((resolve) => {
        passport.deserialize(id, (err, user) => resolve({ err, user }));
    });
}

// configurePassport: setup
test('configurePassport registers a local strategy', () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB().getDB);
    assert.equal(passport.strategy.name, 'local');
});

test('configurePassport registers serialize and deserialize functions', () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB().getDB);
    assert.equal(typeof passport.serialize, 'function');
    assert.equal(typeof passport.deserialize, 'function');
});

// configurePassport: login strategy
test('strategy logs in with the right password and hides the hash', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB().getDB);
    const { err, user } = await runVerify(passport, 'eleah', 'secret123');
    assert.equal(err, null);
    assert.equal(user.username, 'eleah');
    assert.equal('passwordHash' in user, false);
});

test('strategy uses the users collection', async () => {
    const passport = fakePassport();
    const { getDB, record } = fakeGetDB();
    configurePassport(passport, getDB);
    await runVerify(passport, 'eleah', 'secret123');
    assert.deepEqual(record.collections, ['users']);
});

test('strategy fails a wrong password with a message', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB().getDB);
    const { err, user, info } = await runVerify(passport, 'eleah', 'wrong');
    assert.equal(err, null);
    assert.equal(user, false);
    assert.equal(info.message, 'Invalid username or password');
});

test('strategy gives the same message for an unknown username and a wrong password', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB().getDB);
    const unknown = await runVerify(passport, 'nobody', 'secret123');
    const wrong = await runVerify(passport, 'eleah', 'wrong');
    assert.equal(unknown.info.message, wrong.info.message);
});

test('strategy passes database errors to Passport', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB({ fail: true }).getDB);
    const { err, user } = await runVerify(passport, 'eleah', 'secret123');
    assert.match(err.message, /database down/);
    assert.equal(user, undefined);
});

// configurePassport: serializeUser
test('serializeUser stores only the id as a string', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB().getDB);
    const { err, id } = await runSerialize(passport, { _id: realId, username: 'eleah' });
    assert.equal(err, null);
    assert.equal(id, realId.toString());
    assert.equal(typeof id, 'string');
});

// configurePassport: deserializeUser
test('deserializeUser finds the user by id without the hash', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB().getDB);
    const { err, user } = await runDeserialize(passport, realId.toString());
    assert.equal(err, null);
    assert.equal(user.username, 'eleah');
    assert.equal('passwordHash' in user, false);
});

test('deserializeUser asks Mongo to leave out the hash', async () => {
    const passport = fakePassport();
    const { getDB, record } = fakeGetDB();
    configurePassport(passport, getDB);
    await runDeserialize(passport, realId.toString());
    assert.deepEqual(record.findOneOptions[0], { projection: { passwordHash: 0 } });
});

test('deserializeUser returns false for a deleted user', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB({ users: [] }).getDB);
    const { err, user } = await runDeserialize(passport, realId.toString());
    assert.equal(err, null);
    assert.equal(user, false);
});

test('deserializeUser returns false for a bad id without touching the database', async () => {
    const passport = fakePassport();
    const { getDB, record } = fakeGetDB();
    configurePassport(passport, getDB);
    for (const badId of ['abc', '', 'not-an-object-id-at-all']) {
        const { err, user } = await runDeserialize(passport, badId);
        assert.equal(err, null);
        assert.equal(user, false);
    }
    assert.equal(record.getDBCalls, 0);
});

test('deserializeUser passes database errors to Passport', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB({ fail: true }).getDB);
    const { err } = await runDeserialize(passport, realId.toString());
    assert.match(err.message, /database down/);
});

// configurePassport: full round trip
test('a logged-in user can be saved to the cookie and loaded back', async () => {
    const passport = fakePassport();
    configurePassport(passport, fakeGetDB().getDB);
    const { user: loggedIn } = await runVerify(passport, 'eleah', 'secret123');
    const { id } = await runSerialize(passport, loggedIn);
    const { user: loaded } = await runDeserialize(passport, id);
    assert.equal(loaded._id.toString(), realId.toString());
    assert.equal(loaded.username, 'eleah');
});