import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Global wheel options (vehicleId: null) — available to every vehicle,
// generalized from web/app/configurator/page.tsx's previous hardcoded
// wheelOptions mock (the only "Choose Wheels" data that ever existed).
const WHEELS = [
  { name: 'Standard Alloy', size: '16"', price: 0, isDefault: true },
  { name: 'Premium Alloy', size: '17"', price: 12000, isDefault: false },
  { name: 'Sport Alloy', size: '18"', price: 25000, isDefault: false },
];

async function main() {
  console.log('🌱 Seeding global vehicle wheel options...\n');

  const existingCount = await prisma.vehicleWheel.count();
  if (existingCount > 0) {
    console.log(`⏭️  ${existingCount} wheel option(s) already exist — skipping entirely`);
    return;
  }

  let created = 0;
  for (const [index, wheel] of WHEELS.entries()) {
    await prisma.vehicleWheel.create({
      data: {
        vehicleId: null,
        name: wheel.name,
        size: wheel.size,
        price: wheel.price,
        isDefault: wheel.isDefault,
        inStock: true,
        sortOrder: index,
      },
    });
    console.log(`✅ ${wheel.name} (${wheel.size}) — ETB ${wheel.price.toLocaleString()}`);
    created++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ ${created} global wheel option(s) created`);
  console.log(`═══════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding vehicle wheels:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
