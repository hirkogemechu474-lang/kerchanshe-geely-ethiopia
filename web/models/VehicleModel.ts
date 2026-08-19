/**
 * VehicleModel — pure domain model with business logic.
 * Wraps a VehicleRecord and adds derived properties.
 */
import type { VehicleRecord } from '@/types/vehicle';
import { AVAILABILITY_LABELS, AVAILABILITY_COLORS } from '@/constants/vehicles';

export class VehicleModel {
  constructor(private readonly record: VehicleRecord) {}

  get id()           { return this.record.id; }
  get name()         { return this.record.name; }
  get slug()         { return this.record.slug; }
  get description()  { return this.record.description ?? ''; }
  get isFeatured()   { return this.record.isFeatured ?? false; }
  get isActive()     { return this.record.isActive ?? true; }
  get displayOrder() { return this.record.displayOrder ?? 0; }
  get category()     { return this.record.vehicleCategory?.name ?? this.record.category ?? ''; }
  get categorySlug() { return this.record.vehicleCategory?.slug ?? this.record.categoryId ?? ''; }
  get heroImage()    { return this.record.heroImageUrl ?? null; }

  get effectivePrice(): number {
    return this.record.finalPrice ?? this.record.basePrice;
  }

  get discountPercent(): number {
    if (!this.record.discountAmount || !this.record.basePrice) return 0;
    if (this.record.discountType === 'percentage') return this.record.discountAmount;
    return Math.round((this.record.discountAmount / this.record.basePrice) * 100);
  }

  get availabilityLabel(): string {
    return AVAILABILITY_LABELS[this.record.badge?.toLowerCase() ?? '']
      ?? AVAILABILITY_LABELS['available'];
  }

  get availabilityColor(): string {
    return AVAILABILITY_COLORS[this.record.badge?.toLowerCase() ?? '']
      ?? AVAILABILITY_COLORS['available'];
  }

  toRecord(): VehicleRecord {
    return this.record;
  }

  static from(record: VehicleRecord): VehicleModel {
    return new VehicleModel(record);
  }
}
