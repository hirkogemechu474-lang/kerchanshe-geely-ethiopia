import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// VehicleColor.vehicleId is required (not nullable like VehicleAccessory), so
// colors are seeded per-vehicle rather than globally — same 6-color palette
// applied to every vehicle with none yet, generalized from what used to be
// web/app/configurator/page.tsx's hardcoded colorOptions mock.
const COLORS = [
  { name: 'Pearl White', colorCode: '#F8F9FA', price: 0, isDefault: true },
  { name: 'Obsidian Black', colorCode: '#1A1D23', price: 5000, isDefault: false },
  { name: 'Titanium Silver', colorCode: '#C0C0C0', price: 0, isDefault: false },
  { name: 'Ocean Blue', colorCode: '#0057B8', price: 5000, isDefault: false },
  { name: 'Crimson Red', colorCode: '#DC143C', price: 8000, isDefault: false },
  { name: 'Storm Grey', colorCode: '#6C757D', price: 0, isDefault: false },
];

async function main() {
  console.log('🌱 Seeding vehicle colors for all vehicles...\n');

  const vehicles = await prisma.vehicle.findMany({ select: { id: true, name: true } });

  let vehiclesSeeded = 0;
  let vehiclesSkipped = 0;
  let colorsCreated = 0;

  for (const vehicle of vehicles) {
    const existingCount = await prisma.vehicleColor.count({ where: { vehicleId: vehicle.id } });
    if (existingCount > 0) {
      console.log(`⏭️  ${vehicle.name} already has ${existingCount} color(s) — skipping`);
      vehiclesSkipped++;
      continue;
    }

    for (const [index, color] of COLORS.entries()) {
      await prisma.vehicleColor.create({
        data: {
          vehicleId: vehicle.id,
          name: color.name,
          colorCode: color.colorCode,
          price: color.price,
          isDefault: color.isDefault,
          inStock: true,
          sortOrder: index,
        },
      });
      colorsCreated++;
    }
    console.log(`✅ ${vehicle.name}: created ${COLORS.length} colors`);
    vehiclesSeeded++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ ${vehiclesSeeded} vehicle(s) seeded, ${colorsCreated} color(s) created`);
  console.log(`⏭️  ${vehiclesSkipped} vehicle(s) already had colors — left untouched`);
  console.log(`═══════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding vehicle colors:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
