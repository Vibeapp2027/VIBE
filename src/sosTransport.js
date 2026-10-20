const MAX_CHUNKS = 32;
const MAX_CHUNK_BYTES = 2 * 1024 * 1024;

// Server-created, authenticated session only. Never use recipient addresses as credentials.
export function createSosTransport({ endpoint, sessionId, signal, fetcher = fetch, timeoutMs = 10000 }) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new TypeError('A credential-free HTTPS endpoint is required');
  }
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(sessionId)) throw new TypeError('Invalid session identifier');
  if (!signal || !Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError('Invalid transport options');
  let sequence = 0;
  let failed = false;
  let pending = Promise.resolve();

  const send = (chunk) => {
    if (failed || signal.aborted) return Promise.reject(new Error('SOS transport stopped'));
    if (!chunk || !Number.isFinite(chunk.size) || chunk.size <= 0 || chunk.size > MAX_CHUNK_BYTES || sequence >= MAX_CHUNKS) {
      failed = true;
      return Promise.reject(new Error('SOS audio limit exceeded'));
    }
    const index = sequence++;
    const operation = pending.then(async () => {
      if (failed || signal.aborted) throw new Error('SOS transport stopped');
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(abort, timeoutMs);
      try {
        const response = await fetcher(url.toString(), {
          method: 'POST',
          credentials: 'include',
          redirect: 'error',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-SOS-Session': sessionId,
            'X-SOS-Sequence': String(index),
          },
          body: chunk,
        });
        if (!response.ok) throw new Error('SOS audio upload rejected');
        // Acceptance by a server is NOT proof of receipt by a trusted contact.
        return { accepted: true, sequence: index };
      } finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
      }
    });
    pending = operation.catch(() => { failed = true; });
    return operation;
  };
  return { send };
}
