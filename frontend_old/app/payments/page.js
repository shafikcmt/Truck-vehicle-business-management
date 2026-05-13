'use client';

import { useState } from 'react';
import AppShell from '../../components/AppShell';
import EntityPage from '../../components/EntityPage';
import { paymentAPI, tripAPI } from '../../lib/api';
import { formatDate, formatTaka } from '../../lib/format';

const paymentMethods = ['Cash', 'Bank', 'Mobile Banking'].map((v) => ({ value: v, label: v }));
const dueStatusOptions = ['Pending', 'Partial', 'Paid'].map((v) => ({ value: v, label: v }));
const optionLoaders = {
  trips: async () => {
    const res = await tripAPI.getAll(1, 100, {});
    return (res.data.trips || []).map((t) => ({ value: t.id, label: `${t.trip_date?.slice(0, 10)} - ${t.customer_name} - ${t.registration_number}` }));
  },
};

function DuesPanel() {
  const [dues, setDues] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getDues(1, 50, { status: status || undefined });
      setDues(res.data.dues || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-card">
      <div className="section-header compact">
        <div><h2>Due Tracking</h2><p>Customer due status with pending and partial payment records.</p></div>
        <div className="inline-actions">
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{dueStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <button className="ghost-button" onClick={load}>{loading ? 'Loading...' : 'Load Dues'}</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Vehicle</th><th>Customer</th><th>Fare</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {dues.length ? dues.map((due) => (
              <tr key={due.trip_id}><td>{formatDate(due.trip_date)}</td><td>{due.registration_number}</td><td>{due.customer_name}</td><td>{formatTaka(due.fare_amount)}</td><td>{formatTaka(due.total_payments)}</td><td>{formatTaka(due.due_amount)}</td><td><span className={`status-pill ${String(due.status).toLowerCase()}`}>{due.status}</span></td></tr>
            )) : <tr><td colSpan="7">Click Load Dues to view due records.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PaymentsPage() {
  return (
    <AppShell title="Payments & Due Management">
      <EntityPage
        title="Payments"
        subtitle="Record customer payments, partial payments and payment method references."
        listKey="payments"
        api={paymentAPI}
        optionLoaders={optionLoaders}
        addLabel="Record Payment"
        columns={[
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'customer_name', label: 'Customer' },
          { key: 'registration_number', label: 'Vehicle' },
          { key: 'payment_method', label: 'Method' },
          { key: 'reference_no', label: 'Reference' },
          { key: 'amount', label: 'Amount', type: 'money' },
        ]}
        fields={[
          { name: 'tripId', from: 'trip_id', label: 'Trip', type: 'select', optionsKey: 'trips', required: true },
          { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
          { name: 'paymentMethod', from: 'payment_method', label: 'Payment Method', type: 'select', options: paymentMethods, defaultValue: 'Cash' },
          { name: 'referenceNo', from: 'reference_no', label: 'Reference No' },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'note', label: 'Note', type: 'textarea', full: true },
        ]}
        filters={[
          { name: 'paymentMethod', label: 'Method', type: 'select', options: paymentMethods },
          { name: 'startDate', label: 'From Date', type: 'date' },
          { name: 'endDate', label: 'To Date', type: 'date' },
        ]}
      />
      <DuesPanel />
    </AppShell>
  );
}
