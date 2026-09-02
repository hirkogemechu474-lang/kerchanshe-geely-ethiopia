'use client';

import { PageHeader } from '@/components/admin/ui';
import VehiclePickerList from '@/components/admin/vehicles/VehiclePickerList';

export default function VehicleSectionsPage() {
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
