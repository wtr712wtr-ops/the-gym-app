const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  console.log('[records] userId:', userId);

  const [trainings, memos] = await Promise.all([
    redis.lrange('training:' + userId, 0, -1),
    redis.lrange('memo:' + userId, 0, -1),
  ]);

  console.log('[records] trainings:', JSON.stringify(trainings));
  console.log('[records] memos:', JSON.stringify(memos));

  return res.json({ trainings: trainings || [], memos: memos || [] });
};
