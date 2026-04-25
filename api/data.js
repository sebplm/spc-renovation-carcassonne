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
    // 14 derniers jours
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Données principales
    const [rawSubmissions, visits, pageViewsRaw, treatedRaw, ...uniqueCounts] = await Promise.all([
      redis.lrange('submissions', 0, 499),
      redis.hgetall('visits'),
      redis.hgetall('page_views'),
      redis.smembers('treated_submissions'),
      ...days.map(d => redis.scard(`unique:${d}`)),
    ]);

    const submissions = (rawSubmissions || []).map(s =>
      typeof s === 'string' ? JSON.parse(s) : s
    );

    const unique_visits = {};
    days.forEach((d, i) => { unique_visits[d] = uniqueCounts[i] || 0; });

    // Visiteurs uniques par URL via HyperLogLog
    const pageViews = pageViewsRaw || {};
    const urls = Object.keys(pageViews);
    const hllCounts = urls.length
      ? await Promise.all(urls.map(url => redis.pfcount(`page_hll:${url}`)))
      : [];

    const page_uniques = {};
    urls.forEach((url, i) => { page_uniques[url] = hllCounts[i] || 0; });

    return res.status(200).json({
      submissions,
      visits: visits || {},
      unique_visits,
      page_views: pageViews,
      page_uniques,
      treated: treatedRaw || [],
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
