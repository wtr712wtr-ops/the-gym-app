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
      const raw = await redis.get('weight:' + userId);
      const weights = raw ? (Array.isArray(raw) ? raw : JSON.parse(raw)) : [];
      return res.json({ weights: weights.slice(0, 30).reverse() });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { userId, date, weight, bodyFat } = req.body;
    if (!userId || !date || weight == null) {
      return res.status(400).json({ error: 'userId, date, weight required' });
    }

    try {
      const raw = await redis.get('weight:' + userId);
      const weights = raw ? (Array.isArray(raw) ? raw : JSON.parse(raw)) : [];

      const idx = weights.findIndex(function(w) { return w.date === date; });
      if (idx >= 0) {
        weights[idx].weight = weight;
        if (bodyFat != null) weights[idx].bodyFat = bodyFat;
      } else {
        weights.push({ date: date, weight: weight, bodyFat: bodyFat != null ? bodyFat : null });
      }

      weights.sort(function(a, b) { return b.date.localeCompare(a.date); });
      const trimmed = weights.slice(0, 90);

      await redis.set('weight:' + userId, JSON.stringify(trimmed));
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    await redis.del('weight:' + userId);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
