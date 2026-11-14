import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireLogin } from './requireLogin.js';

// Fake response that records the status and JSON sent
function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

// Fake next that records whether it was called
function fakeNext() {
  const next = () => {
    next.called = true;
  };
  next.called = false;
  return next;
}

// requireLogin: logged in
test('requireLogin calls next when a user is logged in', () => {
  const res = fakeRes();
  const next = fakeNext();
  requireLogin({ user: { _id: 'abc', username: 'eleah' } }, res, next);
  assert.equal(next.called, true);
  assert.equal(res.statusCode, null);
});

test('requireLogin does not send a response when logged in', () => {
  const res = fakeRes();
  requireLogin({ user: { username: 'eleah' } }, res, fakeNext());
  assert.equal(res.body, null);
});

// requireLogin: logged out
test('requireLogin sends a 401 when no one is logged in', () => {
  const res = fakeRes();
  const next = fakeNext();
  requireLogin({}, res, next);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Not logged in' });
  assert.equal(next.called, false);
});

test('requireLogin treats null, undefined, and false users as logged out', () => {
  for (const user of [null, undefined, false]) {
    const res = fakeRes();
    const next = fakeNext();
    requireLogin({ user }, res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(next.called, false);
  }
});

test('requireLogin returns the response so the route stops', () => {
  const res = fakeRes();
  assert.equal(requireLogin({}, res, fakeNext()), res);
});

// requireLogin: boundary cases
test('requireLogin lets through a user object with any fields', () => {
  const next = fakeNext();
  requireLogin({ user: {} }, fakeRes(), next);
  assert.equal(next.called, true);
});

test('requireLogin calls next only once', () => {
  let calls = 0;
  requireLogin({ user: { username: 'eleah' } }, fakeRes(), () => calls++);
  assert.equal(calls, 1);
});
