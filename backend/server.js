import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { createStripeSupabaseBridge } from './services/stripeSupabaseBridge.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })
  : null;

const bridge = createStripeSupabaseBridge({
  supabaseUrl,
  supabaseServiceRoleKey,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  baseUrl: process.env.BASE_URL || 'https://vibegay.ca',
});

app.use(cors({ origin: process.env.CORS_ORIGIN || 'https://vibegay.ca' }));

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const event = bridge.verifyWebhookSignature({
        rawBody: req.body,
        signature: req.headers['stripe-signature'],
      });

      if (!event) {
        return res.status(400).json({ error: 'Signature Stripe invalide' });
      }

      const result = await bridge.handleStripeWebhook(event);
      return res.status(result.status || 200).json(result.payload || { received: true });
    } catch (error) {
      console.error('Erreur Webhook Stripe:', error.message);
      return res.status(500).json({ error: 'Échec du traitement du webhook' });
    }
  }
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vibe-backend',
  });
});

app.get('/api/platform/status', async (_req, res) => {
  if (!supabase) {
    return res.status(503).json({
      status: 'degraded',
      connected: false,
      platform: 'VIBE Core Engine',
      message: 'Supabase is not configured',
    });
  }

  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;

    return res.json({
      status: 'operational',
      connected: true,
      platform: 'VIBE Core Engine',
      activeUsers: count || 0,
    });
  } catch (error) {
    console.error('Erreur Supabase status:', error.message);
    return res.status(503).json({
      status: 'degraded',
      connected: false,
      platform: 'VIBE Core Engine',
    });
  }
});

app.post('/api/checkout-session', async (req, res) => {
  try {
    const { tier = 'premium', auth_id, email } = req.body || {};
    if (!auth_id || !email) {
      return res.status(400).json({ error: 'auth_id et email sont requis' });
    }
    if (!['premium', 'founder'].includes(tier)) {
      return res.status(400).json({ error: 'Offre invalide' });
    }

    const result = await bridge.createCheckoutSession({ tier, authId: auth_id, email });
    return res.json(result);
  } catch (error) {
    console.error('Erreur Checkout:', error.message);
    return res.status(500).json({ error: 'Impossible de créer la session de paiement' });
  }
});

app.post('/api/contact', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Le service de contact n’est pas configuré' });
  }

  const { name, email, subject, message } = req.body || {};
  if (![name, email, subject, message].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert([{ name, email, subject, message }])
      .select('id')
      .single();
    if (error) throw error;

    return res.status(201).json({ accepted: true, message: 'Message enregistré', id: data.id });
  } catch (error) {
    console.error('Erreur contact:', error.message);
    return res.status(503).json({ error: 'Impossible d’enregistrer le message' });
  }
});

app.post('/api/sos/heartbeat', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Le service SOS n’est pas configuré' });
  }

  const payload = req.body || {};
  try {
    const { error } = await supabase.from('sos_sessions').insert([{
      user_id: payload.userId || null,
      latitude: payload.coords?.latitude ?? null,
      longitude: payload.coords?.longitude ?? null,
      event_type: payload.event || 'heartbeat',
      metadata: payload,
    }]);
    if (error) throw error;

    return res.json({ ok: true, status: 'recorded', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erreur SOS:', error.message);
    return res.status(503).json({ error: 'Impossible d’enregistrer le signal SOS' });
  }
});

app.get('/api/search', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'La recherche n’est pas configurée' });
  }
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) return res.json({ results: [] });

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return res.json({ results: data || [] });
  } catch (error) {
    console.error('Erreur recherche:', error.message);
    return res.status(503).json({ error: 'La recherche est temporairement indisponible' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend VIBE actif sur le port ${port}`);
});
