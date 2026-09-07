export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(
      'https://metabase.terratern.com/public/question/c2c1f01a-a467-47c7-9949-179682185830.csv'
    );

    if (!response.ok) throw new Error(`Metabase returned ${response.status}`);

    const text = await response.text();
    const lines = text.trim().split('\n');

    function parseCSVLine(line) {
      const result = [];
      let cur = '';
      let inQuotes = false;
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

    res.status(200).json({ rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
