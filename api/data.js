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

    function parseCSV(text) {
      const rows = [];
      let cur = '', inQuotes = false, fields = [];

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          fields.push(cur.trim().replace(/\n/g, ' '));
          cur = '';
        } else if (ch === '\n' && !inQuotes) {
          fields.push(cur.trim().replace(/\n/g, ' '));
          if (fields.some(f => f !== '')) rows.push(fields);
          fields = [];
          cur = '';
        } else {
          cur += ch;
        }
      }
      if (cur || fields.length) {
        fields.push(cur.trim().replace(/\n/g, ' '));
        if (fields.some(f => f !== '')) rows.push(fields);
      }
      return rows;
    }

    const allRows = parseCSV(text.trim());
    const headers = allRows[0].map(h => h.trim());

    const rows = allRows.slice(1).map(vals => {
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
