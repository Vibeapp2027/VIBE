import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'node:crypto';

export function createStripeSupabaseBridge({
  supabaseUrl,
  supabaseServiceRoleKey,
  stripeSecretKey,
  baseUrl,
}) {
  const supabase = supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  }) : null;

  const safeBaseUrl = baseUrl || 'https://vibegay.ca';

  async function ensureUserRecord({ authId, email }) {
    if (!supabase) {
      return { created: false, user: null };
    }

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, auth_id, email, role')
      .eq('auth_id', authId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingUser) {
      return { created: false, user: existingUser };
    }

    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .insert([{ auth_id: authId, email: email || null, role: 'member' }])
      .select('id, auth_id, email, role')
      .single();

    if (insertError) {
      throw insertError;
    }

    return { created: true, user: createdUser };
  }

  async function syncPremiumMembership({ authId, stripeCustomerId, tier = 'premium' }) {
    if (!supabase) {
      return { synced: false, reason: 'supabase-not-configured' };
    }

    const { user } = await ensureUserRecord({ authId, email: `${authId}@vibegay.ca` });

    if (!user) {
      return { synced: false, reason: 'user-not-found' };
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: stripeCustomerId,
        role: tier === 'founder' ? 'founder' : 'premium',
      })
      .eq('id', user.id)
      .select('id, auth_id, email, role, stripe_customer_id')
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      synced: true,
      user: updatedUser,
      tier: updatedUser.role,
    };
  }

  async function createCheckoutSession({ tier = 'premium', authId = 'demo-user', email = 'member@vibegay.ca' }) {
    if (!stripe) {
      return {
        mode: 'demo',
        id: `demo_checkout_${Date.now()}`,
        url: `${safeBaseUrl}/payment/success?demo=1&tier=${tier}`,
      };
    }

    const priceMap = {
      premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium',
      founder: process.env.STRIPE_PRICE_FOUNDER || 'price_founder',
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price: priceMap[tier] || priceMap.premium,
          quantity: 1,
        },
      ],
      metadata: {
        auth_id: authId,
        tier,
      },
      success_url: `${safeBaseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeBaseUrl}/payment/cancelled`,
    });

    return {
      mode: 'live',
      id: session.id,
      url: session.url,
    };
  }

  function verifyWebhookSignature({ rawBody, signature }) {
    if (!stripe || !signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return false;
    }

    try {
      return stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch {
      return null;
    }
  }

  async function handleStripeWebhook(event) {
    if (!event) {
      return { status: 400, payload: { error: 'Invalid Stripe event' } };
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const authId = session.metadata?.auth_id;
      const stripeCustomerId = session.customer;
      const tier = session.metadata?.tier || 'premium';

      if (!authId || !stripeCustomerId) {
        return { status: 400, payload: { error: 'Missing auth_id or customer in event' } };
      }

      const result = await syncPremiumMembership({ authId, stripeCustomerId, tier });
      return {
        status: 200,
        payload: { received: true, synced: result.synced, tier },
      };
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const authId = paymentIntent.metadata?.auth_id;
      const stripeCustomerId = paymentIntent.customer;
      const tier = paymentIntent.metadata?.tier || 'premium';

      if (!authId || !stripeCustomerId) {
        return { status: 400, payload: { error: 'Missing auth_id or customer in payment event' } };
      }

      const result = await syncPremiumMembership({ authId, stripeCustomerId, tier });
      return {
        status: 200,
        payload: { received: true, synced: result.synced, tier },
      };
    }

    return {
      status: 200,
      payload: { received: true, ignored: event.type },
    };
  }

  return {
    createCheckoutSession,
    syncPremiumMembership,
    verifyWebhookSignature,
    handleStripeWebhook,
    ensureUserRecord,
  };
}

export default createStripeSupabaseBridge;
