'use client';

import AppShell from '../../components/AppShell';
import EntityPage from '../../components/EntityPage';
import { ownerAPI, vehicleAPI } from '../../lib/api';

const statusOptions = ['Available', 'On Trip', 'Maintenance'].map((v) => ({ value: v, label: v }));
const optionLoaders = {
  owners: async () => {
    const res = await ownerAPI.getAll(1, 100, {});
    return (res.data.owners || []).map((o) => ({ value: o.id, label: o.name }));
  },
};

export default function VehiclesPage() {
  return (
    <AppShell title="Vehicle / Truck Management">
      <EntityPage
        title="Vehicles / Trucks"
        subtitle="Add, edit and monitor vehicle status, owner and document expiry dates."
        listKey="vehicles"
        api={vehicleAPI}
        optionLoaders={optionLoaders}
        addLabel="Add Vehicle"
        columns={[
          { key: 'registration_number', label: 'Number' },
          { key: 'vehicle_type', label: 'Type' },
          { key: 'owner_account_name', label: 'Owner', render: (row) => row.owner_account_name || row.owner_name },
          { key: 'fitness_expiry_date', label: 'Fitness', type: 'date' },
          { key: 'tax_expiry_date', label: 'Tax', type: 'date' },
          { key: 'insurance_expiry_date', label: 'Insurance', type: 'date' },
          { key: 'status', label: 'Status', type: 'status' },
        ]}
        fields={[
          { name: 'registrationNumber', from: 'registration_number', label: 'Registration Number', required: true },
          { name: 'vehicleType', from: 'vehicle_type', label: 'Vehicle Type', required: true },
          { name: 'ownerId', from: 'owner_id', label: 'Owner Account', type: 'select', optionsKey: 'owners' },
          { name: 'ownerName', from: 'owner_name', label: 'Owner Name (manual)' },
          { name: 'model', label: 'Model' },
          { name: 'capacity', label: 'Capacity' },
          { name: 'fitnessExpiryDate', from: 'fitness_expiry_date', label: 'Fitness Expiry', type: 'date' },
          { name: 'taxExpiryDate', from: 'tax_expiry_date', label: 'Tax Expiry', type: 'date' },
          { name: 'insuranceExpiryDate', from: 'insurance_expiry_date', label: 'Insurance Expiry', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: statusOptions, defaultValue: 'Available' },
        ]}
        filters={[{ name: 'status', label: 'Status', type: 'select', options: statusOptions }]}
      />
    </AppShell>
  );
}
