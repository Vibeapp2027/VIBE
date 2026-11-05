export const SOS_AUDIO_DURATION_MS = 30_000;
const HOUR = 60 * 60 * 1000;

export function canStartSos(contacts, consent) {
  return contacts.length > 0 && consent.audio === true && consent.location === true && consent.sharing === true;
}

// Server must enforce this deadline; this helper alone does not delete stored data.
export function sosDeletionDeadline(startedAt, resolvedAt = null) {
  if (!Number.isFinite(startedAt)) throw new TypeError('Invalid start time');
  if (resolvedAt !== null && (!Number.isFinite(resolvedAt) || resolvedAt < startedAt)) {
    throw new TypeError('Invalid resolution time');
  }
  return Math.min(startedAt + 72 * HOUR, resolvedAt === null ? Infinity : resolvedAt + 24 * HOUR);
}
