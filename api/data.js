let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const now = Date.now();
  const bust = req.query.bust;

  if (!bust && cache && (now - cacheTime) < CACHE_TTL) {
    return res.status(200).json(cache);
  }

  try {
    const response = await fetch(
      'https://metabase.terratern.com/public/question/c2c1f01a-a467-47c7-9949-179682185830.csv',
      { signal: AbortSignal.timeout(290000) }
    );

    if (!response.ok) throw new Error(`Metabase returned ${response.status}`);

    const text = await response.text();
    const lines = text.trim().split('\n');

    function parseCSVLine(line) {
      const result = [];
      let cur = '', inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; }
        else { cur += ch; }
      }
      result.push(cur);
      return result;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = parseCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        const v = (vals[i] || '').trim();
        obj[h] = v === '' ? null : isNaN(v) ? v : Number(v);
      });
      return obj;
    });

    cache = { rows };
    cacheTime = now;

    res.status(200).json({ rows });
  } catch (e) {
    if (cache) return res.status(200).json({ ...cache, stale: true });
    res.status(500).json({ error: e.message });
  }
}
