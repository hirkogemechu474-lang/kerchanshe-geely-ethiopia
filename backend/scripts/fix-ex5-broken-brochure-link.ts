// One-time fix: the GEELY EX5 VehicleShowcase row has brochureUrl pointing
// at /uploads/1789046722694-geely-ex5-brochure.pdf, which 404s — the file
// was never actually written to disk (same class of bug as the fabricated
// /uploads/vehicle/ URLs fixed by repair-vehicle-media.ts). This override
// field is optional and, per its own schema comment, only exists to
// "override the auto-generated fallback at /api/vehicles/:id/brochure" —
// which already works correctly and serves a real PDF. Clearing the broken
// override restores a working "Download Brochure" button on both the
// /models/geely-ex5 page and the new /download-brochure hub page.
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

async function main() {
  const showcase = await prisma.vehicleShowcase.findFirst({ where: { vehicleId: 'geely-ex5' } });
  if (!showcase) {
    console.log('No geely-ex5 showcase found, nothing to fix');
    return;
  }
  if (!showcase.brochureUrl) {
    console.log('brochureUrl already empty, nothing to fix');
    return;
  }
  await prisma.vehicleShowcase.update({
    where: { id: showcase.id },
    data: { brochureUrl: null, brochureFileName: null, brochureFileSize: null },
  });
  console.log(`Cleared broken brochureUrl (${showcase.brochureUrl}) — EX5 now falls back to the auto-generated PDF`);
}

main()
  .catch((error) => {
    console.error('Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
