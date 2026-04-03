const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
      const raw = await redis.get('goal:' + userId);
      const goal = raw ? (typeof raw === 'object' ? raw : JSON.parse(raw)) : null;
      return res.json({ goal: goal });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { userId, targetWeight, targetDate, memo } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
      await redis.set('goal:' + userId, JSON.stringify({
        targetWeight: targetWeight || null,
        targetDate: targetDate || null,
        memo: memo || ''
      }));
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
