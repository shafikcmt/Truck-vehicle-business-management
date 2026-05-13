'use client';

import AppShell from '../../components/AppShell';
import EntityPage from '../../components/EntityPage';
import { expenseAPI, tripAPI, vehicleAPI } from '../../lib/api';

const expenseTypes = ['Fuel', 'Driver Cost', 'Helper Cost', 'Toll', 'Maintenance', 'Police/Road Expense', 'Parking', 'Loading/Unloading', 'Other'].map((v) => ({ value: v, label: v }));
const optionLoaders = {
  trips: async () => {
    const res = await tripAPI.getAll(1, 100, {});
    return (res.data.trips || []).map((t) => ({ value: t.id, label: `${t.trip_date?.slice(0, 10)} - ${t.customer_name} - ${t.registration_number}` }));
  },
  vehicles: async () => {
    const res = await vehicleAPI.getAll(1, 100, {});
    return (res.data.vehicles || []).map((v) => ({ value: v.id, label: `${v.registration_number} - ${v.vehicle_type}` }));
  },
};

export default function ExpensesPage() {
  return (
    <AppShell title="Expense Management">
      <EntityPage
        title="Expenses"
        subtitle="Track fuel, driver, helper, toll, maintenance and trip/vehicle-wise costs."
        listKey="expenses"
        api={expenseAPI}
        optionLoaders={optionLoaders}
        addLabel="Add Expense"
        columns={[
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'expense_type', label: 'Type' },
          { key: 'registration_number', label: 'Vehicle' },
          { key: 'customer_name', label: 'Trip / Customer' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount', type: 'money' },
        ]}
        fields={[
          { name: 'tripId', from: 'trip_id', label: 'Related Trip', type: 'select', optionsKey: 'trips' },
          { name: 'vehicleId', from: 'vehicle_id', label: 'Vehicle', type: 'select', optionsKey: 'vehicles' },
          { name: 'expenseType', from: 'expense_type', label: 'Expense Type', type: 'select', options: expenseTypes, required: true },
          { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'description', label: 'Description', type: 'textarea', full: true },
        ]}
        filters={[
          { name: 'expenseType', label: 'Type', type: 'select', options: expenseTypes },
          { name: 'startDate', label: 'From Date', type: 'date' },
          { name: 'endDate', label: 'To Date', type: 'date' },
        ]}
      />
    </AppShell>
  );
}
