'use client';

import AppShell from '../../components/AppShell';
import EntityPage from '../../components/EntityPage';
import { incomeAPI, tripAPI } from '../../lib/api';

const incomeTypes = ['Trip Rent', 'Other Income', 'Payment Received'].map((v) => ({ value: v, label: v }));
const optionLoaders = {
  trips: async () => {
    const res = await tripAPI.getAll(1, 100, {});
    return (res.data.trips || []).map((t) => ({ value: t.id, label: `${t.trip_date?.slice(0, 10)} - ${t.customer_name} - ${t.registration_number}` }));
  },
};

export default function IncomePage() {
  return (
    <AppShell title="Income Management">
      <EntityPage
        title="Income"
        subtitle="Record trip rent income, other income and customer-wise payment history."
        listKey="income"
        api={incomeAPI}
        optionLoaders={optionLoaders}
        addLabel="Add Income"
        columns={[
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'income_type', label: 'Type' },
          { key: 'customer_name', label: 'Customer' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount', type: 'money' },
        ]}
        fields={[
          { name: 'tripId', from: 'trip_id', label: 'Related Trip', type: 'select', optionsKey: 'trips' },
          { name: 'incomeType', from: 'income_type', label: 'Income Type', type: 'select', options: incomeTypes, required: true },
          { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'description', label: 'Description', type: 'textarea', full: true },
        ]}
        filters={[
          { name: 'incomeType', label: 'Type', type: 'select', options: incomeTypes },
          { name: 'startDate', label: 'From Date', type: 'date' },
          { name: 'endDate', label: 'To Date', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
