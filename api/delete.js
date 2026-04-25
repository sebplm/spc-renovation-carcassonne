import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-dashboard-key, content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const key = req.headers['x-dashboard-key'];
  if (!key || key !== process.env.DASHBOARD_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    // Récupère tous les éléments bruts de la liste
    const raw = await redis.lrange('submissions', 0, -1);

    // Trouve la chaîne exacte correspondant à cet ID
    const targetRaw = (raw || []).find(s => {
      try {
        const parsed = typeof s === 'string' ? JSON.parse(s) : s;
        return String(parsed.id) === String(id);
      } catch { return false; }
    });

    if (!targetRaw) return res.status(404).json({ error: 'Not found' });

    // Supprime l'entrée exacte de la liste Redis
    const rawStr = typeof targetRaw === 'string' ? targetRaw : JSON.stringify(targetRaw);
    await redis.lrem('submissions', 1, rawStr);

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
