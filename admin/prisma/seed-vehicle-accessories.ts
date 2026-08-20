import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Global accessories (vehicleId: null) — available to every vehicle, matching
// the "available for all vehicles" scope already built into the admin CRUD
// (admin/app/admin/vehicles/models-variants — Accessories tab) and the public
// configuration API's `OR: [{ vehicleId }, { vehicleId: null }]` lookup.
const ACCESSORIES = [
  { name: 'Roof Rack', category: 'Exterior', price: 8000, description: 'Aerodynamic roof rack for additional cargo capacity.' },
  { name: 'Mud Flaps (Set of 4)', category: 'Exterior', price: 2500, description: 'Protects paintwork and wheel arches from road debris.' },
  { name: 'Chrome Door Handles', category: 'Exterior', price: 3500, description: 'Upgraded chrome-finish exterior door handles.' },
  { name: 'Rear Spoiler', category: 'Exterior', price: 12000, description: 'Sport-styled rear spoiler for a more dynamic look.' },
  { name: 'All-Weather Floor Mats', category: 'Interior', price: 3000, description: 'Heavy-duty rubber floor mats, front and rear.' },
  { name: 'Cargo Tray / Boot Liner', category: 'Interior', price: 2800, description: 'Waterproof boot liner to protect the cargo area.' },
  { name: 'Leather Seat Covers', category: 'Interior', price: 15000, description: 'Premium tailored leather seat covers, full set.' },
  { name: 'Dash Cam (Front & Rear)', category: 'Technology', price: 9500, description: 'HD dual-channel dash camera with night vision.' },
  { name: 'Wireless Phone Charger Pad', category: 'Technology', price: 4000, description: 'Center console wireless charging pad.' },
  { name: 'Rear Parking Sensors', category: 'Safety', price: 6500, description: 'Ultrasonic rear parking sensors with audible alert.' },
  { name: 'First Aid & Emergency Kit', category: 'Safety', price: 1500, description: 'Roadside emergency kit with first aid supplies.' },
];

async function main() {
  console.log('🌱 Seeding global vehicle accessories...\n');

  const existingCount = await prisma.vehicleAccessory.count();
  if (existingCount > 0) {
    console.log(`⏭️  ${existingCount} accessorie(s) already exist — skipping entirely`);
    return;
  }

  let created = 0;
  for (const [index, item] of ACCESSORIES.entries()) {
    await prisma.vehicleAccessory.create({
      data: {
        vehicleId: null,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        inStock: true,
        sortOrder: index,
      },
    });
    console.log(`✅ [${item.category}] ${item.name} — ETB ${item.price.toLocaleString()}`);
    created++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ ${created} global accessorie(s) created`);
  console.log(`═══════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding vehicle accessories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
