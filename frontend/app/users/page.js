'use client';

import AppShell from '../../components/AppShell';
import EntityPage from '../../components/EntityPage';
import { userAPI } from '../../lib/api';

const roleOptions = ['admin', 'staff', 'viewer'].map((v) => ({ value: v, label: v }));
const statusOptions = ['Active', 'Inactive'].map((v) => ({ value: v, label: v }));

export default function UsersPage() {
  return (
    <AppShell title="User Management">
      <EntityPage
        title="Users & Roles"
        subtitle="Create admin/staff/viewer users with role-based access."
        listKey="users"
        api={userAPI}
        addLabel="Add User"
        columns={[
          { key: 'full_name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone_number', label: 'Phone' },
          { key: 'role', label: 'Role', type: 'status' },
          { key: 'status', label: 'Status', type: 'status' },
          { key: 'created_at', label: 'Created', type: 'date' },
        ]}
        fields={[
          { name: 'fullName', from: 'full_name', label: 'Full Name' },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phoneNumber', from: 'phone_number', label: 'Phone Number' },
          { name: 'password', label: 'Password', type: 'password' },
          { name: 'role', label: 'Role', type: 'select', options: roleOptions, defaultValue: 'staff' },
          { name: 'status', label: 'Status', type: 'select', options: statusOptions, defaultValue: 'Active' },
        ]}
        filters={[
          { name: 'role', label: 'Role', type: 'select', options: roleOptions },
          { name: 'status', label: 'Status', type: 'select', options: statusOptions },
        ]}
      />
    </AppShell>
  );
}
