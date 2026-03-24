const { Redis } = require('@upstash/redis');

const ADMIN_ID = 'U0f4c1d79f182f727c49b0b1bfbace466';

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
    const { adminId, clientId } = req.query;
    if (adminId !== ADMIN_ID) return res.status(403).json({ error: 'Forbidden' });

    if (!clientId) {
      const clients = await redis.smembers('clients') || [];
      console.log('clients:', JSON.stringify(clients));
      return res.json({ clients });
    } else if (req.query.trainings !== undefined) {
      const trainings = await redis.lrange('training:' + clientId, 0, -1);
      return res.json({ trainings });
    } else {
      const memos = await redis.lrange('memo:' + clientId, 0, -1);
      return res.json({ memos });
    }
  }

  if (req.method === 'POST') {
    const { adminId, action, clientId, clientName, memo } = req.body;
    if (adminId !== ADMIN_ID) return res.status(403).json({ error: 'Forbidden' });

    if (action === 'addClient') {
      if (!clientId || !clientName) return res.status(400).json({ error: 'clientId and clientName required' });
      await redis.sadd('clients', { id: clientId, name: clientName });
      return res.status(200).json({ ok: true });
    }

    if (action === 'addTraining') {
      if (!clientId) return res.status(400).json({ error: 'clientId required' });
      const { date, exercise, weight, reps, sets, memo: tmemo } = req.body;
      if (!exercise) return res.status(400).json({ error: 'exercise required' });
      const entry = { date: date || new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }), exercise, weight, reps, sets, memo: tmemo || '' };
      await redis.lpush('training:' + clientId, entry);
      return res.status(200).json({ ok: true });
    }

    if (action === 'addMemo') {
      if (!clientId || !memo) return res.status(400).json({ error: 'clientId and memo required' });
      const date = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      await redis.lpush('memo:' + clientId, '[' + date + '] ' + memo);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
