'use client';

import AppShell from '../../components/AppShell';
import EntityPage from '../../components/EntityPage';
import { ownerAPI } from '../../lib/api';

const statusOptions = ['Active', 'Inactive'].map((v) => ({ value: v, label: v }));

export default function OwnersPage() {
  return (
    <AppShell title="Owner / Partner Account">
      <EntityPage
        title="Owners & Partners"
        subtitle="Track owner-wise income, payments, commission, profit share and due balance."
        listKey="owners"
        api={ownerAPI}
        addLabel="Add Owner"
        columns={[
          { key: 'name', label: 'Owner' },
          { key: 'phone_number', label: 'Phone' },
          { key: 'total_vehicles', label: 'Vehicles' },
          { key: 'commission_percentage', label: 'Commission %' },
          { key: 'profit_share_percentage', label: 'Profit Share %' },
          { key: 'total_income', label: 'Income', type: 'money' },
          { key: 'total_paid', label: 'Paid', type: 'money' },
          { key: 'status', label: 'Status', type: 'status' },
        ]}
        fields={[
          { name: 'name', label: 'Owner Name', required: true },
          { name: 'phoneNumber', from: 'phone_number', label: 'Phone Number' },
          { name: 'address', label: 'Address', type: 'textarea', full: true },
          { name: 'commissionPercentage', from: 'commission_percentage', label: 'Owner Commission %', type: 'number', step: '0.01' },
          { name: 'profitSharePercentage', from: 'profit_share_percentage', label: 'Profit Share %', type: 'number', step: '0.01' },
          { name: 'notes', label: 'Notes', type: 'textarea', full: true },
          { name: 'status', label: 'Status', type: 'select', options: statusOptions, defaultValue: 'Active' },
        ]}
        filters={[{ name: 'status', label: 'Status', type: 'select', options: statusOptions }]}
      />
    </AppShell>
  );
}
