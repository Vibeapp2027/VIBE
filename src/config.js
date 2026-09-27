const env = import.meta.env;

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const toNonNegativeInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

export const appConfig = {
  apiHealthUrl: env.VITE_API_HEALTH_URL || '',
  supabaseHealthUrl: env.VITE_SUPABASE_HEALTH_URL || '',
  loi25PolicyUrl: env.VITE_LOI25_POLICY_URL || '',
  sosApiUrl: env.VITE_SOS_API_URL || '',
  translationHealthUrl: env.VITE_TRANSLATION_HEALTH_URL || '',
  voiceHealthUrl: env.VITE_VOICE_HEALTH_URL || '',
  healthTimeoutMs: toPositiveInt(env.VITE_HEALTHCHECK_TIMEOUT_MS, 5000),
  geoTimeoutMs: toPositiveInt(env.VITE_GEOLOCATION_TIMEOUT_MS, 10000),
  sosTimeoutMs: toPositiveInt(env.VITE_SOS_TIMEOUT_MS, 10000),
  adminContactEmail: env.VITE_ADMIN_CONTACT_EMAIL || 'vibegay666@hotmail.com',
  supportContactEmail: env.VITE_SUPPORT_CONTACT_EMAIL || 'support@vibegay.ca',
  operationsDirectorName: env.VITE_OPERATIONS_DIRECTOR_NAME || 'Jean Marc Reid',
  operationsDirectorEmail: env.VITE_OPERATIONS_DIRECTOR_EMAIL || 'jmarcreid@gmail.com',
  freeRegistrationsLimit: toPositiveInt(env.VITE_FREE_REGISTRATIONS_LIMIT, 2500),
  freeRegistrationsUsed: toNonNegativeInt(env.VITE_FREE_REGISTRATIONS_USED, 0),
  yearlyPaidTicketsLimit: toPositiveInt(env.VITE_YEARLY_PAID_TICKETS_LIMIT, 500),
  yearlyPaidTicketsSold: toNonNegativeInt(env.VITE_YEARLY_PAID_TICKETS_SOLD, 0),
  yearlyPaidTicketPriceCad: toPositiveInt(env.VITE_YEARLY_PAID_TICKET_PRICE_CAD, 99),
};
