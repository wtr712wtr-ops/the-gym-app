import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const ADMIN_LINE_ID = 'U0f4c1d79f182f727c49b0b1bfbace466';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const clientId = searchParams.get('clientId');

  if (adminId !== ADMIN_LINE_ID) {
        return Response.json({ error: '権限なし' }, { status: 403 });
  }

  if (clientId) {
        const memos = await redis.lrange(`memo:${clientId}`, 0, -1);
        return Response.json({ memos });
  }

  const clients = await redis.smembers('clients') || [];
    return Response.json({ clients });
}

export async function POST(request) {
    const body = await request.json();
    const { adminId, action, clientId, clientName, memo } = body;

  if (adminId !== ADMIN_LINE_ID) {
        return Response.json({ error: '権限なし' }, { status: 403 });
  }

  if (action === 'addClient') {
        await redis.sadd('clients', JSON.stringify({ id: clientId, name: clientName }));
        return Response.json({ ok: true });
  }

  if (action === 'addMemo') {
        const entry = JSON.stringify({
                text: memo,
                date: new Date().toLocaleDateString('ja-JP')
        });
        await redis.lpush(`memo:${clientId}`, entry);
        return Response.json({ ok: true });
  }

  return Response.json({ error: '不明なaction' }, { status: 400 });
}
