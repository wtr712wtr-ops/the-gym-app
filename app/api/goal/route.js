import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

function parseRedis(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return raw; } }
  return raw;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

    const raw = await redis.get(`goal:${userId}`);
    const goal = parseRedis(raw) || null;
    return Response.json({ goal });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, targetWeight, targetDate, memo } = body;
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

    await redis.set(`goal:${userId}`, JSON.stringify({
      targetWeight: targetWeight || null,
      targetDate: targetDate || null,
      memo: memo || ''
    }));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
