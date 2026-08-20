'use client';

import { PageHeader } from '@/components/admin/ui';
import VehiclePickerList from '@/components/admin/vehicles/VehiclePickerList';

export default function VehicleGalleryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery & Videos"
        description="Pick a vehicle to manage its photo gallery, hero image, and hero video"
      />
      <VehiclePickerList hrefFor={(id) => `/admin/vehicles/${id}/edit?step=2`} />
    </div>
  );
}
