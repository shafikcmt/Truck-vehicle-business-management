'use client';

import AppShell from '../../components/AppShell';
import EntityPage from '../../components/EntityPage';
import { driverAPI } from '../../lib/api';
import { formatTaka } from '../../lib/format';

const statusOptions = ['Active', 'Inactive'].map((v) => ({ value: v, label: v }));
const salaryTypeOptions = ['Salary', 'Commission', 'Salary + Commission'].map((v) => ({ value: v, label: v }));

export default function DriversPage() {
  return (
    <AppShell title="Driver Management">
      <EntityPage
        title="Drivers"
        subtitle="Manage driver license, contact, salary/commission and trip history records."
        listKey="drivers"
        api={driverAPI}
        addLabel="Add Driver"
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'phone_number', label: 'Mobile' },
          { key: 'license_number', label: 'License' },
          { key: 'salary_or_commission_type', label: 'Pay Type' },
          { key: 'salary_amount', label: 'Salary', render: (row) => row.salary_amount ? formatTaka(row.salary_amount) : '-' },
          { key: 'commission_percentage', label: 'Commission %' },
          { key: 'status', label: 'Status', type: 'status' },
        ]}
        fields={[
          { name: 'name', label: 'Driver Name', required: true },
          { name: 'phoneNumber', from: 'phone_number', label: 'Mobile Number' },
          { name: 'licenseNumber', from: 'license_number', label: 'License Number' },
          { name: 'address', label: 'Address', type: 'textarea', full: true },
          { name: 'salaryOrCommissionType', from: 'salary_or_commission_type', label: 'Salary Type', type: 'select', options: salaryTypeOptions },
          { name: 'salaryAmount', from: 'salary_amount', label: 'Salary Amount', type: 'number', step: '0.01' },
          { name: 'commissionPercentage', from: 'commission_percentage', label: 'Commission %', type: 'number', step: '0.01' },
          { name: 'status', label: 'Status', type: 'select', options: statusOptions, defaultValue: 'Active' },
        ]}
        filters={[{ name: 'status', label: 'Status', type: 'select', options: statusOptions }]}
      />
    </AppShell>
  );
}
