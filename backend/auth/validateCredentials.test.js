import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCredentials } from './validateCredentials.js';

// validateCredentials: normal cases
test('validateCredentials returns the cleaned username and the password', () => {
    assert.deepEqual(validateCredentials('eleah', 'secret123'), {
        username: 'eleah',
        password: 'secret123',
    });
});

test('validateCredentials lowercases and trims the username', () => {
    assert.equal(validateCredentials('  ElEaH  ', 'secret123').username, 'eleah');
});

test('validateCredentials allows numbers and underscores in usernames', () => {
    assert.equal(validateCredentials('pet_owner_99', 'secret123').username, 'pet_owner_99');
});

test('validateCredentials does not trim or change the password', () => {
    assert.equal(validateCredentials('eleah', '  Sec ret 123  ').password, '  Sec ret 123  ');
});

test('validateCredentials allows special characters in passwords', () => {
    assert.equal(validateCredentials('eleah', 'p@$$w0rd!#').password, 'p@$$w0rd!#');
});

// validateCredentials: boundary cases
test('validateCredentials allows a 3-character username', () => {
    assert.equal(validateCredentials('abc', 'secret123').username, 'abc');
});

test('validateCredentials allows a 30-character username', () => {
    const name = 'a'.repeat(30);
    assert.equal(validateCredentials(name, 'secret123').username, name);
});

test('validateCredentials rejects a 2-character username', () => {
    assert.throws(() => validateCredentials('ab', 'secret123'), Error);
});

test('validateCredentials rejects a 31-character username', () => {
    assert.throws(() => validateCredentials('a'.repeat(31), 'secret123'), Error);
});

test('validateCredentials counts length after trimming', () => {
    // "ab" with spaces is still only 2 real characters
    assert.throws(() => validateCredentials('  ab  ', 'secret123'), Error);
});

test('validateCredentials allows an 8-character password', () => {
    assert.equal(validateCredentials('eleah', '12345678').password, '12345678');
});

test('validateCredentials rejects a 7-character password', () => {
    assert.throws(() => validateCredentials('eleah', '1234567'), Error);
});

test('validateCredentials allows a 72-byte password', () => {
    const password = 'p'.repeat(72);
    assert.equal(validateCredentials('eleah', password).password, password);
});

test('validateCredentials rejects a 73-byte password', () => {
    assert.throws(() => validateCredentials('eleah', 'p'.repeat(73)), Error);
});

test('validateCredentials measures bytes, not characters, for the max', () => {
    // Each paw emoji is 4 bytes: 18 emoji = 72 bytes (ok), 19 = 76 bytes (too long)
    assert.ok(validateCredentials('eleah', '🐾'.repeat(18)));
    assert.throws(() => validateCredentials('eleah', '🐾'.repeat(19)), Error);
});

test('validateCredentials rejects a very long password', () => {
    assert.throws(() => validateCredentials('eleah', 'p'.repeat(10000)), Error);
});

// validateCredentials: error handling
test('validateCredentials rejects a username that is not a string', () => {
    assert.throws(() => validateCredentials(null, 'secret123'), Error);
    assert.throws(() => validateCredentials(undefined, 'secret123'), Error);
    assert.throws(() => validateCredentials(123, 'secret123'), Error);
    assert.throws(() => validateCredentials(['eleah'], 'secret123'), Error);
    assert.throws(() => validateCredentials({ name: 'eleah' }, 'secret123'), Error);
});

test('validateCredentials rejects empty or blank usernames', () => {
    assert.throws(() => validateCredentials('', 'secret123'), Error);
    assert.throws(() => validateCredentials('     ', 'secret123'), Error);
});

test('validateCredentials rejects usernames with bad characters', () => {
    assert.throws(() => validateCredentials('el eah', 'secret123'), Error);
    assert.throws(() => validateCredentials('eleah!', 'secret123'), Error);
    assert.throws(() => validateCredentials('el-eah', 'secret123'), Error);
    assert.throws(() => validateCredentials('eleah@mail.com', 'secret123'), Error);
    assert.throws(() => validateCredentials('éleah', 'secret123'), Error);
    assert.throws(() => validateCredentials('$where', 'secret123'), Error);
});

test('validateCredentials rejects a password that is not a string', () => {
    assert.throws(() => validateCredentials('eleah', null), Error);
    assert.throws(() => validateCredentials('eleah', undefined), Error);
    assert.throws(() => validateCredentials('eleah', 12345678), Error);
    assert.throws(() => validateCredentials('eleah', ['secret123']), Error);
});

test('validateCredentials rejects an empty password', () => {
    assert.throws(() => validateCredentials('eleah', ''), Error);
});

test('validateCredentials checks the username before the password', () => {
    assert.throws(() => validateCredentials('a', 'x'), /Username/);
});

test('validateCredentials gives a clear message for a bad password', () => {
    assert.throws(() => validateCredentials('eleah', 'short'), /Password/);
});