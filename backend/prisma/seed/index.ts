// Seed script — populates demo Vehicles/Colors/Interiors/Users using the
// real photography fixtures checked in under prisma/seed/media/ (models/,
// users/). Safe to re-run: brand/category/vehicle/user rows are upserted by
// their natural key, and each vehicle's colors/interiors are replaced fresh
// every run rather than accumulating duplicates.
//
// Media isn't served from here — it's copied once into the app's real
// upload root (apps/admin/public/uploads/seed/...) so the DB rows below can
// point at working /uploads/seed/... URLs, matching how every other upload
// in this codebase is served (see backend/src/routes/upload.routes.ts).
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { buildDatabaseUrl } from '../../src/config/buildDatabaseUrl';

process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = new PrismaClient();

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const MEDIA_ROOT = path.join(__dirname, 'media');
const ADMIN_PUBLIC_UPLOADS = path.join(REPO_ROOT, 'apps', 'admin', 'public', 'uploads');
const UPLOAD_ROOT = fs.existsSync(ADMIN_PUBLIC_UPLOADS)
  ? ADMIN_PUBLIC_UPLOADS
  : path.resolve(process.cwd(), 'uploads');
const SEED_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'seed');

function copyMediaIntoUploads() {
  fs.mkdirSync(SEED_UPLOAD_DIR, { recursive: true });
  fs.cpSync(MEDIA_ROOT, SEED_UPLOAD_DIR, {
    recursive: true,
    force: true,
    filter: (src) => !src.endsWith('.js'),
  });
}

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

/** Public /uploads/seed/... URL for a fixture, given its path relative to media/. */
function urlFor(absPath: string): string {
  const rel = path.relative(MEDIA_ROOT, absPath).split(path.sep).join('/');
  return '/uploads/seed/' + rel.split('/').map(encodeURIComponent).join('/');
}

/** First `limit` files (sorted) directly under media/<relDir>, recursively. */
function filesUnder(relDir: string, limit = 50): string[] {
  return walk(path.join(MEDIA_ROOT, relDir)).slice(0, limit);
}

// Colors/interiors are seeded only the first time a vehicle has none — never
// wiped and replaced on a re-run, so real edits made afterwards in the admin
// UI (colors/trims an admin adds or renames by hand) are never destroyed by
// re-running this script.
async function seedColorsIfEmpty(vehicleId: string, rows: Parameters<typeof prisma.vehicleColor.create>[0]['data'][]) {
  const existing = await prisma.vehicleColor.count({ where: { vehicleId } });
  if (existing > 0) return;
  for (const data of rows) await prisma.vehicleColor.create({ data });
}

async function seedInteriorsIfEmpty(vehicleId: string, rows: Parameters<typeof prisma.vehicleInterior.create>[0]['data'][]) {
  const existing = await prisma.vehicleInterior.count({ where: { vehicleId } });
  if (existing > 0) return;
  for (const data of rows) await prisma.vehicleInterior.create({ data });
}

async function seedMedia() {
  copyMediaIntoUploads();

  const brand = await prisma.vehicleBrand.upsert({
    where: { slug: 'geely' },
    update: {},
    create: {
      name: 'Geely',
      slug: 'geely',
      description: 'Geely — global new-energy vehicle brand.',
      logoUrl: urlFor(path.join(MEDIA_ROOT, 'models/global/images/geely-logo.png')),
      isActive: true,
      displayOrder: 0,
    },
  });

  const category = await prisma.vehicleCategory.upsert({
    where: { slug: 'electric-vehicles' },
    update: {},
    create: {
      name: 'Electric Vehicles',
      slug: 'electric-vehicles',
      description: 'Geely new-energy (EM-i / EV) lineup.',
      brandId: brand.id,
      isActive: true,
      displayOrder: 0,
    },
  });

  // ── Geely EX5 ──────────────────────────────────────────────────────────
  const ex5ExteriorColors = [
    { name: 'Alpine White', colorCode: '#F2F1EC', dir: 'models/ex5/images/360/Exterior 360/alpine white' },
    { name: 'Cloudveil Silver', colorCode: '#C7C9CC', dir: 'models/ex5/images/360/Exterior 360/cloudveil silver' },
    { name: 'Glacier Blue', colorCode: '#5D7A94', dir: 'models/ex5/images/360/Exterior 360/glacier blue' },
    { name: 'Jungle Green', colorCode: '#3B5D48', dir: 'models/ex5/images/360/Exterior 360/jungle green' },
    { name: 'Polar Black', colorCode: '#15151A', dir: 'models/ex5/images/360/Exterior 360/polar black' },
    { name: 'Volcanic Grey', colorCode: '#4B4B4E', dir: 'models/ex5/images/360/Exterior 360/volcanic grey' },
  ];
  const ex5Interiors = [
    { name: 'Amber Brown', materialType: 'Leather', dir: 'models/ex5/images/360/Interior 360/Amber Brown' },
    { name: 'Sapphire Blue', materialType: 'Leather', dir: 'models/ex5/images/360/Interior 360/Sapphire Blue' },
  ];
  const ex5GalleryFiles = [
    ...filesUnder('models/ex5/images/exterior', 3),
    ...filesUnder('models/ex5/images/outdoor', 3),
    ...filesUnder('models/ex5/images/features', 2),
  ];
  const ex5Hero = filesUnder('models/ex5/images/outdoor')[0] ?? filesUnder('models/ex5/images/exterior')[0];
  const ex5Video = filesUnder('models/ex5/videos')[0];

  const ex5 = await prisma.vehicle.upsert({
    where: { slug: 'geely-ex5' },
    update: {},
    create: {
      name: 'Geely EX5',
      slug: 'geely-ex5',
      model: 'EX5',
      year: 2026,
      category: 'Electric SUV',
      brandId: brand.id,
      categoryId: category.id,
      description:
        'Geely EX5 (E5 EM-i) — mid-size electric SUV with Flyme Auto, ambient lighting and a full ADAS suite.',
      images: ex5GalleryFiles.map(urlFor),
      specifications: {
        engine: { type: 'Electric', power: '218 hp', battery: '60.2 kWh LFP' },
        range: { wltp: '460 km' },
        dimensions: { length: '4615 mm', width: '1901 mm', height: '1670 mm', wheelbase: '2775 mm' },
        features: ['Flyme Auto', 'Ambient Lighting', '540° Panoramic View', 'Panoramic Sunroof'],
        safety: ['6 Airbags', 'ACC', 'AEB', 'LDW', 'BSD'],
        warranty: { years: 8, km: 160000 },
      },
      basePrice: 3200000,
      taxRate: 15,
      stock: 12,
      isFeatured: true,
      isActive: true,
      status: 'published',
      heroImageUrl: ex5Hero ? urlFor(ex5Hero) : null,
      heroVideoUrl: ex5Video ? urlFor(ex5Video) : null,
    },
  });

  await seedColorsIfEmpty(
    ex5.id,
    ex5ExteriorColors
      .map((c, i) => {
        const files = filesUnder(c.dir);
        if (files.length === 0) return null;
        return {
          vehicleId: ex5.id,
          name: c.name,
          colorCode: c.colorCode,
          imageUrl: urlFor(files[0]),
          images: files.slice(0, 6).map(urlFor),
          isDefault: i === 0,
          sortOrder: i,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  );

  await seedInteriorsIfEmpty(
    ex5.id,
    ex5Interiors
      .map((t, i) => {
        const files = filesUnder(t.dir);
        if (files.length === 0) return null;
        return {
          vehicleId: ex5.id,
          name: t.name,
          materialType: t.materialType,
          imageUrl: urlFor(files[0]),
          images: files.slice(0, 6).map(urlFor),
          isDefault: i === 0,
          sortOrder: i,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  );

  // ── Geely EX2 ──────────────────────────────────────────────────────────
  const ex2ExteriorColors = [
    { name: 'Aurora Green', colorCode: '#3E6B4F', files: ['exterior-aurora-green-1.jpg', 'exterior-aurora-green-2.jpg'] },
    { name: 'Star Silver', colorCode: '#C9CBCE', files: ['exterior-star-silver-1.jpg', 'exterior-star-silver-2.jpg', 'exterior-star-silver-3.jpg'] },
    { name: 'Comet Gray', colorCode: '#57585C', files: ['exterior-comet-gray-1.jpg'] },
    { name: 'Moon White', colorCode: '#F3F2EE', files: ['exterior-moon-white-1.jpg'] },
    { name: 'Nebula Beige', colorCode: '#C9B79C', files: ['exterior-nebula-beige-1.jpg'] },
  ];
  const ex2Interiors = [
    { name: 'Skyline White', materialType: 'Fabric', files: ['interior-skyline-white-front-seat.jpg', 'interior-skyline-white-passenger-seat.jpg', 'interior-skyline-white-trunk.jpg', 'interior-skyline-white-vent.jpg'] },
    { name: 'Horizon Gray', materialType: 'Fabric', files: ['interior-horizon-gray-front.jpg', 'interior-horizon-gray-driver-seat.jpg', 'interior-horizon-gray-rear-seat.jpg', 'interior-horizon-gray-passenger-view.jpg'] },
  ];
  const ex2ImgDir = (sub: string) => path.join(MEDIA_ROOT, 'models/ex2/images', sub);
  const ex2GalleryFiles = [
    ...filesUnder('models/ex2/images/exterior', 3),
    ...filesUnder('models/ex2/images/lifestyle', 2),
    ...filesUnder('models/ex2/images/features', 2),
  ];
  const ex2Hero = path.join(ex2ImgDir('exterior'), 'exterior-star-silver-1.jpg');

  const ex2 = await prisma.vehicle.upsert({
    where: { slug: 'geely-ex2' },
    update: {},
    create: {
      name: 'Geely EX2',
      slug: 'geely-ex2',
      model: 'EX2',
      year: 2026,
      category: 'Electric Compact SUV',
      brandId: brand.id,
      categoryId: category.id,
      description: 'Geely EX2 — compact electric crossover for city driving, 5 colorways.',
      images: ex2GalleryFiles.map(urlFor),
      specifications: {
        engine: { type: 'Electric', power: 'halcyon EM-i powertrain' },
        dimensions: { length: '4080 mm', width: '1836 mm', height: '1571 mm' },
        features: ['Wireless Charging', 'Ambient Lighting', 'Rear Air Vents'],
        safety: ['ACC', 'AEB', 'LDW'],
        warranty: { years: 8, km: 160000 },
      },
      basePrice: 2100000,
      taxRate: 15,
      stock: 8,
      isFeatured: true,
      isActive: true,
      status: 'published',
      heroImageUrl: urlFor(ex2Hero),
      heroVideoUrl: null,
    },
  });

  await seedColorsIfEmpty(
    ex2.id,
    ex2ExteriorColors.map((c, i) => {
      const files = c.files.map((f) => path.join(ex2ImgDir('exterior'), f));
      return {
        vehicleId: ex2.id,
        name: c.name,
        colorCode: c.colorCode,
        imageUrl: urlFor(files[0]),
        images: files.map(urlFor),
        isDefault: i === 0,
        sortOrder: i,
      };
    })
  );

  await seedInteriorsIfEmpty(
    ex2.id,
    ex2Interiors.map((t, i) => {
      const files = t.files.map((f) => path.join(ex2ImgDir('interior'), f));
      return {
        vehicleId: ex2.id,
        name: t.name,
        materialType: t.materialType,
        imageUrl: urlFor(files[0]),
        images: files.map(urlFor),
        isDefault: i === 0,
        sortOrder: i,
      };
    })
  );

  // ── Geely Panda Mini ─────────────────────────────────────────────────────
  // No dedicated photoshoot folder was provided for this model — per
  // instruction, its gallery mixes EX5/EX2 fixtures (same processing style)
  // as a placeholder until real Panda Mini photography is supplied.
  const pandaDir = (f: string) => path.join(MEDIA_ROOT, 'models/panda-mini/images', f);
  const pandaVideoDir = (f: string) => path.join(MEDIA_ROOT, 'models/panda-mini/videos', f);
  const pandaGalleryFiles = [
    pandaDir('exterior-front.jpg'),
    pandaDir('exterior-color-alt.jpg'),
    pandaDir('exterior-headlight-detail.jpg'),
    pandaDir('interior-front-seat.jpg'),
    pandaDir('interior-rear-seat.jpg'),
    pandaDir('lifestyle.jpg'),
  ];

  const panda = await prisma.vehicle.upsert({
    where: { slug: 'geely-panda-mini' },
    update: {},
    create: {
      name: 'Geely Panda Mini',
      slug: 'geely-panda-mini',
      model: 'Panda Mini',
      year: 2026,
      category: 'Electric Mini',
      brandId: brand.id,
      categoryId: category.id,
      description:
        'Geely Panda Mini — compact city EV. Gallery placeholder mixes EX5/EX2 fixtures pending dedicated photography.',
      images: pandaGalleryFiles.map(urlFor),
      specifications: {
        engine: { type: 'Electric', power: 'Mini EV powertrain' },
        dimensions: { length: '3800 mm (approx.)' },
        features: ['Compact City EV'],
        warranty: { years: 8, km: 160000 },
      },
      basePrice: 950000,
      taxRate: 15,
      stock: 5,
      isFeatured: false,
      isActive: true,
      status: 'draft',
      heroImageUrl: urlFor(pandaDir('exterior-front.jpg')),
      heroVideoUrl: urlFor(pandaVideoDir('flyme-sound.mp4')),
    },
  });

  const pandaColors = [
    { name: 'Comet Silver', colorCode: '#C9CBCE', file: pandaDir('exterior-front.jpg') },
    { name: 'Slate Gray', colorCode: '#57585C', file: pandaDir('exterior-color-alt.jpg') },
  ];
  await seedColorsIfEmpty(
    panda.id,
    pandaColors.map((c, i) => ({
      vehicleId: panda.id,
      name: c.name,
      colorCode: c.colorCode,
      imageUrl: urlFor(c.file),
      images: [urlFor(c.file)],
      isDefault: i === 0,
      sortOrder: i,
    }))
  );

  await seedInteriorsIfEmpty(panda.id, [
    {
      vehicleId: panda.id,
      name: 'Standard Cloth',
      materialType: 'Fabric',
      imageUrl: urlFor(pandaDir('interior-front-seat.jpg')),
      images: [pandaDir('interior-front-seat.jpg'), pandaDir('interior-rear-seat.jpg')].map(urlFor),
      isDefault: true,
      sortOrder: 0,
    },
  ]);

  // ── Demo users ───────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
  const usersDir = path.join(MEDIA_ROOT, 'users');
  const demoUsers = [
    { name: 'Selam Admin', email: 'hirkogemechu10@gmail.com', role: 'super_admin', avatar: 'super-admin.svg' },
    { name: 'Meron Sales', email: 'hirkogemechu34@gmail.com', role: 'sales_manager', avatar: 'sales-manager.svg' },
    { name: 'Dawit Bekele', email: 'hirkogemechu474@gmail.com', role: 'sales_representative', avatar: 'sales-representative.svg' },
    { name: 'Yonas Tesfaye', email: 'hirkogemechu51@gmail.com', role: 'workshop_manager', avatar: 'workshop-manager.svg' },
    { name: 'Hanna Girma', email: 'hirkogemechu17@gmail.com', role: 'service_advisor', avatar: 'service-advisor.svg' },
    { name: 'Bethel Alemu', email: 'hirkogemechu8@gmail.com', role: 'marketing', avatar: 'marketing.svg' },
  ];
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        isActive: true,
        avatarUrl: urlFor(path.join(usersDir, u.avatar)),
      },
    });
  }

  console.log('Seed complete:', {
    brand: brand.slug,
    vehicles: [ex5.slug, ex2.slug, panda.slug],
    users: demoUsers.length,
  });
}

seedMedia()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
