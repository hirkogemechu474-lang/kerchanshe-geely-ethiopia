/**
 * VehicleAdminModel — admin-panel domain model with business logic.
 */

import { VEHICLE_STATUS_LABELS, VEHICLE_STATUS_COLORS } from '@/constants/status';

export interface VehicleAdminRecord {
  id: string;
  name: string;
  slug: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  basePrice: number;
  finalPrice?: number | null;
  displayOrder: number;
  vehicleCategory?: { name: string; slug: string } | null;
  brand?: { name: string } | null;
}

export class VehicleAdminModel {
  constructor(private readonly record: VehicleAdminRecord) {}

  get id()           { return this.record.id; }
  get name()         { return this.record.name; }
  get slug()         { return this.record.slug; }
  get isActive()     { return this.record.isActive; }
  get isFeatured()   { return this.record.isFeatured; }
  get displayOrder() { return this.record.displayOrder; }
  get categoryName() { return this.record.vehicleCategory?.name ?? '—'; }
  get brandName()    { return this.record.brand?.name ?? '—'; }

  get effectivePrice(): number {
    return this.record.finalPrice ?? this.record.basePrice;
  }

  get statusLabel(): string {
    return VEHICLE_STATUS_LABELS[this.record.status] ?? this.record.status;
  }

  get statusColor(): string {
    return VEHICLE_STATUS_COLORS[this.record.status] ?? 'bg-gray-100 text-gray-700';
  }

  toRecord(): VehicleAdminRecord { return this.record; }
  static from(r: VehicleAdminRecord) { return new VehicleAdminModel(r); }
}
