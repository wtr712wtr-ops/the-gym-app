import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const raw = await redis.get(`weight:${userId}`);
  const weights = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
  return Response.json({ weights });
}

export async function POST(request) {
  const body = await request.json();
  const { userId, date, weight } = body;
  if (!userId || !date || weight == null) {
    return Response.json({ error: 'userId, date, weight required' }, { status: 400 });
  }

  const raw = await redis.get(`weight:${userId}`);
  const weights = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];

  const idx = weights.findIndex(function(w) { return w.date === date; });
  if (idx >= 0) weights[idx].weight = weight;
  else weights.push({ date, weight });

  weights.sort(function(a, b) { return b.date.localeCompare(a.date); });
  const trimmed = weights.slice(0, 90);

  await redis.set(`weight:${userId}`, JSON.stringify(trimmed));
  return Response.json({ ok: true });
}
