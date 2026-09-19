'use client';

import { PageHeader } from '@/components/admin/ui';
import VehiclePickerList from '@/components/admin/vehicles/VehiclePickerList';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function VehicleSectionsPage() {
  useAdminAuth('canManageVehicles');
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Sections"
        description="Pick a vehicle to edit its Performance, Safety, Technology, Interior, and Exterior specification panels"
      />
      <VehiclePickerList hrefFor={(id) => `/admin/vehicles/${id}/edit?step=3`} />
    </div>
  );
}
