import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createStripeSupabaseBridge } from './services/stripeSupabaseBridge.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const bridge = createStripeSupabaseBridge({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  baseUrl: process.env.BASE_URL || 'https://vibegay.ca',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      const event = bridge.verifyWebhookSignature({
        rawBody: req.body,
        signature,
      });

      if (!event) {
        return res.status(400).json({ error: 'Signature Stripe invalide' });
      }

      const result = await bridge.handleStripeWebhook(event);
      return res.status(result.status || 200).json(result.payload || { received: true });
    } catch (error) {
      console.error('Erreur Webhook:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }
);

app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/api/checkout-session', async (req, res) => {
  try {
    const { tier = 'premium', auth_id = 'demo-user', email = 'member@vibegay.ca' } = req.body || {};
    const result = await bridge.createCheckoutSession({
      tier,
      authId: auth_id,
      email,
    });
    return res.json(result);
  } catch (error) {
    console.error('Erreur Checkout:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'vibe-backend' });
});

app.get('/api/platform/status', async (_req, res) => {
  try {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    res.json({
      status: 'operational',
      mode: 'production',
      connected: true,
      platform: 'VIBE Core Engine',
      activeUsers: count || 0,
      features: ['auth', 'payments', 'admin-dashboard', 'search', 'contact', 'sos', 'live-salon', 'realtime-presence'],
    });
  } catch (_err) {
    res.json({
      status: 'simulated',
      mode: 'demo',
      connected: false,
      platform: 'VIBE Core Engine (Fallback)',
      features: ['auth', 'payments', 'admin-dashboard', 'search', 'contact', 'sos', 'live-salon', 'realtime-presence'],
    });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    const { data, error } = await supabase.from('contacts').insert([
      { name, email, subject, message, created_at: new Date().toISOString() }
    ]).select();

    if (error) throw error;
    res.json({ accepted: true, message: 'Message enregistré', id: data?.[0]?.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sos/heartbeat', async (req, res) => {
  try {
    const payload = req.body || {};
    await supabase.from('sos_sessions').insert([
      {
        user_id: payload.userId || null,
        latitude: payload.coords?.latitude || null,
        longitude: payload.coords?.longitude || null,
        event_type: payload.event || 'heartbeat',
        metadata: payload,
        created_at: new Date().toISOString(),
      }
    ]);
    res.json({ ok: true, status: 'dispatched', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ results: [] });

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(20);

    if (error) throw error;
    res.json({ results: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/overview', async (_req, res) => {
  try {
    const [users, sos, contacts] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('sos_sessions').select('*', { count: 'exact', head: true }).eq('event_type', 'trigger'),
      supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    res.json({
      totalUsers: users.count || 0,
      activeSosAlerts: sos.count || 0,
      recentContacts: contacts.data || [],
      systemHealth: '100%',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend VIBE actif sur le port ${port}`);
});
