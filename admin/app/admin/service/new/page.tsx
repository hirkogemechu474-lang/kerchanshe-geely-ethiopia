import { requirePermission } from '@/lib/auth/middleware';
import { ArrowLeft, Wrench, CalendarDays, User, CarFront } from 'lucide-react';
import { PageHeader, LinkButton, Button, Card } from '@/components/admin/ui';

export default async function NewServiceBookingPage() {
  await requirePermission('canManageServiceBookings');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <LinkButton href="/admin/service" variant="ghost" size="sm" className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </LinkButton>
        <PageHeader title="New Service Booking" description="Create a service appointment or work order" />
      </div>

      <Card className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2 font-medium"><User className="w-4 h-4" />Customer</span>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Customer name" />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2 font-medium"><CarFront className="w-4 h-4" />Vehicle</span>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Vehicle model or plate" />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2 font-medium"><Wrench className="w-4 h-4" />Service Type</span>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Maintenance, repair, inspection" />
          </label>
          <label className="space-y-2 text-sm text-gray-700">
            <span className="flex items-center gap-2 font-medium"><CalendarDays className="w-4 h-4" />Date</span>
            <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </label>
        </div>

        <div className="flex gap-3">
          <Button>Save Booking</Button>
          <LinkButton href="/admin/service" variant="secondary">
            Cancel
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
