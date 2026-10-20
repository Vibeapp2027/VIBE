import test from 'node:test';
import assert from 'node:assert/strict';
import { createSosTransport } from '../src/sosTransport.js';
const chunk = new Blob(['audio']);
function setup(fetcher) {
  const controller = new AbortController();
  return { controller, transport: createSosTransport({ endpoint: 'https://example.com/api/sos/audio', sessionId: 'server-session', signal: controller.signal, fetcher }) };
}

test('requires HTTPS without embedded credentials or URL parameters', () => {
  for (const endpoint of ['http://example.com', 'https://user:pass@example.com', 'https://example.com?token=x', 'https://example.com#secret']) {
    assert.throws(() => createSosTransport({ endpoint, sessionId: 'session', signal: new AbortController().signal }), TypeError);
  }
});

test('uploads in sequence using authenticated requests without claiming recipient delivery', async () => {
  const requests = [];
  let release;
  const first = new Promise(resolve => { release = resolve; });
  const { transport } = setup(async (url, options) => {
    requests.push({ url, ...options });
    if (requests.length === 1) await first;
    return { ok: true };
  });
  const a = transport.send(chunk);
  const b = transport.send(chunk);
  await Promise.resolve();
  assert.equal(requests.length, 1);
  release();
  assert.deepEqual(await a, { accepted: true, sequence: 0 });
  assert.deepEqual(await b, { accepted: true, sequence: 1 });
  assert.equal(requests[1].headers['X-SOS-Sequence'], '1');
  assert.equal(requests[0].credentials, 'include');
  assert.equal(requests[0].redirect, 'error');
});

test('HTTP rejection stops subsequent uploads without retrying sensitive data', async () => {
  let calls = 0;
  const { transport } = setup(async () => { calls++; return { ok: false }; });
  await assert.rejects(transport.send(chunk), /rejected/);
  await assert.rejects(transport.send(chunk), /stopped/);
  assert.equal(calls, 1);
});

test('aborted session never starts an upload', async () => {
  const { controller, transport } = setup(() => assert.fail('must not send'));
  controller.abort();
  await assert.rejects(transport.send(chunk), /stopped/);
});

test('oversized audio is rejected locally', async () => {
  const { transport } = setup(() => assert.fail('must not send'));
  await assert.rejects(transport.send(new Blob([new Uint8Array(2 * 1024 * 1024 + 1)])), /limit/);
});

test('request timeout aborts the network operation', async () => {
  const transport = createSosTransport({
    endpoint: 'https://example.com/audio', sessionId: 'session', signal: new AbortController().signal, timeoutMs: 5,
    fetcher: async (_, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }),
  });
  await assert.rejects(transport.send(chunk), /aborted/);
});
