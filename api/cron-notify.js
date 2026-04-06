const { Redis } = require('@upstash/redis');
const webpush = require('web-push');

const ADMIN_ID = 'U0f4c1d79f182f727c49b0b1bfbace466';
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

webpush.setVapidDetails('mailto:thegym@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

async function sendPush(userId, title, body) {
  try {
    const subRaw = await redis.get('push_sub:' + userId);
    if (!subRaw) return false;
    const sub = typeof subRaw === 'string' ? JSON.parse(subRaw) : subRaw;
    await webpush.sendNotification(sub, JSON.stringify({ title, body }));
    return true;
  } catch(e) {
    console.error('push error', userId, e.message);
    return false;
  }
}

module.exports = async function handler(req, res) {
  // Vercel Cron の認証
  if (req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const clients = await redis.smembers('clients') || [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const results = [];

  // 明日の日付
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // 月末判定（翌日が月初なら月末）
  const nextDay = new Date(now);
  nextDay.setDate(nextDay.getDate() + 1);
  const isLastDayOfMonth = nextDay.getDate() === 1;

  for (const client of clients) {
    const uid = client.id || client;
    if (!uid) continue;

    // ①予約前日通知
    const nextDate = await redis.get('nextDate:' + uid);
    if (nextDate && nextDate === tomorrowStr) {
      const nextTime = await redis.get('nextTime:' + uid) || '';
      const ok = await sendPush(uid, '明日はトレーニングの日！', '明日' + (nextTime ? nextTime + 'に' : '') + 'THE GYMでお待ちしています💪');
      results.push({ uid, type: 'reservation', ok });
    }

    // ②来店から7日以上空いたら
    const trainings = await redis.lrange('training:' + uid, 0, 0);
    if (trainings && trainings.length > 0) {
      const last = trainings[0];
      const lastDate = new Date((last.date || '').replace(/\//g, '-').split('T')[0]);
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 7) {
        const ok = await sendPush(uid, 'お久しぶりです！', 'トレーニングから1週間が経ちました。また一緒に頑張りましょう！');
        results.push({ uid, type: 'absence', diffDays, ok });
      }
    }

    // ③月末: 月次サマリー通知
    if (isLastDayOfMonth) {
      const ok = await sendPush(uid, '今月のトレーニングお疲れ様でした！', '月次サマリーを確認してみてください📊');
      results.push({ uid, type: 'monthly', ok });
    }
  }

  return res.status(200).json({ ok: true, date: today, results });
};
