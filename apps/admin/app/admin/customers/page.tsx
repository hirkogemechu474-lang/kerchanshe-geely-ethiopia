import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import CustomersList from '@/components/admin/customers/CustomersList';

export default async function CustomersPage() {
  const session = await requirePermission('canViewCustomers');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Every customer and vehicle on file, built up from job-card write-ups, kiosk check-ins, and walk-in registrations — search by name, phone, plate, or VIN"
      />
      <CustomersList canAdd={session.user.permissions.canManageCustomers} />
    </div>
  );
}
