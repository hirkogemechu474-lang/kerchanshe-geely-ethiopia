CREATE TYPE "VehicleAllocationStatus" AS ENUM ('RESERVED', 'ALLOCATED', 'RELEASED', 'DELIVERED');

CREATE TABLE "VehicleAllocation" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "vin" TEXT,
  "status" "VehicleAllocationStatus" NOT NULL DEFAULT 'RESERVED',
  "erpSystem" TEXT,
  "erpReference" TEXT,
  "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  "allocatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleAllocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleAllocation_orderId_key" ON "VehicleAllocation"("orderId");
CREATE INDEX "VehicleAllocation_vehicleId_status_idx" ON "VehicleAllocation"("vehicleId", "status");
CREATE INDEX "VehicleAllocation_vin_idx" ON "VehicleAllocation"("vin");
ALTER TABLE "VehicleAllocation" ADD CONSTRAINT "VehicleAllocation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleAllocation" ADD CONSTRAINT "VehicleAllocation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
