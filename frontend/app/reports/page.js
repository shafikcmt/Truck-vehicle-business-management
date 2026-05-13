'use client';

import { useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { reportAPI } from '../../lib/api';
import { openProtectedUrl } from '../../lib/openProtected';
import { formatTaka } from '../../lib/format';

const reportTypes = [
  ['summary', 'Daily / Monthly / Yearly Summary'],
  ['profit-loss', 'Profit / Loss Report'],
  ['vehicles', 'Vehicle-wise Report'],
  ['drivers', 'Driver-wise Report'],
  ['customers', 'Customer-wise Report'],
  ['dues', 'Due Report'],
  ['expenses', 'Expense Report'],
  ['owners', 'Owner / Partner Report'],
];

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [type, setType] = useState('profit-loss');
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [groupBy, setGroupBy] = useState('day');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filters = useMemo(() => ({ startDate, endDate, groupBy }), [startDate, endDate, groupBy]);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportAPI.get(type, filters);
      setReport(res.data);
    } catch (err) {
      setError(err?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => openProtectedUrl(reportAPI.url(type, { ...filters, format }));
  const rows = report?.rows || [];
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <AppShell title="Reports & Export">
      <section className="page-card">
        <div className="section-header">
          <div><h2>Business Reports</h2><p>Generate daily, monthly, yearly, vehicle, driver, customer, due, expense and profit/loss reports.</p></div>
        </div>
        <div className="toolbar">
          <label className="filter-control"><span>Report Type</span><select value={type} onChange={(e) => setType(e.target.value)}>{reportTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="filter-control"><span>Start Date</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label className="filter-control"><span>End Date</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
          {type === 'summary' && <label className="filter-control"><span>Group By</span><select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}><option value="day">Day</option><option value="month">Month</option><option value="year">Year</option></select></label>}
          <button className="primary-button" onClick={generate}>{loading ? 'Generating...' : 'Generate'}</button>
        </div>
        {error && <div className="alert error">{error}</div>}
      </section>

      {report && (
        <section className="page-card">
          <div className="section-header compact">
            <div>
              <h2>{report.title}</h2>
              <p>{startDate} to {endDate}</p>
              {'totalIncome' in report && <p><strong>Income:</strong> {formatTaka(report.totalIncome)} &nbsp; <strong>Expense:</strong> {formatTaka(report.totalExpense)} &nbsp; <strong>Net:</strong> {formatTaka(report.netProfitLoss)}</p>}
            </div>
            <div className="inline-actions">
              <button className="ghost-button" onClick={() => exportReport('csv')}>Excel/CSV</button>
              <button className="ghost-button" onClick={() => exportReport('print')}>Print/PDF</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr>{columns.map((col) => <th key={col}>{col.replaceAll('_', ' ')}</th>)}</tr></thead>
              <tbody>
                {rows.length ? rows.map((row, index) => <tr key={index}>{columns.map((col) => <td key={col}>{row[col] ?? '-'}</td>)}</tr>) : <tr><td>No rows available.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  );
}
