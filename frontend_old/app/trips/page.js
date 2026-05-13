'use client';

import AppShell from '../../components/AppShell';
import EntityPage from '../../components/EntityPage';
import { billingAPI, driverAPI, tripAPI, vehicleAPI } from '../../lib/api';
import { openProtectedUrl } from '../../lib/openProtected';

const statusOptions = ['Pending', 'Running', 'Completed', 'Cancelled'].map((v) => ({ value: v, label: v }));
const paymentStatusOptions = ['Pending', 'Partial', 'Paid'].map((v) => ({ value: v, label: v }));
const optionLoaders = {
  vehicles: async () => {
    const res = await vehicleAPI.getAll(1, 100, {});
    return (res.data.vehicles || []).map((v) => ({ value: v.id, label: `${v.registration_number} - ${v.vehicle_type}` }));
  },
  drivers: async () => {
    const res = await driverAPI.getAll(1, 100, {});
    return (res.data.drivers || []).map((d) => ({ value: d.id, label: `${d.name}${d.phone_number ? ` (${d.phone_number})` : ''}` }));
  },
};

export default function TripsPage() {
  return (
    <AppShell title="Trip Management">
      <EntityPage
        title="Trips"
        subtitle="Create trips, track route, fare, advance, due and trip status."
        listKey="trips"
        api={tripAPI}
        optionLoaders={optionLoaders}
        addLabel="Create Trip"
        columns={[
          { key: 'trip_date', label: 'Date', type: 'date' },
          { key: 'registration_number', label: 'Vehicle' },
          { key: 'driver_name', label: 'Driver' },
          { key: 'customer_name', label: 'Customer' },
          { key: 'loading_point', label: 'From' },
          { key: 'unloading_point', label: 'To' },
          { key: 'fare_amount', label: 'Fare', type: 'money' },
          { key: 'due_amount', label: 'Due', type: 'money' },
          { key: 'status', label: 'Status', type: 'status' },
        ]}
        fields={[
          { name: 'vehicleId', from: 'vehicle_id', label: 'Truck / Vehicle', type: 'select', optionsKey: 'vehicles', required: true },
          { name: 'driverId', from: 'driver_id', label: 'Driver', type: 'select', optionsKey: 'drivers', required: true },
          { name: 'customerName', from: 'customer_name', label: 'Customer Name', required: true },
          { name: 'customerPhone', from: 'customer_phone', label: 'Customer Phone' },
          { name: 'loadingPoint', from: 'loading_point', label: 'Loading Point' },
          { name: 'unloadingPoint', from: 'unloading_point', label: 'Unloading Point' },
          { name: 'goodsDescription', from: 'goods_description', label: 'Goods Description', type: 'textarea', full: true },
          { name: 'branchName', from: 'branch_name', label: 'Branch Name' },
          { name: 'tripDate', from: 'trip_date', label: 'Trip Date', type: 'date', required: true },
          { name: 'fareAmount', from: 'fare_amount', label: 'Rent / Fare Amount', type: 'number', step: '0.01', required: true },
          { name: 'advancePayment', from: 'advance_payment', label: 'Advance Payment', type: 'number', step: '0.01', defaultValue: '0' },
          { name: 'status', label: 'Trip Status', type: 'select', options: statusOptions, defaultValue: 'Pending' },
        ]}
        filters={[
          { name: 'status', label: 'Trip Status', type: 'select', options: statusOptions },
          { name: 'paymentStatus', label: 'Payment', type: 'select', options: paymentStatusOptions },
          { name: 'startDate', label: 'From Date', type: 'date' },
          { name: 'endDate', label: 'To Date', type: 'date' },
        ]}
        extraActions={(row) => (
          <>
            <button className="small-button" onClick={() => openProtectedUrl(billingAPI.invoiceUrl(row.id))}>Invoice</button>
            <button className="small-button" onClick={() => openProtectedUrl(billingAPI.challanUrl(row.id))}>Challan</button>
          </>
        )}
      />
    </AppShell>
  );
}
