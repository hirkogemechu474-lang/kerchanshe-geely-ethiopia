import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ArrowLeft, Wrench, CalendarDays, User, CarFront } from 'lucide-react';

export default async function NewServiceBookingPage() {
  await requirePermission('canManageServiceBookings');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/service" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Service Booking</h1>
          <p className="mt-1 text-sm text-gray-500">Create a service appointment or work order</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Save Booking
          </button>
          <Link href="/admin/service" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
