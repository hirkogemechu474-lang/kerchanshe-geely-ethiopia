import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import CustomersList from '@/components/admin/customers/CustomersList';

export default async function CustomersPage() {
  await requirePermission('canViewJobCards');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Every customer and vehicle on file, built up from job-card write-ups and kiosk check-ins — search by name, phone, plate, or VIN"
      />
      <CustomersList />
    </div>
  );
}
