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

    const raw = await redis.get(`weight:${userId}`);
    const weights = parseRedis(raw) || [];
    return Response.json({ weights: Array.isArray(weights) ? weights : [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, date, weight } = body;
    if (!userId || !date || weight == null) {
      return Response.json({ error: 'userId, date, weight required' }, { status: 400 });
    }

    const raw = await redis.get(`weight:${userId}`);
    const weights = Array.isArray(parseRedis(raw)) ? parseRedis(raw) : [];

    const idx = weights.findIndex(function(w) { return w.date === date; });
    if (idx >= 0) weights[idx].weight = weight;
    else weights.push({ date, weight });

    weights.sort(function(a, b) { return b.date.localeCompare(a.date); });
    const trimmed = weights.slice(0, 90);

    await redis.set(`weight:${userId}`, JSON.stringify(trimmed));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
