export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(
      'https://metabase.terratern.com/public/question/c2c1f01a-a467-47c7-9949-179682185830.csv'
    );

    if (!response.ok) throw new Error(`Metabase returned ${response.status}`);

    const text = await response.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = isNaN(vals[i]) || vals[i] === '' ? vals[i] : Number(vals[i]);
      });
      return obj;
    });

    res.status(200).json({ rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
