import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, MapPin } from 'lucide-react';
import ChargingStationList from '@/components/admin/electric/ChargingStationList';

export default async function ChargingStationsPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Charging Stations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage charging station locations, types, and availability
          </p>
        </div>
        <Link
          href="/admin/electric/stations/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Station
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">⚡ Charging Station Management</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Add, edit, and delete charging station locations</li>
          <li>• Set station type: Fast DC, Level 2, or Home charging</li>
          <li>• Upload station images and manage amenities</li>
          <li>• Configure pricing, hours, and connector types</li>
          <li>• Toggle active/inactive status for visibility</li>
        </ul>
      </div>

      <ChargingStationList />
    </div>
  );
}
