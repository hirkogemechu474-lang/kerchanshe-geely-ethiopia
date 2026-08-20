-- Add real foreign keys from VehicleColor/VehicleAccessory/VehiclePackage/VehicleInterior
-- to Vehicle. These previously had a bare `vehicleId String` with no relation at all.
-- Confirmed all 4 tables are empty in every environment before writing this migration.

ALTER TABLE "VehicleColor"
  ADD CONSTRAINT "VehicleColor_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "VehicleColor_vehicleId_idx" ON "VehicleColor"("vehicleId");

ALTER TABLE "VehicleAccessory"
  ADD CONSTRAINT "VehicleAccessory_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "VehicleAccessory_vehicleId_idx" ON "VehicleAccessory"("vehicleId");

ALTER TABLE "VehiclePackage"
  ADD CONSTRAINT "VehiclePackage_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "VehiclePackage_vehicleId_idx" ON "VehiclePackage"("vehicleId");

ALTER TABLE "VehicleInterior"
  ADD CONSTRAINT "VehicleInterior_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "VehicleInterior_vehicleId_idx" ON "VehicleInterior"("vehicleId");
