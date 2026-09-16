// One-time repair: Vehicle.images / heroImageUrl / heroVideoUrl for the three
// demo vehicles (geely-ex5, geely-ex2, geely-panda-mini) currently point at
// /uploads/vehicle/<timestamp>-<n>-<hex>.<ext> URLs that were never actually
// written to disk (confirmed via backend/scripts/backfill-media-assets.ts —
// these three vehicles were the only source of "referenced but missing"
// entries). Real photography for all three already exists on disk under
// apps/admin/public/uploads/seed/models/<model>/ (copied there by
// backend/prisma/seed/index.ts's copyMediaIntoUploads(), which has already
// run in this environment). That seed script itself can't repair these rows
// because its vehicle upsert uses `update: {}` — a no-op once the row
// already exists — so it only ever populates a brand-new database, never
// corrects an existing one. This script does the correction directly,
// reusing the exact same file selections as prisma/seed/index.ts, and
// updates ONLY the media fields (images/heroImageUrl/heroVideoUrl) — no
// pricing/specs/description/etc. are touched.
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

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    })
    .sort();
}

function filesUnder(relDir: string, limit = 50): string[] {
  return walk(path.join(SEED_ROOT, relDir)).slice(0, limit);
}

function urlFor(absPath: string): string {
  const rel = path.relative(SEED_ROOT, absPath).split(path.sep).join('/');
  return '/uploads/seed/' + rel.split('/').map(encodeURIComponent).join('/');
}

async function repairVehicle(slug: string, images: string[], heroImageUrl: string | null, heroVideoUrl: string | null) {
  const vehicle = await prisma.vehicle.findUnique({ where: { slug } });
  if (!vehicle) {
    console.log(`Skip ${slug}: vehicle not found`);
    return;
  }
  await prisma.vehicle.update({
    where: { slug },
    data: { images, heroImageUrl, heroVideoUrl },
  });
  console.log(`Repaired ${slug}: ${images.length} images, hero=${Boolean(heroImageUrl)}, heroVideo=${Boolean(heroVideoUrl)}`);
}

// The showcase (360° "Discover Every Angle") views/videoUrl have the exact
// same problem as the Vehicle gallery fields — fabricated /uploads/vehicle/
// URLs pointing at files that were never written, AND colorId references
// to VehicleColor rows that no longer exist (colors were recreated at some
// point with new ids). Rebuild `views` from real on-disk photography,
// re-matching each color by name to its CURRENT VehicleColor id.
async function repairShowcase(vehicleSlug: string, colorFiles: { name: string; files: string[] }[], videoFile: string | null) {
  const showcase = await prisma.vehicleShowcase.findFirst({ where: { vehicleId: vehicleSlug } });
  if (!showcase) {
    console.log(`Skip showcase for ${vehicleSlug}: not found`);
    return;
  }
  const vehicle = await prisma.vehicle.findUnique({ where: { slug: vehicleSlug } });
  if (!vehicle) return;
  const colors = await prisma.vehicleColor.findMany({ where: { vehicleId: vehicle.id } });
  const colorIdByName = new Map(colors.map((c) => [c.name, c.id]));

  const views: Array<{ angle: string; imageUrl: string; label: string; colorId?: string }> = [];
  for (const { name, files: rawFiles } of colorFiles) {
    const files = rawFiles.filter((f) => fs.existsSync(f));
    if (files.length === 0) continue;
    const colorId = colorIdByName.get(name);
    const angleStep = files.length > 1 ? Math.floor(360 / files.length) : 0;
    files.forEach((file, i) => {
      views.push({
        angle: String(i * angleStep),
        imageUrl: urlFor(file),
        label: name,
        ...(colorId ? { colorId } : {}),
      });
    });
  }

  if (views.length === 0) {
    console.log(`Skip showcase for ${vehicleSlug}: no real photos found for any color`);
    return;
  }

  const videoUrl = videoFile && fs.existsSync(videoFile) ? urlFor(videoFile) : null;
  await prisma.vehicleShowcase.update({
    where: { id: showcase.id },
    data: { views, videoUrl },
  });
  console.log(`Repaired showcase for ${vehicleSlug}: ${views.length} views across ${colorFiles.length} colors, video=${Boolean(videoUrl)}`);
}

async function main() {
  // ── Geely EX5 ──────────────────────────────────────────────────────────
  const ex5GalleryFiles = [
    ...filesUnder('models/ex5/images/exterior', 3),
    ...filesUnder('models/ex5/images/outdoor', 3),
    ...filesUnder('models/ex5/images/features', 2),
  ];
  const ex5Hero = filesUnder('models/ex5/images/outdoor')[0] ?? filesUnder('models/ex5/images/exterior')[0];
  const ex5Video = filesUnder('models/ex5/videos')[0];
  await repairVehicle(
    'geely-ex5',
    ex5GalleryFiles.map(urlFor),
    ex5Hero ? urlFor(ex5Hero) : null,
    ex5Video ? urlFor(ex5Video) : null
  );

  // ── Geely EX2 ──────────────────────────────────────────────────────────
  const ex2ImgDir = (sub: string) => path.join(SEED_ROOT, 'models/ex2/images', sub);
  const ex2GalleryFiles = [
    ...filesUnder('models/ex2/images/exterior', 3),
    ...filesUnder('models/ex2/images/lifestyle', 2),
    ...filesUnder('models/ex2/images/features', 2),
  ];
  const ex2Hero = path.join(ex2ImgDir('exterior'), 'exterior-star-silver-1.jpg');
  await repairVehicle(
    'geely-ex2',
    ex2GalleryFiles.map(urlFor),
    fs.existsSync(ex2Hero) ? urlFor(ex2Hero) : null,
    null
  );

  // ── Geely Panda Mini ─────────────────────────────────────────────────────
  const pandaDir = (f: string) => path.join(SEED_ROOT, 'models/panda-mini/images', f);
  const pandaVideoDir = (f: string) => path.join(SEED_ROOT, 'models/panda-mini/videos', f);
  const pandaGalleryFiles = [
    pandaDir('exterior-front.jpg'),
    pandaDir('exterior-color-alt.jpg'),
    pandaDir('exterior-headlight-detail.jpg'),
    pandaDir('interior-front-seat.jpg'),
    pandaDir('interior-rear-seat.jpg'),
    pandaDir('lifestyle.jpg'),
  ].filter((f) => fs.existsSync(f));
  const pandaHero = pandaDir('exterior-front.jpg');
  const pandaVideo = pandaVideoDir('flyme-sound.mp4');
  await repairVehicle(
    'geely-panda-mini',
    pandaGalleryFiles.map(urlFor),
    fs.existsSync(pandaHero) ? urlFor(pandaHero) : null,
    fs.existsSync(pandaVideo) ? urlFor(pandaVideo) : null
  );

  // ── Showcases (360° "Discover Every Angle") ─────────────────────────────
  // EX5 has real 24-angle 360° photography per color — a genuine spin
  // sequence. EX2 only has 1-3 static photos per color (no dedicated 360
  // shoot) — reused as a short frame set rather than a true rotation, but
  // every frame now resolves to a real file instead of a broken image.
  const ex5ColorDirs = [
    'alpine white',
    'cloudveil silver',
    'glacier blue',
    'jungle green',
    'polar black',
    'volcanic grey',
  ];
  await repairShowcase(
    'geely-ex5',
    ex5ColorDirs.map((dir) => ({
      name: dir.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
      files: filesUnder(`models/ex5/images/360/Exterior 360/${dir}`),
    })),
    filesUnder('models/ex5/videos')[0] ?? null
  );

  const ex2ImgDirForShowcase = (sub: string) => path.join(SEED_ROOT, 'models/ex2/images', sub);
  await repairShowcase(
    'geely-ex2',
    [
      { name: 'Aurora Green', files: ['exterior-aurora-green-1.jpg', 'exterior-aurora-green-2.jpg'] },
      { name: 'Star Silver', files: ['exterior-star-silver-1.jpg', 'exterior-star-silver-2.jpg', 'exterior-star-silver-3.jpg'] },
      { name: 'Comet Gray', files: ['exterior-comet-gray-1.jpg'] },
      { name: 'Moon White', files: ['exterior-moon-white-1.jpg'] },
      { name: 'Nebula Beige', files: ['exterior-nebula-beige-1.jpg'] },
    ].map(({ name, files }) => ({ name, files: files.map((f) => ex2ImgDirForShowcase('exterior/' + f)) })),
    null
  );
}

main()
  .catch((error) => {
    console.error('Repair failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
