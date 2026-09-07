export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(
      'http://metabase.terratern.com/public/question/c2c1f01a-a467-47c7-9949-179682185830.json'
    );

    if (!response.ok) throw new Error(`Metabase returned ${response.status}`);

    const json = await response.json();
    const cols = json.data.cols.map(c => c.name);
    const rows = json.data.rows.map(row => {
      const obj = {};
      cols.forEach((c, i) => obj[c] = row[i]);
      return obj;
    });

    res.status(200).json({ rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
