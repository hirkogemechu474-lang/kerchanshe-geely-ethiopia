// One-time fix: apps/admin/public/uploads/seed/models/panda-mini/images/lifestyle.jpg
// is actually a photo of a Geely EX2 (visible "GEELY EX2" badge on the car),
// mistakenly bundled as Panda Mini seed photography. It was included as a
// view in the Panda Mini VehicleShowcase by backend/scripts/add-panda-mini-showcase.ts.
// This removes just that one mislabeled view; the other 5 real Panda Mini
// photos are untouched.
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

async function main() {
  const showcase = await prisma.vehicleShowcase.findFirst({ where: { vehicleId: 'geely-panda-mini' } });
  if (!showcase) {
    console.log('No geely-panda-mini showcase found, nothing to fix');
    return;
  }
  const views = Array.isArray(showcase.views) ? (showcase.views as any[]) : [];
  const filtered = views.filter((v) => !String(v.imageUrl).includes('models/panda-mini/images/lifestyle.jpg'));
  if (filtered.length === views.length) {
    console.log('Mislabeled lifestyle.jpg view not found, nothing to remove');
    return;
  }
  await prisma.vehicleShowcase.update({ where: { id: showcase.id }, data: { views: filtered } });
  console.log(`Removed mislabeled EX2 photo from Panda Mini showcase (${views.length} -> ${filtered.length} views)`);
}

main()
  .catch((error) => {
    console.error('Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
