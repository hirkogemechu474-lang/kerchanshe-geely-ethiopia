// One-time data fix for the homepage "Explore Every Angle" section
// (apps/web/components/home/ShowcaseSection.tsx). Only 2 of the site's 3
// published vehicles (geely-ex5, geely-ex2) had a VehicleShowcase row, so
// the section's model-toggle only ever showed 2 buttons even though
// geely-panda-mini is also published. This script:
//   1. Creates the missing VehicleShowcase for Geely Panda Mini, reusing
//      real on-disk seed photography/video (same source used by
//      backend/scripts/repair-vehicle-media.ts for this vehicle's gallery).
//   2. Rewrites title/subtitle on all three showcases to a single
//      model-agnostic heading, since the section previously showed
//      per-model copy ("Experience the Geely EX2 like never before...")
//      that changed when switching tabs.
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SEED_ROOT = path.join(REPO_ROOT, 'apps', 'admin', 'public', 'uploads', 'seed');

function urlFor(relPath: string): string {
  return '/uploads/seed/' + relPath.split('/').map(encodeURIComponent).join('/');
}

const TITLE = 'Explore the Geely Range';
const SUBTITLE = 'Take a closer look at our flagship models and experience them from every angle.';

async function main() {
  await prisma.vehicleShowcase.updateMany({
    where: { vehicleId: { in: ['geely-ex5', 'geely-ex2'] } },
    data: { title: TITLE, subtitle: SUBTITLE },
  });
  console.log('Updated title/subtitle on EX5 and EX2 showcases');

  const vehicle = await prisma.vehicle.findUnique({ where: { slug: 'geely-panda-mini' } });
  if (!vehicle) throw new Error('geely-panda-mini vehicle not found');

  const existing = await prisma.vehicleShowcase.findFirst({ where: { vehicleId: 'geely-panda-mini' } });
  if (existing) {
    console.log('Showcase for geely-panda-mini already exists, skipping create');
    await prisma.$disconnect();
    return;
  }

  const pandaImageFiles = [
    { file: 'exterior-front.jpg', label: 'Exterior Front' },
    { file: 'exterior-color-alt.jpg', label: 'Exterior Color' },
    { file: 'exterior-headlight-detail.jpg', label: 'Headlight Detail' },
    { file: 'interior-front-seat.jpg', label: 'Interior Front' },
    { file: 'interior-rear-seat.jpg', label: 'Interior Rear' },
    { file: 'lifestyle.jpg', label: 'Lifestyle' },
  ].filter(({ file }) => fs.existsSync(path.join(SEED_ROOT, 'models/panda-mini/images', file)));

  if (pandaImageFiles.length === 0) throw new Error('No panda-mini seed images found on disk');

  const angleStep = Math.floor(360 / pandaImageFiles.length);
  const views = pandaImageFiles.map(({ file, label }, i) => ({
    angle: String(i * angleStep),
    imageUrl: urlFor(`models/panda-mini/images/${file}`),
    label,
  }));

  const videoPath = path.join(SEED_ROOT, 'models/panda-mini/videos/flyme-sound.mp4');
  const videoUrl = fs.existsSync(videoPath) ? urlFor('models/panda-mini/videos/flyme-sound.mp4') : null;

  const created = await prisma.vehicleShowcase.create({
    data: {
      vehicleId: vehicle.slug,
      vehicleName: vehicle.name,
      title: TITLE,
      subtitle: SUBTITLE,
      views,
      videoUrl,
      sortOrder: 2,
      isActive: true,
      status: 'PUBLISHED',
    },
  });
  console.log(`Created showcase for geely-panda-mini: ${views.length} views, video=${Boolean(videoUrl)}, id=${created.id}`);

  await prisma.vehicleShowcase.updateMany({ where: { vehicleId: 'geely-ex5' }, data: { sortOrder: 0 } });
  await prisma.vehicleShowcase.updateMany({ where: { vehicleId: 'geely-ex2' }, data: { sortOrder: 1 } });
  console.log('Normalized sortOrder: EX5=0, EX2=1, Panda Mini=2');
}

main()
  .catch((error) => {
    console.error('Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
