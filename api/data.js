export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(
      'https://metabase.terratern.com/public/question/c2c1f01a-a467-47c7-9949-179682185830.csv',
      { signal: AbortSignal.timeout(290000) }
    );

    if (!response.ok) throw new Error(`Metabase returned ${response.status}`);

    const rawText = await response.text();
    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    console.log('CSV lines:', text.split('\n').length);
    console.log('CSV size bytes:', text.length);

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

    console.log('Parsed rows:', allRows.length);

    const headers = allRows[0].map(h => h.trim());

    const rows = allRows.slice(1).map(vals => {
      const obj = {};
      headers.forEach((h, i) => {
        const v = (vals[i] || '').trim();
        obj[h] = v === '' ? null : isNaN(v) ? v : Number(v);
      });
      return obj;
    });

    console.log('Final rows:', rows.length);
    console.log('Sample row:', JSON.stringify(rows[0]));

    res.status(200).json({ rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
