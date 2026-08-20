// Shared types for the split-out vehicle_features / vehicle_specifications
// Setting blobs. Kept in a plain types module (not the route files) so
// client components can import them without pulling server-only route code
// (Prisma, requireAdminApiSession) into the client bundle.

export interface VehicleFeatureLists {
  safety: string[];
  comfort: string[];
  technology: string[];
  performance: string[];
  exterior: string[];
}

export interface VehicleSpecificationLists {
  engine: string[];
  transmission: string[];
  fuelType: string[];
  driveType: string[];
}
