import type { VercelRequest, VercelResponse } from '@vercel/node';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, phone } = req.body || {};
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        attributes: {
          NOMBRE: name.split(' ')[0],
          APELLIDOS: name.split(' ').slice(1).join(' ') || undefined,
          SMS: phone || undefined,
          LANDLINE_NUMBER: phone || undefined,
        },
        listIds: [2],
        updateEnabled: true,
      }),
    });

    if (brevoRes.ok || brevoRes.status === 204) {
      return res.json({ success: true });
    }

    const data = await brevoRes.json().catch(() => ({}));
    if (data.code === 'duplicate_parameter') {
      return res.json({ success: true });
    }

    return res.status(brevoRes.status).json({ error: data.message || 'Error registering contact' });
  } catch {
    return res.status(500).json({ error: 'Failed to connect to Brevo' });
  }
}
