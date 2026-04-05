const { Redis } = require('@upstash/redis');
const webpush = require('web-push');

const ADMIN_ID = 'U0f4c1d79f182f727c49b0b1bfbace466';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { adminId, userId, title, body } = req.body;

  if (adminId !== ADMIN_ID) return res.status(403).json({ error: 'Forbidden' });
  if (!userId || !title) return res.status(400).json({ error: 'missing params' });

  const pubKey = process.env.VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;
  if (!pubKey || !privKey) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }

  try {
    webpush.setVapidDetails('mailto:thegym@example.com', pubKey, privKey);
  } catch(e) {
    return res.status(500).json({ error: 'VAPID setup failed: ' + e.message });
  }

  try {
    const subRaw = await redis.get('push_sub:' + userId);
    if (!subRaw) return res.status(404).json({ error: 'no subscription' });
    const sub = typeof subRaw === 'string' ? JSON.parse(subRaw) : subRaw;
    await webpush.sendNotification(sub, JSON.stringify({
      title: title,
      body: body || ''
    }));
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message, stack: e.stack ? e.stack.substring(0, 200) : '' });
  }
};
