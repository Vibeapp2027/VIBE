import test from 'node:test';
import assert from 'node:assert/strict';
import { orderProfiles } from '../src/discovery.js';

const profiles = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const scores = { a: 20, b: 90 };
test('all preserves every profile in its original order', () => {
  assert.deepEqual(orderProfiles(profiles, scores, 'all'), profiles);
});
test('compatible sorts descending, retains profiles without scores and does not mutate input', () => {
  assert.deepEqual(orderProfiles(profiles, scores, 'compatible').map(p => p.id), ['b', 'a', 'c']);
  assert.deepEqual(profiles.map(p => p.id), ['a', 'b', 'c']);
});
test('unknown mode falls back to all; empty list is supported', () => {
  assert.deepEqual(orderProfiles(profiles, scores, 'unknown'), profiles);
  assert.deepEqual(orderProfiles([], {}, 'compatible'), []);
});
