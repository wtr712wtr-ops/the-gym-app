import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const raw = await redis.get(`goal:${userId}`);
  const goal = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
  return Response.json({ goal });
}

export async function POST(request) {
  const body = await request.json();
  const { userId, targetWeight, targetDate, memo } = body;
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  await redis.set(`goal:${userId}`, JSON.stringify({ targetWeight, targetDate, memo: memo || '' }));
  return Response.json({ ok: true });
}
