// Vercel serverless function: the ONLY place the Anthropic key lives (env var, never in HTML).
const hits = new Map(); // best-effort per-instance rate limit; use Upstash/Vercel KV for strict limits

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' });

  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= Number(process.env.RATE_PER_MIN || 20)) return res.status(429).json({ error: 'Too many requests, slow down' });
  hits.set(ip, [...recent, now]);

  const { prompt, system, json, lang } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 24000) return res.status(400).json({ error: 'Bad prompt' });

  const sys = `${String(system || '').slice(0, 1500)} You are a patient, encouraging tutor for Indian school and college learners. Write in ${String(lang || 'English').slice(0, 20)} using simple words.` +
    (json ? ' Respond with ONLY valid JSON. No markdown fences, no commentary.' : '');
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.MODEL || 'claude-sonnet-4-6', max_tokens: 4000, system: sys, messages: [{ role: 'user', content: prompt }] })
    });
    const d = await r.json();
    if (!r.ok) return res.status(502).json({ error: (d.error && d.error.message) || 'Upstream error' });
    res.status(200).json({ text: (d.content || []).map(c => c.text || '').join('') });
  } catch (e) {
    res.status(502).json({ error: 'AI service unreachable' });
  }
};
