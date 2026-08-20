import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generic 3-tier trim structure (Models & Variants / VehiclePackage), applied to
// every vehicle that has none yet. Price is a percentage of each vehicle's own
// basePrice rather than a fixed amount, since basePrice varies wildly across
// vehicles. Mirrors the shape the public configurator (web/app/configurator/
// page.tsx) already expects and previously only had as hardcoded mock data for
// a single vehicle ('coolray') — this makes it real, per-vehicle admin data.
const TRIM_TEMPLATES = [
  {
    name: 'Comfort',
    priceMultiplier: 0,
    isDefault: true,
    description: 'The essential trim — everyday comfort and safety, ready to drive.',
    features: [
      'Manual Air Conditioning',
      'Fabric Upholstery',
      'Basic Infotainment System',
      '16" Alloy Wheels',
      'ABS with EBD',
      'Dual Front Airbags',
    ],
  },
  {
    name: 'Luxury',
    priceMultiplier: 0.08,
    isDefault: false,
    description: 'Added comfort, technology, and styling for a more refined drive.',
    features: [
      'Dual-Zone Automatic Climate Control',
      'Leather Upholstery',
      '10" Touchscreen with Apple CarPlay & Android Auto',
      '17" Alloy Wheels',
      'Panoramic Sunroof',
      'Power-Adjustable Driver Seat',
      'Reverse Camera with Parking Sensors',
    ],
  },
  {
    name: 'Sport',
    priceMultiplier: 0.15,
    isDefault: false,
    description: 'The top trim — performance-focused styling and the fullest feature set.',
    features: [
      'Sport-Tuned Suspension',
      'Sport Seats with Premium Upholstery',
      '18" Sport Alloy Wheels',
      'Premium Sound System',
      'Advanced Driver Assistance Package',
      'Paddle Shifters',
      'Ambient Interior Lighting',
    ],
  },
];

function roundPrice(value: number): number {
  if (value <= 0) return 0;
  const step = value < 100_000 ? 100 : 1_000;
  return Math.round(value / step) * step;
}

async function main() {
  console.log('🌱 Seeding Models & Variants (VehiclePackage trims) for all vehicles...\n');

  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, name: true, basePrice: true },
    orderBy: { name: 'asc' },
  });

  let vehiclesSeeded = 0;
  let vehiclesSkipped = 0;
  let trimsCreated = 0;

  for (const vehicle of vehicles) {
    const existingCount = await prisma.vehiclePackage.count({ where: { vehicleId: vehicle.id } });
    if (existingCount > 0) {
      console.log(`⏭️  ${vehicle.name} already has ${existingCount} trim(s) — skipping`);
      vehiclesSkipped++;
      continue;
    }

    for (const [index, trim] of TRIM_TEMPLATES.entries()) {
      await prisma.vehiclePackage.create({
        data: {
          vehicleId: vehicle.id,
          name: trim.name,
          description: trim.description,
          features: trim.features,
          price: roundPrice(vehicle.basePrice * trim.priceMultiplier),
          isDefault: trim.isDefault,
          sortOrder: index,
        },
      });
      trimsCreated++;
    }
    console.log(`✅ ${vehicle.name}: created ${TRIM_TEMPLATES.length} trims (Comfort / Luxury / Sport)`);
    vehiclesSeeded++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ ${vehiclesSeeded} vehicle(s) seeded, ${trimsCreated} trim(s) created`);
  console.log(`⏭️  ${vehiclesSkipped} vehicle(s) already had trims — left untouched`);
  console.log(`═══════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding vehicle packages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
