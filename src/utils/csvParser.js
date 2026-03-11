// Minimal CSV parser supporting:
// - Separator: comma
// - Quotes around fields
// - Escaped quotes ("")
// Returns array of objects keyed by header row.

export function parseCsvToObjects(text) {
  if (!text) return [];

  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') {
        i += 1;
      }
      row.push(current);
      current = '';
      if (row.length && !(row.length === 1 && row[0] === '')) {
        rows.push(row);
      }
      row = [];
    } else {
      current += ch;
    }
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  if (!rows.length) return [];

  const header = rows[0].map((h, idx) => {
    const value = String(h || '').trim();
    return idx === 0 ? value.replace(/^\uFEFF/, '') : value;
  });
  const dataRows = rows.slice(1);

  return dataRows
    .filter((r) => r && r.some((cell) => String(cell ?? '').trim() !== ''))
    .map((r) => {
      const obj = {};
      header.forEach((key, idx) => {
        if (!key) return;
        obj[key] = String(r[idx] ?? '').trim();
      });
      return obj;
    });
}
