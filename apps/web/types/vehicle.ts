/**
 * Canonical vehicle types for the public website.
 * Components and utilities should import from here, not from lib/strapiVehicles.
 */

export type VehicleStatus = 'draft' | 'published' | 'archived' | 'available' | 'limited' | 'sold_out';
export type VehicleAvailability = 'available' | 'coming-soon' | 'pre-order' | 'limited' | 'out-of-stock';
export type VehicleType = 'suv' | 'sedan' | 'electric' | 'hybrid' | 'hatchback';

export interface VehicleBrand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface VehicleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brandId?: string | null;
  brand?: VehicleBrand | null;
  isActive?: boolean;
  displayOrder?: number;
}

/** Vehicle record as returned by the local Prisma-backed API */
export interface VehicleRecord {
  id: string;
  name: string;
  slug: string;
  model: string;
  year: number;
  category: string;
  brandId?: string | null;
  brand?: VehicleBrand | null;
  categoryId?: string | null;
  vehicleCategory?: VehicleCategory | null;
  description?: string | null;
  images?: unknown;
  specifications?: unknown;
  basePrice: number;
  discountAmount?: number | null;
  discountType?: string | null;
  badge?: string | null;
  taxRate?: number;
  finalPrice?: number | null;
  stock?: number;
  sku?: string | null;
  reorderPoint?: number | null;
  warehouse?: string | null;
  location?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  status?: VehicleStatus | string;
  displayOrder?: number;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
  hidePrice?: boolean;
  highlights?: string[];
  comparison?: Record<string, any>;
  fuelType?: string;
  engineType?: string;
  horsepower?: number;
  torque?: number;
  transmission?: string;
  drivetrain?: string;
  seatingCapacity?: number;
  fuelEconomy?: string;
  electricRange?: string;
  chargingTime?: string;
  dimensions?: string;
  weight?: string;
  topSpeed?: string;
  acceleration?: string;
  warranty?: string;
  price?: number;
  startingPrice?: number;
  monthlyPayment?: number;
  type?: string;
}

/** Legacy Vehicle shape (Strapi-backed — kept for backward compatibility) */
export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  category: string;
  type: VehicleType;
  price: number;
  priceFormatted: string;
  image: string;
  gallery: string[];
  availability: VehicleAvailability;
  description: string;
  features: string[];
  specs: {
    engine: string;
    power: string;
    transmission: string;
    fuelType: string;
    seating: number;
    drivetrain: string;
    fuelEconomy?: string;
    acceleration?: string;
    topSpeed?: string;
    range?: string;
    batteryCapacity?: string;
    trim?: string;
    doors?: number;
  };
  dimensions: {
    length: string;
    width: string;
    height: string;
    wheelbase: string;
    groundClearance: string;
  };
  safety: string[];
  warranty: string;
  colors: Array<string | { name: string; hex?: string }>;
  isPopular?: boolean;
  isNew?: boolean;
  fuelType: string;
  rating?: number;
}

export interface VehicleListResponse {
  vehicles: VehicleRecord[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
