import { SOS_AUDIO_DURATION_MS } from './sosPolicy.js';

// No persistence or network side effects. A verified transport must consume chunks.
export async function captureSosAudio({ mediaDevices, Recorder, signal, onChunk = () => {}, onStop = () => {}, schedule = setTimeout, cancel = clearTimeout }) {
  const stream = await mediaDevices.getUserMedia({ audio: true });
  const release = () => stream.getTracks().forEach((track) => track.stop());
  if (signal.aborted) {
    release();
    return null;
  }
  let recorder;
  let timer;
  let stopped = false;
  const finish = () => {
    if (stopped) return;
    stopped = true;
    cancel(timer);
    signal.removeEventListener('abort', stop);
    release();
    onStop();
  };
  const stop = () => {
    if (stopped) return;
    try {
      if (recorder.state !== 'inactive') recorder.stop();
    } finally {
      finish();
    }
  };
  try {
    recorder = new Recorder(stream);
    recorder.ondataavailable = (event) => {
      if (!signal.aborted && event.data?.size > 0) onChunk(event.data);
    };
    recorder.onstop = finish;
    recorder.onerror = stop;
    signal.addEventListener('abort', stop, { once: true });
    recorder.start(1000);
    timer = schedule(stop, SOS_AUDIO_DURATION_MS);
    return { stop };
  } catch (error) {
    finish();
    throw error;
  }
}
