import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const today = new Date().toISOString().split('T')[0];
    const ip    = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
                  || req.socket?.remoteAddress || 'unknown';

    // URL de la page visitée (envoyée par le script côté client)
    const url = (req.body?.url || '/').slice(0, 200);

    await Promise.all([
      redis.hincrby('visits', today, 1),               // vues totales du jour
      redis.sadd(`unique:${today}`, ip),               // visiteurs uniques du jour
      redis.expire(`unique:${today}`, 60 * 60 * 24 * 30),
      redis.hincrby('page_views', url, 1),             // vues totales par URL
      redis.pfadd(`page_hll:${url}`, ip),              // visiteurs uniques par URL (HyperLogLog)
    ]);

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
