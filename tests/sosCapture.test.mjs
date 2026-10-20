import test from 'node:test';
import assert from 'node:assert/strict';
import { captureSosAudio } from '../src/sosCapture.js';

function fixture() {
  const state = { stops: 0, finished: 0, chunks: [], duration: null };
  const controller = new AbortController();
  const stream = { getTracks: () => [{ stop: () => state.stops++ }] };
  class Recorder {
    constructor() { state.recorder = this; this.state = 'inactive'; }
    start(interval) { state.interval = interval; this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.onstop?.(); }
  }
  return { state, controller, stream, options: {
    mediaDevices: { getUserMedia: async () => stream }, Recorder,
    signal: controller.signal,
    onChunk: (chunk) => state.chunks.push(chunk),
    onStop: () => state.finished++,
    schedule: (callback, duration) => { state.timeout = callback; state.duration = duration; return 1; },
    cancel: () => {},
  } };
}

test('captures one-second chunks and releases microphone after scheduled 30 seconds', async () => {
  const { state, options } = fixture();
  await captureSosAudio(options);
  assert.equal(state.interval, 1000);
  assert.equal(state.duration, 30000);
  state.recorder.ondataavailable({ data: { size: 10 } });
  assert.equal(state.chunks.length, 1);
  state.timeout();
  assert.equal(state.recorder.state, 'inactive');
  assert.equal(state.stops, 1);
  assert.equal(state.finished, 1);
});

test('manual abort releases microphone once and does not forward late chunks', async () => {
  const { state, controller, options } = fixture();
  const capture = await captureSosAudio(options);
  controller.abort();
  capture.stop();
  state.recorder.ondataavailable({ data: { size: 10 } });
  assert.equal(state.stops, 1);
  assert.equal(state.chunks.length, 0);
});

test('permission granted after cancellation releases tracks without starting recorder', async () => {
  const { state, controller, options, stream } = fixture();
  let grant;
  options.mediaDevices.getUserMedia = () => new Promise(resolve => { grant = resolve; });
  const pending = captureSosAudio(options);
  controller.abort();
  grant(stream);
  assert.equal(await pending, null);
  assert.equal(state.recorder, undefined);
  assert.equal(state.stops, 1);
});

test('constructor failure releases tracks', async () => {
  const { state, options } = fixture();
  options.Recorder = class { constructor() { throw new Error('unsupported'); } };
  await assert.rejects(captureSosAudio(options), /unsupported/);
  assert.equal(state.stops, 1);
});

test('permission denial is surfaced without starting a timer', async () => {
  const { state, options } = fixture();
  options.mediaDevices.getUserMedia = async () => { throw new Error('denied'); };
  await assert.rejects(captureSosAudio(options), /denied/);
  assert.equal(state.duration, null);
});
