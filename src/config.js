const env = import.meta.env;

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

export const appConfig = {
  apiHealthUrl: env.VITE_API_HEALTH_URL || '',
  supabaseHealthUrl: env.VITE_SUPABASE_HEALTH_URL || '',
  loi25PolicyUrl: env.VITE_LOI25_POLICY_URL || '',
  sosApiUrl: env.VITE_SOS_API_URL || '',
  healthTimeoutMs: toPositiveInt(env.VITE_HEALTHCHECK_TIMEOUT_MS, 5000),
  geoTimeoutMs: toPositiveInt(env.VITE_GEOLOCATION_TIMEOUT_MS, 10000),
  sosTimeoutMs: toPositiveInt(env.VITE_SOS_TIMEOUT_MS, 10000),
  adminContactEmail: env.VITE_ADMIN_CONTACT_EMAIL || 'vibegay666@hotmail.com',
  supportContactEmail: env.VITE_SUPPORT_CONTACT_EMAIL || 'support@vibegay.ca',
};
