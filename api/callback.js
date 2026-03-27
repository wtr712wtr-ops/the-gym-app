import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const ADMIN_ID = 'U0f4c1d79f182f727c49b0b1bfbace466';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.redirect('/?error=no_code');
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const redirectUri = proto + '://' + req.headers.host + '/api/callback';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_CHANNEL_ID,
      client_secret: process.env.LINE_CHANNEL_SECRET
    });
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error(JSON.stringify(token));

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: 'Bearer ' + token.access_token }
    });
    const profile = await profileRes.json();

    // 管理者以外は自動でクライアント一覧に登録（memo.jsと同じ sadd('clients', ...) を使用）
    if (profile.userId && profile.userId !== ADMIN_ID) {
      try {
        const existing = await redis.smembers('clients');
        const alreadyExists = existing.some(c => c && c.id === profile.userId);
        if (!alreadyExists) {
          await redis.sadd('clients', { id: profile.userId, name: profile.displayName || '名無し' });
          console.log('auto-registered client:', profile.userId, profile.displayName);
        }
      } catch (e) {
        console.error('auto-register error:', e);
      }
    }

    const user = encodeURIComponent(JSON.stringify({
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl
    }));
    res.redirect('/?user=' + user);
  } catch (e) {
    res.redirect('/?error=' + encodeURIComponent(e.message));
  }
}
