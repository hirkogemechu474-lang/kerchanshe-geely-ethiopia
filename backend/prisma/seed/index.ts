// Seed script — populates demo Vehicles/Colors/Interiors/Users using the
// real photography fixtures checked in under prisma/seed/media/ (models/,
// users/). Safe to re-run: brand/category/vehicle/user rows are upserted by
// their natural key, and every child table or JSON field below is only
// filled while it's still empty, so admin edits are never overwritten.
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
  const passwordHash2 = await bcrypt.hash('TestUser123!', 10);
  const usersDir = path.join(MEDIA_ROOT, 'users');
  const demoUsers = [
    { name: 'Selam Admin', email: 'hirkogemechu10@gmail.com', role: 'super_admin', avatar: 'super-admin.svg', hash: passwordHash },
    { name: 'Meron Sales', email: 'hirkogemechu34@gmail.com', role: 'sales_manager', avatar: 'sales-manager.svg', hash: passwordHash },
    { name: 'Dawit Bekele', email: 'hirkogemechu474@gmail.com', role: 'sales_representative', avatar: 'sales-representative.svg', hash: passwordHash },
    { name: 'Yonas Tesfaye', email: 'hirkogemechu51@gmail.com', role: 'workshop_manager', avatar: 'workshop-manager.svg', hash: passwordHash },
    { name: 'Hanna Girma', email: 'hirkogemechu17@gmail.com', role: 'service_advisor', avatar: 'service-advisor.svg', hash: passwordHash },
    { name: 'Bethel Alemu', email: 'hirkogemechu8@gmail.com', role: 'marketing', avatar: 'marketing.svg', hash: passwordHash },
    // Alternate accounts for every role
    { name: 'Abebe Admin', email: 'admin@geelyethiopia.com', role: 'super_admin', avatar: 'super-admin.svg', hash: passwordHash2 },
    { name: 'Chaltu Sales', email: 'sales.manager@geelyethiopia.com', role: 'sales_manager', avatar: 'sales-manager.svg', hash: passwordHash2 },
    { name: 'Fikru Demissie', email: 'sales.rep@geelyethiopia.com', role: 'sales_representative', avatar: 'sales-representative.svg', hash: passwordHash2 },
    { name: 'Getachew Worku', email: 'workshop@geelyethiopia.com', role: 'workshop_manager', avatar: 'workshop-manager.svg', hash: passwordHash2 },
    { name: 'Hiwot Ayalew', email: 'service.advisor@geelyethiopia.com', role: 'service_advisor', avatar: 'service-advisor.svg', hash: passwordHash2 },
    { name: 'Imani Tesfaye', email: 'marketing@geelyethiopia.com', role: 'marketing', avatar: 'marketing.svg', hash: passwordHash2 },
    // These two used to carry role: 'parts_manager' / 'technician' — neither
    // is a real AdminRole value (see apps/admin/lib/auth/types.ts), so both
    // accounts could never actually log in (isAdminRole() rejects unknown
    // role strings). Fixed to real roles, which also fills two of the gaps
    // below.
    { name: 'Jemila Ahmed', email: 'service.manager@geelyethiopia.com', role: 'service_manager', avatar: 'service-manager.svg', hash: passwordHash2 },
    { name: 'Kebede Tadesse', email: 'service@geelyethiopia.com', role: 'service', avatar: 'service.svg', hash: passwordHash2 },
    // Remaining AdminRole values with no seeded account at all until now:
    // admin, manager, sales, gm_geely, after_sales_manager. (viewer is
    // admin-app-only and isn't recognized by the backend's AdminRole enum —
    // an account with that role could never authenticate either, so it's
    // deliberately not seeded. customer/dealer are the public portal's own
    // roles, unrelated to admin staff accounts.)
    { name: 'Tsedale Worku', email: 'staff.admin@geelyethiopia.com', role: 'admin', avatar: 'admin.svg', hash: passwordHash2 },
    { name: 'Bereket Fikru', email: 'manager@geelyethiopia.com', role: 'manager', avatar: 'manager.svg', hash: passwordHash2 },
    { name: 'Liya Tesema', email: 'sales@geelyethiopia.com', role: 'sales', avatar: 'sales.svg', hash: passwordHash2 },
    { name: 'Solomon Bekele', email: 'gm@geelyethiopia.com', role: 'gm_geely', avatar: 'gm-geely.svg', hash: passwordHash2 },
    { name: 'Rahel Getachew', email: 'after.sales@geelyethiopia.com', role: 'after_sales_manager', avatar: 'after-sales-manager.svg', hash: passwordHash2 },
  ];
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash: u.hash,
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

// ── News articles ──────────────────────────────────────────────────────────
// Only seeded the first time the table is empty, so admin-authored articles
// are never duplicated or overwritten on a re-run.
async function seedNewsIfEmpty() {
  const existing = await prisma.newsArticle.count();
  if (existing > 0) return;

  const ex5Dir = (p: string) => path.join(MEDIA_ROOT, 'models/ex5/images', p);
  const globalDir = (p: string) => path.join(MEDIA_ROOT, 'models/global/images', p);
  const ex2Dir = (p: string) => path.join(MEDIA_ROOT, 'models/ex2/images', p);

  const articles = [
    {
      title: 'Geely EX5 Officially Launches in Ethiopia',
      category: 'Product Launch',
      author: 'Kerchanshe Geely Ethiopia',
      image: globalDir('global-kv-1.jpg'),
      publishDate: new Date('2025-09-10'),
      excerpt:
        'The mid-size electric SUV brings Flyme Auto, a 540° panoramic view and up to 460 km of WLTP range to Ethiopian roads.',
      content: `
        <p>Kerchanshe Group Geely today announced the official launch of the Geely EX5 in Ethiopia, marking the first fully electric SUV to arrive under the exclusive distribution partnership between Kerchanshe Group and Zhejiang Geely Holding Group.</p>
        <p>Built on Geely's dedicated electric architecture, the EX5 combines a spacious mid-size SUV body with a 60.2 kWh LFP battery rated for up to 460 km of WLTP range, Flyme Auto connectivity, ambient interior lighting and a full suite of driver-assistance features including adaptive cruise control and automatic emergency braking.</p>
        <p>"The EX5 is the clearest expression yet of what this partnership means for Ethiopian drivers: genuine global engineering, backed by local sales and service support," said a Kerchanshe Group Geely spokesperson. The EX5 is available now at the Sarbet showroom in Addis Ababa, with test drives open to the public.</p>
      `,
    },
    {
      title: 'Kerchanshe Group Geely Opens Flagship Showroom in Sarbet, Addis Ababa',
      category: 'Company News',
      author: 'Kerchanshe Geely Ethiopia',
      image: ex5Dir('exterior/Whole Exterior/GEELY EX5 EM-i/jpg/（左舵银色）left 45°.jpg'),
      publishDate: new Date('2025-06-15'),
      excerpt:
        'The new flagship showroom in Sarbet brings genuine Geely vehicles, certified after-sales support and a full customer experience center to Addis Ababa.',
      content: `
        <p>Kerchanshe Group Geely has opened its flagship showroom in Sarbet, Addis Ababa, giving Ethiopian customers their first opportunity to see, touch and test drive genuine Geely vehicles backed by full manufacturer warranty and local after-sales support.</p>
        <p>The showroom houses Geely's growing new-energy lineup alongside a dedicated service center staffed by technicians trained to Geely's global standards. It is the physical anchor of the exclusive distribution agreement announced between Kerchanshe Group and Zhejiang Geely Holding Group.</p>
        <p>"This showroom is just the beginning," the company said. "We're building a complete ecosystem here — sales, service, parts and eventually local assembly — so owning a Geely in Ethiopia feels as seamless as it does anywhere else in the world."</p>
      `,
    },
    {
      title: 'Geely EX2 Arrives: The Compact Electric SUV Built for the City',
      category: 'Product Launch',
      author: 'Kerchanshe Geely Ethiopia',
      image: ex2Dir('lifestyle/lifestyle-1.jpg'),
      publishDate: new Date('2026-02-18'),
      excerpt:
        'A compact electric crossover with wireless charging, ambient lighting and five colorways, designed for everyday city driving.',
      content: `
        <p>Kerchanshe Group Geely has added the Geely EX2 to its Ethiopian lineup, a compact electric crossover designed for drivers who want an EV that is easy to park, easy to charge and easy to live with in the city.</p>
        <p>The EX2 pairs Geely's halcyon EM-i powertrain with a well-equipped cabin featuring wireless phone charging, ambient interior lighting and rear air vents, and is offered in five colorways from launch: Aurora Green, Star Silver, Comet Gray, Moon White and Nebula Beige.</p>
        <p>"The EX2 opens up electric mobility to a new segment of Ethiopian drivers," said a Kerchanshe Group Geely representative. "It's compact, efficient and priced to make the switch to EV an easy decision." The EX2 is available for viewing and test drives at the Sarbet showroom.</p>
      `,
    },
    {
      title: 'Geely EX5 Earns Top Marks in Independent Crash-Safety Testing',
      category: 'Safety',
      author: 'Kerchanshe Geely Ethiopia',
      image: ex5Dir('features/airbags/GEELY EX5 EM-i左舵/jpg/（左舵银色）7 airbags .jpg'),
      publishDate: new Date('2026-04-05'),
      excerpt:
        'Up to 7 airbags, active safety systems and Geely\'s reinforced body structure combine for class-leading occupant protection.',
      content: `
        <p>The Geely EX5 has earned top marks in independent crash-safety evaluations, reinforcing Geely's global reputation for engineering vehicles that protect everyone inside them.</p>
        <p>Every EX5 sold in Ethiopia comes equipped with up to 7 airbags, adaptive cruise control, automatic emergency braking, lane departure warning and blind-spot detection as standard, all built around a reinforced body structure engineered to Geely's global safety standards.</p>
        <p>"Safety isn't an option package for us, it's the baseline," said a Kerchanshe Group Geely spokesperson. "Every customer who drives an EX5 off our lot in Addis Ababa is getting the same safety engineering Geely sells in Europe and Asia."</p>
      `,
    },
    {
      title: 'Kerchanshe Group and Zhejiang Geely Holding Sign Exclusive Distribution Agreement',
      category: 'Partnership',
      author: 'Kerchanshe Geely Ethiopia',
      image: globalDir('global-kv-2.jpg'),
      publishDate: new Date('2025-04-22'),
      excerpt:
        'A landmark agreement makes Kerchanshe Group the exclusive, official distributor of Geely vehicles in Ethiopia.',
      content: `
        <p>Kerchanshe Group has announced a landmark agreement with Zhejiang Geely Holding Group (ZGH) to become the exclusive, official distributor of Geely vehicles in Ethiopia, bringing one of the world's largest automotive groups to the Ethiopian market for the first time.</p>
        <p>The partnership combines Geely's global automotive engineering, safety innovation and design excellence with Kerchanshe Group's more than two decades of trusted local distribution, infrastructure and after-sales expertise built across its coffee export, manufacturing, construction and heavy-equipment businesses.</p>
        <p>Operating through Kerchanshe Group Geely, the two companies say the agreement goes beyond importing vehicles, with plans for local assembly, job creation and technology transfer in the years ahead.</p>
      `,
    },
    {
      title: "Smarter Every Day: Geely's Over-the-Air Updates Bring Continuous Innovation to Ethiopian Roads",
      category: 'Technology',
      author: 'Kerchanshe Geely Ethiopia',
      image: ex5Dir('features/OTA/GEELY EX5 EM-i左舵/GEELY EX5 EM-i左舵OTA.jpg'),
      publishDate: new Date('2026-07-30'),
      excerpt:
        'Over-the-air software updates mean every Geely EX5 in Ethiopia keeps gaining new features and improvements long after purchase.',
      content: `
        <p>Geely vehicles sold by Kerchanshe Group Geely don't stand still after they leave the showroom. Over-the-air (OTA) software updates let the EX5's infotainment, connectivity and driver-assistance systems improve over time, the same way a smartphone does.</p>
        <p>Through the Geely App, owners can remotely check vehicle status, receive update notifications and unlock new features as they roll out globally, all without a trip to the service center for routine software work.</p>
        <p>"OTA updates mean the car you buy today keeps getting better," said a Kerchanshe Group Geely representative. "It's one more way we're bringing the full Geely ownership experience to Ethiopia, not just the vehicle itself."</p>
      `,
    },
  ];

  for (const a of articles) {
    await prisma.newsArticle.create({
      data: {
        title: a.title,
        category: a.category,
        author: a.author,
        content: a.content.trim(),
        excerpt: a.excerpt,
        imageUrl: urlFor(a.image),
        status: 'published',
        publishDate: a.publishDate,
      },
    });
  }

  console.log('Seed complete: news articles', { count: articles.length });
}

// ── About page content ──────────────────────────────────────────────────────
// Stored as Setting['about_page'] (see backend/src/routes/public.routes.ts
// and settings.routes.ts). Fills in only the image fields that are still
// blank — on a fresh DB that's everything below; on this project's dev DB an
// admin has already set most of these by hand, so any field with a real
// value already in place is left untouched.
async function seedAboutPageImages() {
  const ex5Dir = (p: string) => path.join(MEDIA_ROOT, 'models/ex5/images', p);
  const globalDir = (p: string) => path.join(MEDIA_ROOT, 'models/global/images', p);

  const heroImage = urlFor(globalDir('global-kv-1.jpg'));
  const designImage = urlFor(ex5Dir('exterior/Exterior Part/Headlights/前大灯Headlights.jpg'));
  const missionVisionImage = urlFor(ex5Dir('outdoor/Exterior/GEELY EX5 EM-i左舵/JPG/GEELY EX5 EM-i左舵(3).jpg'));
  const valueImage = urlFor(ex5Dir('interior/Amber Brown/jpg/（左舵棕色）entire interior + seats.jpg'));
  const innovationImage = urlFor(ex5Dir('features/OTA/GEELY EX5 EM-i左舵/GEELY EX5 EM-i左舵OTA.jpg'));
  // The battery-diagram fixture crops badly on the 4:3/16:10 card shapes
  // these sections use (mostly dead white space around a small diagram), so
  // new-energy/sustainability slots use this eco-green exterior shot instead.
  const newEnergyImage = urlFor(ex5Dir('exterior/Whole Exterior/GEELY EX5 EM-i/jpg/（左舵绿色）right 45°.jpg'));
  const globalizationImage = urlFor(globalDir('global-kv-2.jpg'));
  const showroomImage = urlFor(ex5Dir('exterior/Whole Exterior/GEELY EX5 EM-i/jpg/（左舵银色）left 45°.jpg'));

  // Best-effort image pick for a value/milestone card, keyed by whatever
  // title an admin may have already given it; falls back to position so
  // cards with an unrecognized title still get a sensible photo.
  const valueImageByTitle: Record<string, string> = {
    Value: valueImage,
    Quality: valueImage,
    Innovation: innovationImage,
    'New Energy': newEnergyImage,
    Responsibility: newEnergyImage,
    Globalization: globalizationImage,
  };
  const valueImageByIndex = [valueImage, innovationImage, newEnergyImage, globalizationImage];

  const milestoneImageByTitle: Record<string, string> = {
    'Kerchanshe Group Founded': '',
    'Exclusive Geely Partnership Signed': globalizationImage,
    'Kerchanshe Group Geely Launches': showroomImage,
    'Local Assembly & Technology Transfer': newEnergyImage,
  };

  const defaultValues = [
    { icon: 'Star', title: 'Value', description: 'Our commitment to offering high value to our users is reflected in every strategic decision.' },
    { icon: 'Zap', title: 'Innovation', description: 'We continue to demonstrate our pursuit of the most advanced technological innovations.' },
    { icon: 'Heart', title: 'New Energy', description: 'Our early adoption of new energy development underscores our dedication to sustainable solutions.' },
    { icon: 'Globe', title: 'Globalization', description: 'Our journey into globalization, beginning in 2002, shapes our identity.' },
  ];
  const defaultMilestones = [
    { year: '2003', title: 'Kerchanshe Group Founded', description: "Began as a coffee export business and grew into one of Ethiopia's most diversified conglomerates." },
    { year: 'April 2025', title: 'Exclusive Geely Partnership Signed', description: 'Kerchanshe Group and Zhejiang Geely Holding Group announce an exclusive distribution agreement.' },
    { year: '2025', title: 'Kerchanshe Group Geely Launches', description: 'Opens its showroom in Sarbet, Addis Ababa, bringing genuine Geely vehicles to Ethiopian customers.' },
    { year: 'In Progress', title: 'Local Assembly & Technology Transfer', description: 'Plans underway for local vehicle assembly in Ethiopia, creating jobs and building industrial capacity.' },
  ];

  const existing = await prisma.setting.findUnique({ where: { key: 'about_page' } });
  const current: Record<string, any> = existing?.value ? JSON.parse(existing.value) : {};

  // A field is safe to (re-)fill if it's genuinely blank, or if it was set
  // by this same seed script on a previous run (still pointing at
  // /uploads/seed/...) — that lets a corrected pick here replace its own
  // earlier guess without ever touching a real admin-uploaded image.
  const seedOwned = (url: unknown) => typeof url === 'string' && url.startsWith('/uploads/seed/');
  const fillable = (url: unknown) => !url || seedOwned(url);
  const pick = (currentUrl: unknown, fallbackUrl: string) => (fillable(currentUrl) ? fallbackUrl : (currentUrl as string));

  const values = (current.missionVisionValues?.values?.length ? current.missionVisionValues.values : defaultValues).map(
    (v: any, i: number) => ({ ...v, image: pick(v.image, valueImageByTitle[v.title] || valueImageByIndex[i % valueImageByIndex.length]) })
  );
  const milestones = (current.historyTimeline?.milestones?.length ? current.historyTimeline.milestones : defaultMilestones).map(
    (m: any) => ({ ...m, image: pick(m.image, milestoneImageByTitle[m.title] || '') })
  );

  const next = {
    ...current,
    sectionHero: { ...current.sectionHero, backgroundImage: pick(current.sectionHero?.backgroundImage, heroImage) },
    designPhilosophy: { ...current.designPhilosophy, image: pick(current.designPhilosophy?.image, designImage) },
    missionVisionValues: {
      ...current.missionVisionValues,
      image: pick(current.missionVisionValues?.image, missionVisionImage),
      values,
    },
    historyTimeline: { ...current.historyTimeline, milestones },
  };

  await prisma.setting.upsert({
    where: { key: 'about_page' },
    update: { value: JSON.stringify(next) },
    create: { key: 'about_page', value: JSON.stringify(next), type: 'general' },
  });

  console.log('Seed complete: about page images filled');
}

// ── Vehicle catalog extras ──────────────────────────────────────────────────
// Fills the admin Vehicles pages (Categories, Models/trims + accessories,
// Specs/Features reference lists, Colors → wheels, Sections → galleries and
// highlights) for the three real models. Every step only fills what is still
// empty, so anything an admin has already entered is left alone. Prices are
// 0 to match the existing trims (vehicle pricing is hidden on the site).

/** /uploads/seed URL for a fixture under media/, failing loudly on a typo'd path. */
function media(rel: string): string {
  const abs = path.join(MEDIA_ROOT, rel);
  if (!fs.existsSync(abs)) throw new Error(`Seed fixture missing: ${rel}`);
  return urlFor(abs);
}

type Highlight = { title: string; description: string; imageUrl: string };
type SectionPatch = Partial<Record<'performance' | 'safety' | 'technology' | 'interior' | 'exterior' | 'warranty', Record<string, string | string[] | Highlight[]>>>;

// Mirrors normalizeToSections/toSpecificationsPayload in
// apps/admin/lib/vehicle-specifications.ts (not imported: the backend can be
// deployed without the admin app). The public model page still reads the
// legacy engine/dimensions/features keys, so both shapes are written.
function toSections(raw: any) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const e = r.engine || {};
  const d = r.dimensions || {};
  const f = r.features || {};
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const str = (...vals: unknown[]) => (vals.find((v) => typeof v === 'string') as string | undefined) ?? '';
  return {
    performance: {
      type: '', displacement: '', power: '', torque: '', transmission: '', drivetrain: '', fuelType: '', fuelEconomy: '',
      range: '', batteryCapacity: '', acceleration: '',
      ...e,
      ...(r.performance || {}),
    },
    safety: {
      airbags: '', abs: '', esc: '', tpms: '', cameras: '', sensors: '', adas: '',
      ...(r.safety || {}),
      images: arr(r.safety?.images),
      highlights: arr(r.safety?.highlights),
    },
    technology: {
      infotainment: str(r.technology?.infotainment, f.infotainment),
      connectivity: str(r.technology?.connectivity, f.connectivity),
      images: arr(r.technology?.images),
      highlights: arr(r.technology?.highlights),
    },
    interior: {
      climate: str(r.interior?.climate, f.climate),
      seats: str(r.interior?.seats, f.seats),
      seatingCapacity: str(r.interior?.seatingCapacity, d.seatingCapacity),
      cargoVolume: str(r.interior?.cargoVolume, d.cargoVolume),
      images: arr(r.interior?.images),
      highlights: arr(r.interior?.highlights),
    },
    exterior: {
      lighting: str(r.exterior?.lighting, f.lighting),
      wheels: str(r.exterior?.wheels, f.wheels),
      length: str(r.exterior?.length, d.length),
      width: str(r.exterior?.width, d.width),
      height: str(r.exterior?.height, d.height),
      wheelbase: str(r.exterior?.wheelbase, d.wheelbase),
      groundClearance: str(r.exterior?.groundClearance, d.groundClearance),
      curbWeight: str(r.exterior?.curbWeight, d.curbWeight),
      images: arr(r.exterior?.images),
      highlights: arr(r.exterior?.highlights),
    },
    warranty: { basic: '', powertrain: '', corrosion: '', roadside: '', maintenance: '', ...(r.warranty || {}) },
  };
}

function toSpecPayload(s: ReturnType<typeof toSections>) {
  return {
    engine: { ...s.performance },
    dimensions: {
      length: s.exterior.length,
      width: s.exterior.width,
      height: s.exterior.height,
      wheelbase: s.exterior.wheelbase,
      groundClearance: s.exterior.groundClearance,
      curbWeight: s.exterior.curbWeight,
      seatingCapacity: s.interior.seatingCapacity,
      cargoVolume: s.interior.cargoVolume,
    },
    features: {
      infotainment: s.technology.infotainment,
      connectivity: s.technology.connectivity,
      climate: s.interior.climate,
      seats: s.interior.seats,
      lighting: s.exterior.lighting,
      wheels: s.exterior.wheels,
    },
    safety: { ...s.safety },
    warranty: { ...s.warranty },
    performance: s.performance,
    technology: s.technology,
    interior: s.interior,
    exterior: s.exterior,
  };
}

/** Applies `patch` to a vehicle's specifications, only into fields that are blank ('' or an empty list). */
async function fillSpecSections(slug: string, patch: SectionPatch) {
  const vehicle = await prisma.vehicle.findUnique({ where: { slug }, select: { id: true, specifications: true } });
  if (!vehicle) return;
  const sections: Record<string, Record<string, any>> = toSections(vehicle.specifications);
  let changed = false;
  for (const [section, fields] of Object.entries(patch)) {
    for (const [key, value] of Object.entries(fields ?? {})) {
      const current = sections[section][key];
      const blank = Array.isArray(current) ? current.length === 0 : !current;
      if (blank) {
        sections[section][key] = value;
        changed = true;
      }
    }
  }
  if (!changed) return;
  await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { specifications: toSpecPayload(sections as ReturnType<typeof toSections>) },
  });
}

/** Adds any missing entries to each list in a Setting holding `{ group: string[] }` JSON. */
async function mergeSettingLists(key: string, additions: Record<string, string[]>) {
  const existing = await prisma.setting.findUnique({ where: { key } });
  const current: Record<string, string[]> = existing?.value ? JSON.parse(existing.value) : {};
  const next: Record<string, string[]> = { ...current };
  for (const [group, items] of Object.entries(additions)) {
    const list = Array.isArray(next[group]) ? [...next[group]] : [];
    for (const item of items) if (!list.includes(item)) list.push(item);
    next[group] = list;
  }
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(next) },
    create: { key, value: JSON.stringify(next), type: 'vehicle' },
  });
}

async function seedVehicleCatalogExtras() {
  const ex5Img = (rel: string) => media(`models/ex5/images/${rel}`);
  const ex2Img = (rel: string) => media(`models/ex2/images/${rel}`);

  // Categories: description + images where still empty. No new categories —
  // /models shows every active category as a filter tab, so an empty one
  // would be a dead filter.
  const categoryFill: Record<string, { description: string; image?: string }> = {
    suv: {
      description: 'Geely SUVs pair a commanding driving position with room for family life and advanced safety as standard.',
      image: ex5Img('exterior/Whole Exterior/GEELY EX5 EM-i/jpg/（左舵银色）left 45°.jpg'),
    },
    'electric-vehicles': {
      description: "Geely's all-electric lineup: quiet, efficient and easy to charge, from compact city cars to family SUVs.",
      image: media('models/global/images/global-kv-1.jpg'),
    },
    sedan: {
      description: 'Geely sedans combine a refined ride, efficient powertrains and generous cabin space.',
    },
  };
  for (const [slug, fill] of Object.entries(categoryFill)) {
    const cat = await prisma.vehicleCategory.findUnique({ where: { slug } });
    if (!cat) continue;
    await prisma.vehicleCategory.update({
      where: { id: cat.id },
      data: {
        description: cat.description || fill.description,
        imageUrl: cat.imageUrl || fill.image || null,
        heroImageUrl: cat.heroImageUrl || fill.image || null,
      },
    });
  }

  // Manage Specs: suggestion lists for the Performance tab.
  await mergeSettingLists('vehicle_specifications', {
    engine: ['Electric Motor', 'Permanent Magnet Synchronous Motor', '1.5L Petrol (EM-i Plug-in Hybrid)', '1.5L Turbo Petrol', '2.0L Turbo Petrol'],
    transmission: ['Single-Speed Automatic', 'DHT (Dedicated Hybrid Transmission)', '7-Speed Dual-Clutch (DCT)', '8-Speed Automatic', 'CVT'],
    fuelType: ['Electric', 'Plug-in Hybrid (PHEV)', 'Hybrid (HEV)', 'Petrol', 'Diesel'],
    driveType: ['Front-Wheel Drive (FWD)', '4x2 (Front-Wheel Drive)', 'Rear-Wheel Drive (RWD)', 'All-Wheel Drive (AWD)', '4x4'],
  });

  // Manage Features: more reference feature names per group.
  await mergeSettingLists('vehicle_features', {
    safety: [
      'Forward Collision Warning', 'Lane Departure Warning', 'Lane Change Assist', 'Door Open Warning',
      'Intelligent High Beam Control', 'Hill Start Assist', 'Hill Descent Control', 'Front & Rear Parking Sensors',
      'Rear View Camera', 'Front, Side & Curtain Airbags', 'Rear Collision Warning',
    ],
    comfort: [
      'Fabric Seats', 'Panoramic Sunroof', 'Ambient Lighting', 'Memory Driver Seat', 'Power-Adjustable Passenger Seat',
      'Rear Air Vents', 'Premium Audio System', 'Head-Up Display (HUD)', 'Heated Front Seats',
    ],
    technology: ['Flyme Auto', 'Over-the-Air (OTA) Updates', 'Geely App Remote Control', 'Voice Assistant', 'Triple-Screen Linkage'],
    performance: ['All-Wheel Drive', 'Regenerative Braking', 'DC Fast Charging', 'Vehicle-to-Load (V2L)', 'LFP Battery'],
    exterior: [
      'Automatic LED Headlights', 'Full-Width LED Tail Light', 'Front Trunk (Frunk)', 'Roof Rails', 'Power Tailgate',
      'Flush Door Handles', 'Steel Wheels',
    ],
  });

  const ex5 = await prisma.vehicle.findUnique({ where: { slug: 'geely-ex5' }, select: { id: true } });
  const ex2 = await prisma.vehicle.findUnique({ where: { slug: 'geely-ex2' }, select: { id: true } });

  // Manage Colors → Wheels, per vehicle, only when it has none yet.
  const seedWheelsIfEmpty = async (vehicleId: string, rows: { name: string; size: string; imageUrl?: string }[]) => {
    if ((await prisma.vehicleWheel.count({ where: { vehicleId } })) > 0) return;
    for (const [i, w] of rows.entries()) {
      await prisma.vehicleWheel.create({
        data: {
          vehicleId,
          name: w.name,
          size: w.size,
          imageUrl: w.imageUrl ?? null,
          images: w.imageUrl ? [w.imageUrl] : [],
          price: 0,
          isDefault: i === 0,
          sortOrder: i,
        },
      });
    }
  };
  if (ex5) {
    await seedWheelsIfEmpty(ex5.id, [
      { name: '18" Alloy Wheels (225/55 R18)', size: '18"', imageUrl: ex5Img('exterior/Exterior Part/Wheel Hub/JPG/左舵18-inch wheels.jpg') },
      { name: '19" Alloy Wheels', size: '19"', imageUrl: ex5Img('exterior/Exterior Part/Wheel Hub/JPG/左舵19-inch wheels.jpg') },
    ]);
  }
  if (ex2) {
    await seedWheelsIfEmpty(ex2.id, [
      { name: '15" Steel Wheels (Comfort)', size: '15"' },
      { name: '16" Alloy Wheels (Luxury & Sport)', size: '16"' },
    ]);
  }

  // Manage Models → Accessories. Global (vehicleId null) so they apply to
  // every model; only seeded while the table is completely empty.
  if ((await prisma.vehicleAccessory.count()) === 0) {
    const accessories = [
      { name: 'All-Weather Floor Mats', category: 'Interior', description: 'Tailored, easy-clean mats that trap mud, dust and water.' },
      { name: 'Trunk Cargo Liner', category: 'Interior', description: 'Waterproof, raised-edge liner that protects the boot floor.' },
      { name: 'Door Sill Protectors', category: 'Exterior', description: 'Scuff plates that guard the door sills against wear.' },
      { name: 'Mud Flaps', category: 'Exterior', description: 'Front and rear mud flaps that reduce spray and stone chips.' },
      { name: 'Portable EV Charger (Mode 2)', category: 'Charging', description: 'Charge from a standard wall socket at home or on the go.' },
      { name: '7 kW Home Wall Charger', category: 'Charging', description: 'Type 2 AC wallbox for faster overnight charging at home. Installation quoted separately.' },
      { name: 'Front & Rear Dash Camera', category: 'Electronics', description: 'Records the road ahead and behind for peace of mind.' },
      { name: 'Window Tint Film', category: 'Protection', description: 'Reduces heat and glare and adds privacy.' },
      { name: 'Paint Protection Film (Front)', category: 'Protection', description: 'Clear film that protects the bonnet, bumper and mirrors from stone chips.' },
      { name: 'Indoor/Outdoor Car Cover', category: 'Protection', description: 'Breathable cover that shields paint from sun and dust.' },
      { name: 'Emergency Kit', category: 'Safety', description: 'First-aid kit, warning triangle, tow rope and reflective vest.' },
    ];
    for (const [i, a] of accessories.entries()) {
      await prisma.vehicleAccessory.create({ data: { ...a, vehicleId: null, price: 0, inStock: true, sortOrder: i } });
    }
  }

  // Manage Sections: galleries + feature highlights (only where empty),
  // plus blank spec fields we can fill from facts already in the trims.
  await fillSpecSections('geely-ex5', {
    exterior: {
      images: [
        '(左舵银色)rear-left overhead view.jpg', '（左舵绿色）right 45°.jpg', '（左舵银色）car front.jpg', '（左舵银色）car rear.jpg',
        '（左舵银色）front overhead view.jpg', '（左舵银色）left 45°.jpg', '（左舵银色）left 90°.jpg', '（左舵银色）rear right 45°.jpg',
        '（左舵银色）right 75°.jpg',
      ].map((f) => ex5Img(`exterior/Whole Exterior/GEELY EX5 EM-i/jpg/${f}`)),
      highlights: [
        {
          title: 'Full LED Lighting',
          description: 'Automatic LED headlights and LED daytime running lights give the EX5 a sharp, confident face and clear visibility after dark.',
          imageUrl: ex5Img('exterior/Exterior Part/Headlights/前大灯Headlights.jpg'),
        },
        {
          title: 'Full-Width Rear Light Bar',
          description: 'A light bar runs across the full width of the tailgate, making the EX5 instantly recognisable from behind.',
          imageUrl: ex5Img('exterior/Exterior Part/Taillights/JPG/Taillights贯穿尾灯-GEELY EX5 EM-i.jpg'),
        },
        {
          title: '18" Alloy Wheels',
          description: 'Aerodynamic 18-inch alloy wheels on 225/55 R18 tyres balance a comfortable ride with efficiency.',
          imageUrl: ex5Img('exterior/Exterior Part/Wheel Hub/JPG/左舵18-inch wheels.jpg'),
        },
      ],
    },
    interior: {
      images: [
        ...['entire interior + seats', 'front-side interior', 'rear seats', 'trunk', 'storage compartment', 'carplay'].map((f) =>
          ex5Img(`interior/Amber Brown/jpg/（左舵棕色）${f}.jpg`)
        ),
        ex5Img('interior/Sapphire Blue/JPG/（左舵蓝黑）entire interior + seats.jpg'),
        ex5Img('interior/Sapphire Blue/JPG/（左舵蓝黑）front-side interior.jpg'),
      ],
      highlights: [
        {
          title: 'Flyme Auto Cockpit',
          description: 'A 15.4-inch HD touchscreen running Flyme Auto sits alongside a 10.2-inch digital instrument cluster, with Apple CarPlay and Android Auto built in.',
          imageUrl: ex5Img('interior/Amber Brown/jpg/（左舵棕色）Flyme Auto.jpg'),
        },
        {
          title: 'Panoramic Sunroof',
          description: 'Available on the Max trim, the panoramic sunroof fills the cabin with natural light.',
          imageUrl: ex5Img('interior/Amber Brown/jpg/（左舵棕色）Sunroof .jpg'),
        },
        {
          title: 'Wireless Charging',
          description: 'A wireless charging pad keeps your phone topped up without a cable.',
          imageUrl: ex5Img('interior/Amber Brown/jpg/（左舵棕色）wireless charging.jpg'),
        },
        {
          title: 'Room for Everyone',
          description: 'Spacious rear seats and a 461-litre boot make the EX5 an easy everyday family car.',
          imageUrl: ex5Img('interior/Amber Brown/jpg/（左舵棕色）rear seats.jpg'),
        },
      ],
    },
    technology: {
      images: [
        ex5Img('features/OTA/GEELY EX5 EM-i左舵/GEELY EX5 EM-i左舵OTA.jpg'),
        ex5Img('features/Geely APP remote control/Horizontal/横版.jpg'),
        ex5Img('features/Geely Battery/P145电池图片- Geely Battery.jpg'),
      ],
      highlights: [
        {
          title: 'Over-the-Air Updates',
          description: 'Software updates arrive over the air, so infotainment and vehicle features keep improving after you drive away.',
          imageUrl: ex5Img('features/OTA/GEELY EX5 EM-i左舵/GEELY EX5 EM-i左舵OTA.jpg'),
        },
        {
          title: 'Geely App',
          description: 'Check your vehicle status and receive update notifications from your phone with the Geely App.',
          imageUrl: ex5Img('features/Geely APP remote control/Horizontal/横版.jpg'),
        },
        {
          title: 'LFP Battery',
          description: 'A lithium iron phosphate (LFP) battery pack built for long life, thermal stability and everyday reliability.',
          imageUrl: ex5Img('features/Geely Battery/P145电池图片- Geely Battery.jpg'),
        },
      ],
    },
    safety: {
      images: [
        ex5Img('features/540° panoramic parking view/JPG/（左舵棕色）540.jpg'),
        ex5Img('features/airbags/GEELY EX5 EM-i左舵/jpg/（左舵银色）6 airbags .jpg'),
      ],
      highlights: [
        {
          title: 'Panoramic Parking View',
          description: 'Surround-view cameras give a bird’s-eye view around the car, making tight parking spaces and narrow streets easier.',
          imageUrl: ex5Img('features/540° panoramic parking view/JPG/（左舵棕色）540.jpg'),
        },
        {
          title: 'Airbag Protection',
          description: 'Front, side and curtain airbags help protect occupants in both rows.',
          imageUrl: ex5Img('features/airbags/GEELY EX5 EM-i左舵/jpg/（左舵银色）6 airbags .jpg'),
        },
        {
          title: 'Advanced Driver Assistance',
          description: 'Adaptive cruise control, automatic emergency braking, lane keeping assist and blind spot detection work together to help avoid collisions.',
          imageUrl: ex5Img('outdoor/Exterior/GEELY EX5 EM-i左舵/JPG/GEELY EX5 EM-i左舵(2).jpg'),
        },
      ],
    },
  });

  const ex2Exterior = [
    'exterior-aurora-green-1.jpg', 'exterior-aurora-green-2.jpg', 'exterior-star-silver-1.jpg', 'exterior-star-silver-2.jpg',
    'exterior-star-silver-3.jpg', 'exterior-comet-gray-1.jpg', 'exterior-moon-white-1.jpg', 'exterior-nebula-beige-1.jpg',
    'exterior-front-trunk.jpg',
  ].map((f) => ex2Img(`exterior/${f}`));
  const ex2Interior = [
    'interior-horizon-gray-front.jpg', 'interior-horizon-gray-driver-seat.jpg', 'interior-horizon-gray-rear-seat.jpg',
    'interior-horizon-gray-passenger-view.jpg', 'interior-skyline-white-front-seat.jpg', 'interior-skyline-white-passenger-seat.jpg',
    'interior-skyline-white-trunk.jpg', 'interior-skyline-white-vent.jpg',
  ].map((f) => ex2Img(`interior/${f}`));

  await fillSpecSections('geely-ex2', {
    interior: {
      seats: 'Fabric seats (Skyline White or Horizon Gray)',
      seatingCapacity: '5',
      images: ex2Interior,
      highlights: [
        {
          title: 'Driver-Focused Cabin',
          description: 'A 14.6-inch HD touchscreen and 8.8-inch LCD instrument cluster put navigation, media and vehicle settings within easy reach.',
          imageUrl: ex2Img('interior/interior-horizon-gray-front.jpg'),
        },
        {
          title: 'Two Interior Themes',
          description: 'Choose Skyline White for a light, airy cabin or Horizon Gray for a darker, easy-care finish.',
          imageUrl: ex2Img('interior/interior-skyline-white-front-seat.jpg'),
        },
        {
          title: 'Practical Boot',
          description: 'A 375-litre boot takes the weekly shop, luggage or a pushchair with ease.',
          imageUrl: ex2Img('interior/interior-skyline-white-trunk.jpg'),
        },
      ],
    },
    exterior: {
      wheels: '15" steel wheels (Comfort) / 16" alloy wheels (Luxury & Sport)',
      images: ex2Exterior,
      highlights: [
        {
          title: 'Front Trunk',
          description: 'A 70-litre front trunk adds handy storage for charging cables and small bags, on top of the 375-litre rear boot.',
          imageUrl: ex2Img('exterior/exterior-front-trunk.jpg'),
        },
        {
          title: 'Five Colourways',
          description: 'Choose from Aurora Green, Star Silver, Comet Gray, Moon White and Nebula Beige.',
          imageUrl: ex2Img('exterior/exterior-aurora-green-1.jpg'),
        },
      ],
    },
    safety: {
      images: ['feature-acc.jpg', 'feature-aeb.jpg', 'feature-ldw.jpg'].map((f) => ex2Img(`features/${f}`)),
      highlights: [
        {
          title: 'Adaptive Cruise Control',
          description: 'On Luxury and Sport trims, ACC keeps a set distance from the car ahead, easing long drives and stop-start traffic.',
          imageUrl: ex2Img('features/feature-acc.jpg'),
        },
        {
          title: 'Automatic Emergency Braking',
          description: 'On Luxury and Sport trims, AEB can brake automatically if a collision is imminent.',
          imageUrl: ex2Img('features/feature-aeb.jpg'),
        },
        {
          title: 'Lane Departure Warning',
          description: 'On Luxury and Sport trims, the car alerts you if it begins to drift out of its lane.',
          imageUrl: ex2Img('features/feature-ldw.jpg'),
        },
      ],
    },
  });

  // Panda Mini: text specs only. Every photo in media/models/panda-mini is a
  // copy of an EX2/EX5 fixture, so none are attached as Panda Mini galleries
  // or highlights. Verify these against the official spec sheet.
  await fillSpecSections('geely-panda-mini', {
    performance: { type: 'Electric Motor', fuelType: 'Electric', transmission: 'Single-Speed Automatic' },
    exterior: { length: '3135 mm', width: '1540 mm', height: '1600 mm', wheelbase: '2015 mm' },
    interior: { seatingCapacity: '4' },
  });

  // Vehicle-level feature tags: fill only groups that are still empty.
  const ex2Tags = await prisma.vehicle.findUnique({ where: { slug: 'geely-ex2' }, select: { featureTags: true } });
  if (ex2 && ex2Tags) {
    const tags: Record<string, string[]> = (ex2Tags.featureTags as Record<string, string[]>) || {};
    const fill: Record<string, string[]> = {
      comfort: ['Fabric Seats'],
      exterior: ['Front Trunk (Frunk)', 'Alloy Wheels', 'Steel Wheels'],
    };
    let changed = false;
    for (const [group, items] of Object.entries(fill)) {
      if (!tags[group]?.length) {
        tags[group] = items;
        changed = true;
      }
    }
    if (changed) await prisma.vehicle.update({ where: { id: ex2.id }, data: { featureTags: tags } });
  }

  console.log('Seed complete: vehicle catalog extras');
}

async function main() {
  await seedMedia();
  await seedVehicleCatalogExtras();
  await seedNewsIfEmpty();
  await seedAboutPageImages();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
