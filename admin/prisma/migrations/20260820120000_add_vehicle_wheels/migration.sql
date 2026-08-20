-- Adds VehicleWheel, the real backing model for the configurator's "Choose
-- Wheels" step (previously hardcoded mock data with no admin control at all).
-- Mirrors VehicleAccessory's nullable-vehicleId pattern: null means the wheel
-- option is available for every vehicle.

CREATE TABLE "VehicleWheel" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleWheel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VehicleWheel_vehicleId_idx" ON "VehicleWheel"("vehicleId");

ALTER TABLE "VehicleWheel"
  ADD CONSTRAINT "VehicleWheel_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
