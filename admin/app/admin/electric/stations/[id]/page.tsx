import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ChargingStationForm from '@/components/admin/electric/ChargingStationForm';

interface Params {
  id: string;
}

export default async function EditChargingStationPage({ params }: { params: Promise<Params> }) {
  await requirePermission('canManageContent');
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/electric/stations"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-900"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Stations
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Charging Station</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update charging station information
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ChargingStationForm stationId={id} />
      </div>
    </div>
  );
}
