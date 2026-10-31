export async function getPlatformStatus() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  if (!baseUrl) {
    return {
      status: 'simulated',
      mode: 'demo',
      connected: false,
      platform: 'VIBE + vibeqbc integration',
      features: ['auth', 'payments', 'admin-dashboard', 'search', 'contact', 'sos', 'live-salon', 'realtime-presence'],
    };
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/platform/status`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Platform status unavailable (${response.status})`);
  }

  return response.json();
}

export async function createCheckoutSession(payload) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (!baseUrl) {
    return { mode: 'demo', id: 'demo-checkout', url: '/payment/success?demo=1' };
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Checkout session unavailable');
  }

  return response.json();
}

export async function submitContact(payload) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (!baseUrl) {
    return { accepted: true, message: 'demo contact accepted', payload };
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Contact endpoint unavailable');
  }

  return response.json();
}

export async function sendSosHeartbeat(payload) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (!baseUrl) {
    return { ok: true, event: payload.event || 'sos-realtime', status: 'simulated' };
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/sos/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Sos heartbeat unavailable');
  }

  return response.json();
}
