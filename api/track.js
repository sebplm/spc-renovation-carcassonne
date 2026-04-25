import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const today = new Date().toISOString().split('T')[0];

    // IP visiteur (pour dédoublonnage)
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
               || req.socket?.remoteAddress
               || 'unknown';

    const uniqueKey = `unique:${today}`;

    await Promise.all([
      redis.hincrby('visits', today, 1),          // total pages vues
      redis.sadd(uniqueKey, ip),                   // visiteurs uniques (SET Redis)
      redis.expire(uniqueKey, 60 * 60 * 24 * 30), // expiration 30 jours
    ]);

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
