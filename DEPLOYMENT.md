# VIBE Production Deployment Guide

This document explains the exact production setup for vibegay.ca using the VIBE frontend and the backend API.

## 1. Frontend: VIBE on Cloudflare Pages

In Cloudflare Pages:
- Import the repo: `Vibeapp2027/VIBE`
- Set build settings for Vite
- Add environment variables:

```dotenv
VITE_API_BASE_URL=https://api.vibegay.ca
VITE_API_HEALTH_URL=https://api.vibegay.ca/api/health
VITE_SUPABASE_HEALTH_URL=https://<votre-projet>.supabase.co/rest/v1/
VITE_LOI25_POLICY_URL=https://vibegay.ca/confidentialite
VITE_TRANSLATION_HEALTH_URL=https://api.vibegay.ca/api/translation/health
VITE_VOICE_HEALTH_URL=https://api.vibegay.ca/api/voice/health
VITE_SOS_API_URL=https://api.vibegay.ca/api/sos/heartbeat

VITE_ADMIN_CONTACT_EMAIL=vibegay666@hotmail.com
VITE_OPERATIONS_DIRECTOR_NAME=Jean Marc Reid
VITE_OPERATIONS_DIRECTOR_EMAIL=jmarcreid@gmail.com
VITE_SUPPORT_CONTACT_EMAIL=support@vibegay.ca

VITE_FREE_REGISTRATIONS_LIMIT=2500
VITE_FREE_REGISTRATIONS_USED=0
VITE_YEARLY_PAID_TICKETS_LIMIT=500
VITE_YEARLY_PAID_TICKETS_SOLD=0
VITE_YEARLY_PAID_TICKET_PRICE_CAD=99
VITE_NON_SUBSCRIBER_RADIUS_KM=20

VITE_HEALTHCHECK_TIMEOUT_MS=5000
VITE_GEOLOCATION_TIMEOUT_MS=10000
VITE_SOS_TIMEOUT_MS=10000
VITE_SOS_HEARTBEAT_MS=10000
```

Then add the custom domain:
- `vibegay.ca`

## 2. Backend API: deploy on Render / Railway / VPS

Deploy the code from the repo root file `server.js`.

Set environment variables:

```dotenv
BASE_URL=https://api.vibegay.ca
NODE_ENV=production
PORT=3000

SUPABASE_URL=https://<votre-projet>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

STRIPE_SECRET_KEY=<stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<stripe_webhook_secret>
STRIPE_PRICE_PREMIUM=<price_id_premium>
STRIPE_PRICE_FOUNDER=<price_id_founder>
```

Run:

```bash
npm install
npm start
```

Create the DNS record:
- `api.vibegay.ca` -> backend service

## 3. Supabase schema

Run the following in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'member',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  display_name TEXT,
  bio TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  event_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. Stripe configuration

In Stripe Dashboard:
- Go to Developers > Webhooks
- Add endpoint: `https://api.vibegay.ca/api/webhooks/stripe`
- Select events:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
- Copy the webhook secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`

## 5. Final validation

Use these URLs after deploy:
- `https://vibegay.ca`
- `https://api.vibegay.ca/api/health`
- `https://api.vibegay.ca/api/platform/status`
- `https://api.vibegay.ca/api/contact`
- `https://api.vibegay.ca/api/sos/heartbeat`
- `https://api.vibegay.ca/api/search?q=test`

## 6. Important note

The code is ready for production in the repo.
The remaining items require access to your real Cloudflare, Supabase, and Stripe accounts to insert the actual secrets and DNS records.
