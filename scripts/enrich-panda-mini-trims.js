// Gives the Geely Panda Mini's 3 trim cards (Comfort/Luxury/Sport) a real
// photo each, same as EX2/EX5 already have — reusing already-uploaded EX2/EX5
// photos (no dedicated Panda Mini shoot exists, same rationale as
// enrich-panda-mini.js). Pure DB update, no new files.

const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

const PANDA_MINI_ID = '072de2fa-9b90-4c0c-85b9-1c2ad322ebb2';
const EX2_ID = 'e3c05fbc-5112-4b7a-a103-f47691f5463d';
const EX5_ID = '021eee8f-d84a-4204-84b3-b17114ef1b87';

async function main() {
  const [pandaPackages, ex2Packages, ex5Packages] = await Promise.all([
    prisma.vehiclePackage.findMany({ where: { vehicleId: PANDA_MINI_ID }, orderBy: { name: 'asc' } }),
    prisma.vehiclePackage.findMany({ where: { vehicleId: EX2_ID }, orderBy: { name: 'asc' } }),
    prisma.vehiclePackage.findMany({ where: { vehicleId: EX5_ID }, orderBy: { name: 'asc' } }),
  ]);

  const bySrc = (rows) => Object.fromEntries(rows.map((r) => [r.name, r.imageUrl]));
  const ex2 = bySrc(ex2Packages);
  const ex5 = bySrc(ex5Packages);

  // Alternate EX2/EX5 sources so the mix is visible across the 3 cards.
  const sourceFor = { Comfort: ex5.Comfort, Luxury: ex2.Luxury, Sport: ex5.Sport };

  for (const pkg of pandaPackages) {
    const imageUrl = sourceFor[pkg.name];
    if (!imageUrl) { console.warn('No source photo for', pkg.name); continue; }
    await prisma.vehiclePackage.update({ where: { id: pkg.id }, data: { imageUrl } });
    console.log('Updated', pkg.name, '->', imageUrl);
  }
}

main()
  .catch((err) => { console.error('FAILED:', err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
