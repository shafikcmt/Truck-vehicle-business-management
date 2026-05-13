const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (rows = [], columns = []) => {
  const header = columns.map((col) => escapeCsvValue(col.label || col.key)).join(',');
  const body = rows.map((row) => columns.map((col) => escapeCsvValue(row[col.key])).join(',')).join('\n');
  return [header, body].filter(Boolean).join('\n');
};

const sendCsv = (res, filename, rows, columns) => {
  const csv = toCsv(rows, columns);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
};

const taka = (amount) => `BDT ${Number(amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

const htmlPage = ({ title, body }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f8fafc;color:#0f172a;}
    .page{max-width:960px;margin:24px auto;background:#fff;padding:32px;border-radius:18px;box-shadow:0 20px 60px rgba(15,23,42,.08);}
    .header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #e2e8f0;padding-bottom:18px;margin-bottom:24px;}
    h1,h2,h3{margin:0 0 8px;} .muted{color:#64748b;font-size:14px;} .badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-weight:700;font-size:12px;}
    table{width:100%;border-collapse:collapse;margin-top:16px;} th,td{text-align:left;padding:10px;border-bottom:1px solid #e2e8f0;font-size:14px;} th{background:#f1f5f9;color:#334155;}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;} .box{border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#f8fafc;} .total{font-size:20px;font-weight:800;} .right{text-align:right;}
    .actions{margin:20px 0;} button{background:#0f172a;color:#fff;border:0;border-radius:10px;padding:10px 16px;cursor:pointer;}
    @media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none}.actions{display:none}}
  </style>
</head>
<body><div class="page"><div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>${body}</div></body>
</html>`;

module.exports = { toCsv, sendCsv, taka, formatDate, htmlPage };
