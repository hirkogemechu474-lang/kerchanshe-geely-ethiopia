import { customerRepository } from '@/repositories/customerRepository';

// UC-04 / FR-201: "look up a vehicle by plate or VIN and see its full
// service history".
export async function lookupVehicle(vin: string | undefined, plate: string | undefined) {
  const vehicle = await customerRepository.findVehicleByVinOrPlateWithHistory(vin, plate);

  if (!vehicle) {
    return { found: false as const };
  }

  return {
    found: true as const,
    customerVehicle: {
      id: vehicle.id,
      vin: vehicle.vin,
      plateNo: vehicle.plateNo,
      model: vehicle.model,
      trim: vehicle.trim,
      color: vehicle.color,
      isNev: vehicle.isNev,
      warrantyStartDate: vehicle.warrantyStartDate,
      warrantyEndDate: vehicle.warrantyEndDate,
      mileageLastKnown: vehicle.mileageLastKnown,
    },
    customer: vehicle.customer,
    history: vehicle.jobCards,
  };
}
