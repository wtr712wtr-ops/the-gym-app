const { Redis } = require('@upstash/redis');
const webpush = require('web-push');
const ADMIN_ID = 'U0f4c1d79f182f727c49b0b1bfbace466';
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
webpush.setVapidDetails(
  'mailto:gym-admin@thegym.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const { adminId, userId, title, body } = req.body;
  if (adminId !== ADMIN_ID) return res.status(403).json({ error: 'Forbidden' });
  if (!userId || !title) return res.status(400).json({ error: 'missing params' });
  try {
    const subStr = await redis.get('push_sub:' + userId);
    if (!subStr) return res.status(404).json({ error: 'no subscription' });
    const sub = typeof subStr === 'string' ? JSON.parse(subStr) : subStr;
    await webpush.sendNotification(sub, JSON.stringify({ title, body: body || '' }));
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
