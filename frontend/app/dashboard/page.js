'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import { dashboardAPI } from '../../lib/api';
import { formatDate, formatTaka } from '../../lib/format';

const cards = [
  ['totalVehicles', 'Total Vehicles', '▣'],
  ['activeTrips', 'Active Trips', '↔'],
  ['todayIncome', "Today's Income", '↑'],
  ['todayExpenses', "Today's Expense", '↓'],
  ['totalDue', 'Total Due', '◈'],
  ['monthlyProfitLoss', 'Monthly Profit/Loss', '▥'],
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.getSummary().then((res) => setData(res.data)).catch((err) => setError(err?.message || 'Unable to load dashboard.'));
  }, []);

  const maxTrend = Math.max(...(data?.monthlyTrend || []).map((item) => Number(item.income || 0) + Number(item.expense || 0)), 1);

  return (
    <AppShell title="Dashboard">
      {error && <div className="alert error">{error}</div>}
      <div className="stats-grid">
        {cards.map(([key, label, icon]) => {
          const value = data?.[key] ?? 0;
          const money = ['todayIncome', 'todayExpenses', 'totalDue', 'monthlyProfitLoss'].includes(key);
          return (
            <div className="stat-card" key={key}>
              <div className="stat-icon">{icon}</div>
              <span>{label}</span>
              <strong>{money ? formatTaka(value) : value}</strong>
            </div>
          );
        })}
      </div>

      <div className="grid-two">
        <section className="page-card">
          <div className="section-header compact"><div><h2>Monthly Chart</h2><p>Income and expense trend for the last 6 months.</p></div></div>
          <div className="chart-list">
            {(data?.monthlyTrend || []).map((item) => (
              <div className="chart-row" key={item.month}>
                <span>{item.month}</span>
                <div className="bar-track"><i style={{ width: `${(Number(item.income || 0) / maxTrend) * 100}%` }} /></div>
                <div className="bar-track expense"><i style={{ width: `${(Number(item.expense || 0) / maxTrend) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="legend"><span><b className="legend-income" /> Income</span><span><b className="legend-expense" /> Expense</span></div>
        </section>

        <section className="page-card">
          <div className="section-header compact"><div><h2>Document Expiry Alerts</h2><p>Fitness, tax and insurance expiring within 30 days.</p></div></div>
          <div className="stack-list">
            {(data?.documentAlerts || []).length ? data.documentAlerts.map((alert, index) => (
              <div className="list-item" key={`${alert.registration_number}-${alert.document_type}-${index}`}>
                <div><strong>{alert.registration_number}</strong><span>{alert.document_type} expires on {formatDate(alert.expiry_date)}</span></div>
                <span className="status-pill pending">Reminder</span>
              </div>
            )) : <p className="muted">No upcoming document expiry.</p>}
          </div>
        </section>
      </div>

      <div className="grid-two">
        <section className="page-card">
          <div className="section-header compact"><div><h2>Recent Transactions</h2><p>Latest income and expense records.</p></div></div>
          <div className="stack-list">
            {(data?.recentTransactions || []).length ? data.recentTransactions.map((item, index) => (
              <div className="list-item" key={index}>
                <div><strong>{item.type}</strong><span>{item.description || formatDate(item.date)}</span></div>
                <strong className={item.type === 'Income' ? 'positive' : 'negative'}>{formatTaka(item.amount)}</strong>
              </div>
            )) : <p className="muted">No transactions yet.</p>}
          </div>
        </section>

        <section className="page-card">
          <div className="section-header compact"><div><h2>Quick Actions</h2><p>Daily operation shortcuts.</p></div></div>
          <div className="quick-actions">
            <Link href="/trips">Create Trip</Link>
            <Link href="/payments">Record Payment</Link>
            <Link href="/expenses">Add Expense</Link>
            <Link href="/reports">View Reports</Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
