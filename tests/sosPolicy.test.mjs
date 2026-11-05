import test from 'node:test';
import assert from 'node:assert/strict';
import { canStartSos, sosDeletionDeadline, SOS_AUDIO_DURATION_MS } from '../src/sosPolicy.js';
const consent = { audio: true, location: true, sharing: true };
const hour = 3600000;
test('requires contacts and each explicit consent', () => {
  assert.equal(canStartSos([], consent), false);
  assert.equal(canStartSos(['chosen-contact'], consent), true);
  for (const key of Object.keys(consent)) {
    assert.equal(canStartSos(['chosen-contact'], { ...consent, [key]: false }), false);
  }
});
test('voice capture duration is thirty seconds', () => {
  assert.equal(SOS_AUDIO_DURATION_MS, 30000);
});
test('unresolved SOS expires at seventy-two hours', () => {
  assert.equal(sosDeletionDeadline(1000), 1000 + 72 * hour);
});
test('resolved SOS expires twenty-four hours later without exceeding absolute cap', () => {
  assert.equal(sosDeletionDeadline(0, hour), 25 * hour);
  assert.equal(sosDeletionDeadline(0, 71 * hour), 72 * hour);
});
test('invalid dates are rejected', () => {
  assert.throws(() => sosDeletionDeadline(NaN), TypeError);
  assert.throws(() => sosDeletionDeadline(10, 9), TypeError);
});
