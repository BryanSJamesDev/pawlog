import { test } from 'node:test';
import assert from 'node:assert/strict';
import { petIcon, SPECIES } from './petIcon.js';

// petIcon: normal cases
test('petIcon returns the right icon for common species', () => {
  assert.equal(petIcon('dog'), '🐶');
  assert.equal(petIcon('cat'), '🐱');
  assert.equal(petIcon('bird'), '🐦');
  assert.equal(petIcon('fish'), '🐟');
  assert.equal(petIcon('horse'), '🐴');
});

test('petIcon works for a species with a space in its name', () => {
  assert.equal(petIcon('guinea pig'), '🐹');
});

test('petIcon has an icon for every species in the list', () => {
  for (const species of SPECIES) {
    assert.equal(petIcon(species.value), species.icon);
  }
});

test('petIcon ignores capital letters and extra spaces', () => {
  assert.equal(petIcon('Dog'), '🐶');
  assert.equal(petIcon('CAT'), '🐱');
  assert.equal(petIcon('  rabbit  '), '🐰');
  assert.equal(petIcon('Guinea Pig'), '🐹');
});

// petIcon: fallback
test('petIcon returns a paw for "other"', () => {
  assert.equal(petIcon('other'), '🐾');
});

test('petIcon returns a paw for species not on the list', () => {
  assert.equal(petIcon('dragon'), '🐾');
  assert.equal(petIcon('ferret'), '🐾');
});

test('petIcon returns a paw for empty or blank input', () => {
  assert.equal(petIcon(''), '🐾');
  assert.equal(petIcon('   '), '🐾');
});

test('petIcon returns a paw for missing or wrong-type input', () => {
  assert.equal(petIcon(undefined), '🐾');
  assert.equal(petIcon(null), '🐾');
  assert.equal(petIcon(5), '🐾');
  assert.equal(petIcon(['dog']), '🐾');
  assert.equal(petIcon({ species: 'dog' }), '🐾');
  assert.equal(petIcon(), '🐾');
});

test('petIcon does not match part of a word', () => {
  assert.equal(petIcon('do'), '🐾');
  assert.equal(petIcon('dogs'), '🐾');
});

test('petIcon handles a very long string', () => {
  assert.equal(petIcon('x'.repeat(10000)), '🐾');
});

// SPECIES list
test('every species has a value, a label, and an icon', () => {
  for (const species of SPECIES) {
    assert.equal(typeof species.value, 'string');
    assert.equal(typeof species.label, 'string');
    assert.equal(typeof species.icon, 'string');
    assert.ok(species.value.length > 0);
  }
});

test('species values are lowercase so they match what gets saved', () => {
  for (const species of SPECIES) {
    assert.equal(species.value, species.value.toLowerCase());
  }
});

test('species values are unique', () => {
  const values = SPECIES.map((s) => s.value);
  assert.equal(new Set(values).size, values.length);
});

test('"other" is in the list', () => {
  assert.ok(SPECIES.some((s) => s.value === 'other'));
});