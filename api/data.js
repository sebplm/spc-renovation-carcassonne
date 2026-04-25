import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-dashboard-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const key = req.headers['x-dashboard-key'];
  if (!key || key !== process.env.DASHBOARD_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [rawSubmissions, visits] = await Promise.all([
      redis.lrange('submissions', 0, 499),
      redis.hgetall('visits'),
    ]);

    const submissions = (rawSubmissions || []).map(s =>
      typeof s === 'string' ? JSON.parse(s) : s
    );

    return res.status(200).json({ submissions, visits: visits || {} });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
