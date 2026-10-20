// Ranking only: eligibility, blocks and privacy must be enforced by the backend.
export function orderProfiles(profiles, scores, mode) {
  if (mode !== 'compatible') return [...profiles];
  const score = (profile) => Number.isFinite(scores[profile.id]) ? scores[profile.id] : -1;
  return [...profiles].sort((a, b) => score(b) - score(a));
}
