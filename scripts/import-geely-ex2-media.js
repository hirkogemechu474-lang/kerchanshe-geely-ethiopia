// One-off data import for the Geely EX2 vehicle (backend/prisma/schema.prisma
// models: Vehicle, VehicleColor, VehicleInterior, VehicleShowcase).
//
// Run AFTER scripts/process-ex2-media.js has produced D:\GEELY_DOC_3\processed.
// Run with: node scripts/import-geely-ex2-media.js   (from repo root)
//
// Bypasses the HTTP admin API entirely (no auth cookie available to a
// standalone script) and instead does exactly what the app's own upload
// routes + admin forms do under the hood: copy files into
// apps/admin/public/uploads/vehicle/ and write the resulting "/uploads/..."
// URL strings straight into the DB via Prisma. See backend/src/routes/
// upload.routes.ts for the convention this mirrors.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require(path.join(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

// Plain-JS port of apps/admin/lib/vehicle-specifications.ts's normalize/
// denormalize/payload functions (that file is TypeScript and this script
// runs under plain `node`, so it's duplicated here rather than requiring a
// .ts file directly — keep both in sync if that file's shape ever changes).
const EMPTY_CANONICAL_SECTIONS = {
  performance: { type: '', displacement: '', power: '', torque: '', transmission: '', drivetrain: '', fuelType: '', fuelEconomy: '', range: '', batteryCapacity: '', acceleration: '' },
  safety: { airbags: '', abs: '', esc: '', tpms: '', cameras: '', sensors: '', adas: '', images: [], highlights: [] },
  technology: { infotainment: '', connectivity: '', images: [], highlights: [] },
  interior: { climate: '', seats: '', seatingCapacity: '', cargoVolume: '', images: [], highlights: [] },
  exterior: { lighting: '', wheels: '', length: '', width: '', height: '', wheelbase: '', groundClearance: '', curbWeight: '', images: [], highlights: [] },
  warranty: { basic: '', powertrain: '', corrosion: '', roadside: '', maintenance: '' },
};

function normalizeHighlights(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((h) => h && typeof h === 'object').map((h) => ({
    title: typeof h.title === 'string' ? h.title : '',
    description: typeof h.description === 'string' ? h.description : '',
    imageUrl: typeof h.imageUrl === 'string' ? h.imageUrl : '',
  }));
}

function normalizeToSections(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const legacyEngine = r.engine || {};
  const legacyDimensions = r.dimensions || {};
  const legacyFeatures = r.features || {};
  return {
    performance: { ...EMPTY_CANONICAL_SECTIONS.performance, ...legacyEngine, ...(r.performance || {}) },
    safety: { ...EMPTY_CANONICAL_SECTIONS.safety, ...(r.safety || {}), images: Array.isArray(r.safety?.images) ? r.safety.images : [], highlights: normalizeHighlights(r.safety?.highlights) },
    technology: {
      infotainment: r.technology?.infotainment ?? legacyFeatures.infotainment ?? '',
      connectivity: r.technology?.connectivity ?? legacyFeatures.connectivity ?? '',
      images: Array.isArray(r.technology?.images) ? r.technology.images : [],
      highlights: normalizeHighlights(r.technology?.highlights),
    },
    interior: {
      climate: r.interior?.climate ?? legacyFeatures.climate ?? '',
      seats: r.interior?.seats ?? legacyFeatures.seats ?? '',
      seatingCapacity: r.interior?.seatingCapacity ?? legacyDimensions.seatingCapacity ?? '',
      cargoVolume: r.interior?.cargoVolume ?? legacyDimensions.cargoVolume ?? '',
      images: Array.isArray(r.interior?.images) ? r.interior.images : [],
      highlights: normalizeHighlights(r.interior?.highlights),
    },
    exterior: {
      lighting: r.exterior?.lighting ?? legacyFeatures.lighting ?? '',
      wheels: r.exterior?.wheels ?? legacyFeatures.wheels ?? '',
      length: r.exterior?.length ?? legacyDimensions.length ?? '',
      width: r.exterior?.width ?? legacyDimensions.width ?? '',
      height: r.exterior?.height ?? legacyDimensions.height ?? '',
      wheelbase: r.exterior?.wheelbase ?? legacyDimensions.wheelbase ?? '',
      groundClearance: r.exterior?.groundClearance ?? legacyDimensions.groundClearance ?? '',
      curbWeight: r.exterior?.curbWeight ?? legacyDimensions.curbWeight ?? '',
      images: Array.isArray(r.exterior?.images) ? r.exterior.images : [],
      highlights: normalizeHighlights(r.exterior?.highlights),
    },
    warranty: { ...EMPTY_CANONICAL_SECTIONS.warranty, ...(r.warranty || {}) },
  };
}

function denormalizeToLegacy(sections) {
  return {
    engine: { ...sections.performance },
    dimensions: {
      length: sections.exterior.length, width: sections.exterior.width, height: sections.exterior.height,
      wheelbase: sections.exterior.wheelbase, groundClearance: sections.exterior.groundClearance, curbWeight: sections.exterior.curbWeight,
      seatingCapacity: sections.interior.seatingCapacity, cargoVolume: sections.interior.cargoVolume,
    },
    features: {
      infotainment: sections.technology.infotainment, connectivity: sections.technology.connectivity,
      climate: sections.interior.climate, seats: sections.interior.seats,
      lighting: sections.exterior.lighting, wheels: sections.exterior.wheels,
    },
    safety: { ...sections.safety },
    warranty: { ...sections.warranty },
  };
}

function toSpecificationsPayload(sections) {
  return {
    ...denormalizeToLegacy(sections),
    performance: sections.performance,
    safety: sections.safety,
    technology: sections.technology,
    interior: sections.interior,
    exterior: sections.exterior,
    warranty: sections.warranty,
  };
}

const VEHICLE_ID = 'e3c05fbc-5112-4b7a-a103-f47691f5463d';
const PROCESSED_ROOT = 'D:\\GEELY_DOC_3\\processed';
const UPLOAD_DIR = path.resolve(__dirname, '..', 'apps', 'admin', 'public', 'uploads', 'vehicle');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let counter = 0;
const SCRIPT_PATH = __filename;
let scriptSource = null; // lazily loaded only if a self-heal is needed

/**
 * Some CJK filenames in this script were transcribed by hand from tool
 * output and can differ from the real on-disk bytes despite looking
 * identical when printed (confirmed happening once already — see git
 * history). Self-heal: if the exact path is missing, find the one file in
 * the same directory sharing this call's ASCII-only prefix, use it, and
 * patch this script's own source so future runs no longer need the fallback.
 */
// Some source filenames use U+00A0 (non-breaking space) instead of a normal
// space — treat all whitespace-ish characters as equivalent when comparing,
// since that's the only kind of "invisible" mismatch expected here.
const normalizeSpaces = (s) => s.replace(/[\s ]+/g, ' ');

function selfHealPath(dir, wrongName) {
  const asciiPrefix = wrongName.match(/^[\x00-\x7F]+/)?.[0] || '';
  if (!asciiPrefix) throw new Error(`Can't self-heal "${wrongName}" in ${dir} — no ASCII prefix to match on.`);
  const normPrefix = normalizeSpaces(asciiPrefix);
  const candidates = fs.readdirSync(dir).filter((f) => normalizeSpaces(f).startsWith(normPrefix));
  if (candidates.length !== 1) {
    throw new Error(`Missing processed file "${wrongName}" in ${dir}, and self-heal found ${candidates.length} candidates for prefix "${asciiPrefix}" (need exactly 1): ${candidates.join(', ')}`);
  }
  const rightName = candidates[0];
  if (scriptSource === null) scriptSource = fs.readFileSync(SCRIPT_PATH, 'utf8');
  if (scriptSource.includes(wrongName)) {
    scriptSource = scriptSource.split(wrongName).join(rightName);
    fs.writeFileSync(SCRIPT_PATH, scriptSource, 'utf8');
    console.log(`Self-healed filename mismatch: "${wrongName}" -> "${rightName}"`);
  }
  return rightName;
}

/** Copies a processed file into apps/admin/public/uploads/vehicle/ and returns its public URL, exactly like the real upload routes do. */
function up(...processedRelParts) {
  let absPath = path.join(PROCESSED_ROOT, ...processedRelParts);
  if (!fs.existsSync(absPath)) {
    const dir = path.dirname(absPath);
    const wrongName = path.basename(absPath);
    const rightName = selfHealPath(dir, wrongName);
    absPath = path.join(dir, rightName);
  }
  const ext = path.extname(absPath);
  const filename = `${Date.now()}-${counter++}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  fs.copyFileSync(absPath, path.join(UPLOAD_DIR, filename));
  return `/uploads/vehicle/${filename}`;
}

const EXT = ['extracted_LHD', '1. Exterior'];
const INT = ['extracted_LHD', '2. Interior'];
const SPIN = ['extracted_LHD', '3. 360° images', 'ex2 Exterior'];
const CG = ['extracted_LHD', '5-CG'];
const CGTECH_IMG = ['extracted_cgtech', '03- CG TECH VIDEO&IMAGES', '03-CG TECH IMAGES', 'jpg'];
const CGTECH_VID_IMG = ['extracted_cgtech', '03- CG TECH VIDEO&IMAGES', '2-CG Photos-from video'];
const SOCIAL_COLOR = ['extracted_social', '04-Social Media Creative Assets(  (LOCAL ASSETS Must Use GEELY EX2, do not use EX2 alone)', '2. Color Naming  Posters颜色命名海报', 'jpg'];
const SOCIAL_LAUNCH = ['extracted_social', '04-Social Media Creative Assets(  (LOCAL ASSETS Must Use GEELY EX2, do not use EX2 alone)', '04-Launch Poster上市海报'];
const LIFESTYLE_LHD = ['extracted_LHD', '4. Lifestyle images', 'JPG'];
const LIFESTYLE_GLOBAL = ['extracted_lifestyle_global', '05-Global Lifestyle Images-Urban, Seaside', 'JPEG'];
const VIDEOS = ['videos'];

// Note: process-ex2-media.js re-encodes every source image to .jpg regardless
// of its original extension, so every path below ends in .jpg even where the
// source was .png.
const SPIN_COLOR_FOLDERS = {
  'Aurora Green': 'Aurora Green极光绿',
  'Comet Gray': 'Comet Gray彗星灰',
  'Moon White': 'Moon White月光白',
  'Nebula Beige': 'Nebula Beige星云米',
  'Star Silver': 'Star Silver星辰银',
};
function spinFrame(colorName, frameNum) {
  return up(...SPIN, SPIN_COLOR_FOLDERS[colorName], 'JPG&PNG&PSD', 'jpg', `EX2.${frameNum}.jpg`);
}

async function main() {
  // ── COLORS ────────────────────────────────────────────────────────────────
  await prisma.vehicleColor.deleteMany({ where: { vehicleId: VEHICLE_ID } });

  const colorNamingPoster = (name) => up(...SOCIAL_COLOR, `${name}.jpg`);

  const colorDefs = [
    {
      name: 'Aurora Green', colorCode: '#1F6D4A', sortOrder: 1, isDefault: true,
      imageUrl: up(...EXT, '1-Aurora Green', 'PNG', 'A50°.jpg'),
      images: [up(...EXT, '1-Aurora Green', 'JPG', '315°.jpg'), up(...EXT, '1-Aurora Green', 'JPG', 'Rear200°.jpg'), colorNamingPoster('Aurora Green')],
    },
    {
      name: 'Star Silver', colorCode: '#C7CBCE', sortOrder: 2, isDefault: false,
      imageUrl: up(...EXT, '2-Star Silver', 'PNG', 'Front 30°.jpg'),
      images: [up(...EXT, '2-Star Silver', 'JPG', 'FRONT .jpg'), up(...EXT, '2-Star Silver', 'JPG', 'REAR.jpg'), colorNamingPoster('Star Silver')],
    },
    {
      name: 'Comet Gray', colorCode: '#57585B', sortOrder: 3, isDefault: false,
      imageUrl: spinFrame('Comet Gray', 1),
      images: [spinFrame('Comet Gray', 7), spinFrame('Comet Gray', 13), spinFrame('Comet Gray', 19), colorNamingPoster('Comet Gray')],
    },
    {
      name: 'Moon White', colorCode: '#F2F1EC', sortOrder: 4, isDefault: false,
      imageUrl: spinFrame('Moon White', 1),
      images: [spinFrame('Moon White', 7), spinFrame('Moon White', 13), spinFrame('Moon White', 19), colorNamingPoster('Moon White')],
    },
    {
      name: 'Nebula Beige', colorCode: '#CBB79A', sortOrder: 5, isDefault: false,
      imageUrl: spinFrame('Nebula Beige', 1),
      images: [spinFrame('Nebula Beige', 7), spinFrame('Nebula Beige', 13), spinFrame('Nebula Beige', 19), colorNamingPoster('Nebula Beige')],
    },
  ];

  const createdColors = [];
  for (const c of colorDefs) {
    const row = await prisma.vehicleColor.create({
      data: {
        vehicleId: VEHICLE_ID,
        name: c.name,
        colorCode: c.colorCode,
        imageUrl: c.imageUrl,
        images: c.images,
        price: 0,
        inStock: true,
        isDefault: c.isDefault,
        sortOrder: c.sortOrder,
      },
    });
    createdColors.push(row);
  }
  console.log(`Created ${createdColors.length} colors.`);

  // ── INTERIORS ─────────────────────────────────────────────────────────────
  await prisma.vehicleInterior.deleteMany({ where: { vehicleId: VEHICLE_ID } });

  const horizonGray = await prisma.vehicleInterior.create({
    data: {
      vehicleId: VEHICLE_ID,
      name: 'Horizon Gray',
      materialType: 'Fabric/Leatherette',
      description: 'A calm, versatile cabin finish that suits every drive.',
      imageUrl: up(...INT, 'Horizon Gray', 'JPG', 'Front Interior.jpg'),
      images: [
        up(...INT, 'Horizon Gray', 'JPG', 'Driver Seat 45°.jpg'),
        up(...INT, 'Horizon Gray', 'JPG', 'Passenger View.jpg'),
        up(...INT, 'Horizon Gray', 'JPG', 'Rear Seat.jpg'),
        up(...SPIN.slice(0, -1), 'Interior', 'Horizon Gray 360 interior.jpg'),
        up(...INT, 'Retouched Interior-国内修图', 'ambient lighting.jpg'),
        up(...INT, 'Retouched Interior-国内修图', 'center.jpg'),
        up(...INT, 'Retouched Interior-国内修图', 'front seat.jpg'),
        up(...INT, 'Retouched Interior-国内修图', 'glove box.jpg'),
        up(...INT, 'Retouched Interior-国内修图', 'interior.jpg'),
        up(...INT, 'Retouched Interior-国内修图', 'rear seats storage.jpg'),
      ],
      price: 0,
      isDefault: true,
      inStock: true,
      sortOrder: 0,
    },
  });

  const skylineWhite = await prisma.vehicleInterior.create({
    data: {
      vehicleId: VEHICLE_ID,
      name: 'Skyline White',
      materialType: 'Fabric/Leatherette',
      description: 'A brighter, airier take on the cabin for a premium, open feel.',
      imageUrl: up(...INT, 'Skyline White', 'JPG', 'Front Seat 45°.jpg'),
      images: [
        up(...INT, 'Skyline White', 'JPG', 'Passenger Seat.jpg'),
        up(...INT, 'Skyline White', 'JPG', 'Rear Air Vent.jpg'),
        up(...INT, 'Skyline White', 'JPG', 'Rear Space.jpg'),
        up(...INT, 'Skyline White', 'JPG', 'Storage+Wireless Charging.jpg'),
        up(...INT, 'Skyline White', 'JPG', 'Trunk Space.jpg'),
        up(...INT, 'Skyline White', 'JPG', 'Trunk.jpg'),
        up(...SPIN.slice(0, -1), 'Interior', 'Skyline White 360 interior.jpg'),
      ],
      price: 0,
      isDefault: false,
      inStock: true,
      sortOrder: 1,
    },
  });
  console.log('Created 2 interiors.');

  // ── VEHICLE (rename + hero + gallery + specifications) ───────────────────
  const heroImageUrl = up(...EXT, '4-Retouched Images-国内修图', 'E22H-正侧-拷贝.jpg');
  const heroVideoUrl = up(...VIDEOS, 'hero-tvc.mp4');

  const topGalleryImages = [
    heroImageUrl,
    up(...EXT, '4-Retouched Images-国内修图', 'E22H-车尾60度-拷贝.jpg'),
    up(...EXT, '4-Retouched Images-国内修图', '车尾45-拷贝.jpg'),
    up(...EXT, '4-Retouched Images-国内修图', '正车尾-拷贝.jpg'),
    up(...LIFESTYLE_GLOBAL, 'EX2-01.jpg'),
    up(...LIFESTYLE_GLOBAL, 'EX2-05.jpg'),
    up(...LIFESTYLE_GLOBAL, 'EX2-11.jpg'),
    up(...LIFESTYLE_LHD, '20250066副本.jpg'),
    up(...LIFESTYLE_LHD, '20251297副本.jpg'),
    up(...SOCIAL_LAUNCH, 'launchposter1.jpg'),
  ];

  const existing = await prisma.vehicle.findUnique({ where: { id: VEHICLE_ID } });
  const canonical = normalizeToSections(existing.specifications);

  canonical.exterior.images = [
    up(...VIDEOS, 'exterior-design.mp4'),
    up(...EXT, '4-Retouched Images-国内修图', 'Car Spolier车尾翼_RGB 拷贝.jpg'),
    up(...EXT, '4-Retouched Images-国内修图', 'e22左前50俯视-fn-拷贝.jpg'),
    up(...CG, 'CG Lifestyle images-Exterior&Interior', '左舵外观-花园01', '左舵外观-花园01.jpg'),
    up(...CG, 'CG Lifestyle images-Exterior&Interior', '左舵外观-花园02', '左舵外观-花园02.jpg'),
  ];
  canonical.exterior.highlights = [
    { title: 'Sculpted for Presence', description: 'A confident, sculpted silhouette with clean surfacing that turns heads from every angle.', imageUrl: up(...EXT, '3-Front Trunk', '.jpg') },
    { title: 'Front Trunk Storage', description: 'A dedicated front trunk adds versatile everyday storage on top of the rear cargo area.', imageUrl: up(...CG, 'CG Lifestyle images-Exterior&Interior', '左舵外观-等高线', '左舵外观-等高线.jpg') },
  ];

  canonical.interior.images = [
    up(...VIDEOS, 'interior-space.mp4'),
    up(...CG, 'CG Lifestyle images-Exterior&Interior', '左舵内饰-花园', '左舵内饰-花园.jpg'),
    up(...CG, 'CG Lifestyle images-Exterior&Interior', '左舵内饰-等高线', '左舵内饰-等高线.jpg'),
  ];
  canonical.interior.highlights = [
    { title: 'Refined Cabin Comfort', description: 'Thoughtful materials and a clean layout make every seat feel considered.', imageUrl: up(...INT, 'Retouched Interior-国内修图', 'interior.jpg') },
    { title: 'Smart Storage Everywhere', description: 'From the rear seats to the glovebox, storage is designed around real daily use.', imageUrl: up(...INT, 'Retouched Interior-国内修图', 'rear seats storage.jpg') },
    { title: 'Ambient Atmosphere', description: 'Interior lighting sets the mood for every journey, day or night.', imageUrl: up(...INT, 'Retouched Interior-国内修图', 'ambient lighting.jpg') },
  ];

  canonical.safety.images = [
    up(...VIDEOS, 'safety-explainer.mp4'),
    up(...CGTECH_IMG, 'Load-carrying Path 1传力路径.jpg'),
    up(...CGTECH_IMG, 'Load-carrying Path 2传力路径.jpg'),
    up(...CGTECH_IMG, 'Four transverse and Five longitudinal beams structure四横五纵.jpg'),
    up(...CGTECH_IMG, 'Frame Rail底梁.jpg'),
    up(...CGTECH_IMG, 'High-strength Frame目字形结构.jpg'),
    up(...CGTECH_IMG, 'Rear Subframe Protection 护甲1.jpg'),
    up(...CGTECH_IMG, 'Rear Subframe Protection 护甲2.jpg'),
    up(...CGTECH_IMG, 'Rear Subframe Protection 护甲3.jpg'),
    up(...CGTECH_IMG, 'Tri-directional Energy Absorbing Structure 三叶草泄力防护结构.jpg'),
    up(...CGTECH_IMG, '540 surround view540度全景影像.jpg'),
    up(...CGTECH_VID_IMG, 'Battery pack underbody protection beam底部防护.jpg'),
    up(...CGTECH_VID_IMG, '16 soft connections_16个软连接.jpg'),
    up(...CGTECH_VID_IMG, '36.9m 100-0 km_h braking distance制动距离.jpg'),
    up(...CGTECH_VID_IMG, 'Geely Battery Safety System 神盾安全.jpg'),
    up(...CGTECH_VID_IMG, 'Liquid-Electric Isolation Design液电分离.jpg'),
    up(...CGTECH_VID_IMG, 'Zero Cell Intrusion During Side Pole Impact_侧柱碰.jpg'),
    up(...CG, 'CG ADAS Function', 'ACC自适应巡航_国内修图 2.jpg'),
    up(...CG, 'CG ADAS Function', 'AEB智能驾驶_自动紧急制动_国内修图.jpg'),
    up(...CG, 'CG ADAS Function', 'LDW智能驾驶_道路偏离预警_国内修图.jpg'),
  ];
  canonical.safety.highlights = [
    { title: 'Zero Cell Intrusion, Side-Pole Protection', description: 'The battery structure is engineered to prevent cell intrusion even in a side-pole impact.', imageUrl: up(...CGTECH_VID_IMG, 'Zero Cell Intrusion During Side Pole Impact_侧柱碰.jpg') },
    { title: 'Geely Battery Safety System', description: 'A dedicated battery safety architecture guards against thermal and structural risk.', imageUrl: up(...CGTECH_VID_IMG, 'Geely Battery Safety System 神盾安全.jpg') },
    { title: 'Reinforced Subframe Armor', description: 'A protective underbody shield helps guard critical components from road debris and impact.', imageUrl: up(...CGTECH_IMG, 'Rear Subframe Protection 护甲1.jpg') },
    { title: 'Confident, Short Braking Distances', description: 'Tuned brakes bring the EX2 to a stop from 100 km/h in just 36.9 metres.', imageUrl: up(...CGTECH_VID_IMG, '36.9m 100-0 km_h braking distance制动距离.jpg') },
    { title: 'Intelligent Driver Assistance', description: 'Adaptive Cruise Control helps maintain a safe following distance with less driver fatigue.', imageUrl: up(...CG, 'CG ADAS Function', 'ACC自适应巡航_国内修图 2.jpg') },
  ];

  canonical.technology.images = [
    up(...VIDEOS, 'technology-ev.mp4'),
    up(...VIDEOS, 'technology-driving-dynamics.mp4'),
    up(...CGTECH_IMG, 'E-drive电驱.jpg'),
    up(...CGTECH_VID_IMG, 'Exploded view of E-Drive电驱爆炸.jpg'),
    up(...CGTECH_VID_IMG, 'G-TCS( All Weather Traction Control System)防滑系统.jpg'),
    up(...CGTECH_IMG, 'Platform Architecture平台架构.jpg'),
    up(...CGTECH_IMG, 'Vehicle Architecture整车架构-jpg.jpg'),
    up(...CGTECH_VID_IMG, '4.95m nimble turning radius.jpg'),
    up(...CGTECH_VID_IMG, 'Independent Suspension独立悬架.jpg'),
    up(...CGTECH_VID_IMG, 'Future scalability For AWD, HEV, and REEV未来拓展.jpg'),
    up(...CGTECH_VID_IMG, "Geely’s independently developed intelligent power domain controller智能域控.jpg"),
    up(...CGTECH_VID_IMG, 'CST（Comfort Braking System ）舒适制动.jpg'),
    up(...CGTECH_IMG, 'Exploded View of Battery三电爆炸图.jpg'),
  ];
  canonical.technology.highlights = [
    { title: 'Advanced E-Drive Powertrain', description: 'A highly integrated electric drive unit delivers efficient, responsive performance.', imageUrl: up(...CGTECH_IMG, 'E-drive电驱.jpg') },
    { title: 'All-Weather Traction Control', description: 'G-TCS continuously manages grip across changing road surfaces for confident, stable handling.', imageUrl: up(...CGTECH_VID_IMG, 'G-TCS( All Weather Traction Control System)防滑系统.jpg') },
    { title: 'Engineered Platform Architecture', description: "A purpose-built EV platform underpins the EX2's packaging, safety, and dynamics.", imageUrl: up(...CGTECH_IMG, 'Platform Architecture平台架构.jpg') },
    { title: '4.95m Nimble Turning Radius', description: 'A tight turning circle makes the EX2 easy to place in city streets and parking.', imageUrl: up(...CGTECH_VID_IMG, '4.95m nimble turning radius.jpg') },
    { title: 'Independent Suspension Tuning', description: 'An independent suspension setup balances ride comfort with confident handling.', imageUrl: up(...CGTECH_VID_IMG, 'Independent Suspension独立悬架.jpg') },
  ];

  const specifications = toSpecificationsPayload(canonical);

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: VEHICLE_ID },
    data: {
      name: 'Geely EX2',
      slug: 'geely-ex2',
      images: topGalleryImages,
      heroImageUrl,
      heroVideoUrl,
      specifications,
    },
  });
  console.log('Vehicle updated:', updatedVehicle.name, updatedVehicle.slug);

  // ── SHOWCASE (per-color 360° spin + product video) ────────────────────────
  await prisma.vehicleShowcase.deleteMany({ where: { vehicleId: { in: [VEHICLE_ID, 'geely-e2', 'geely-ex2'] } } });

  const views = [];
  for (const color of createdColors) {
    for (let frame = 1; frame <= 24; frame++) {
      views.push({
        angle: String((frame - 1) * 15),
        imageUrl: spinFrame(color.name, frame),
        label: color.name,
        colorId: color.id,
      });
    }
  }

  const showcaseVideoUrl = up(...VIDEOS, 'showcase-handling.mp4');

  await prisma.vehicleShowcase.create({
    data: {
      vehicleId: 'geely-ex2',
      vehicleName: 'Geely EX2',
      title: 'Explore Every Angle',
      subtitle: 'Experience the Geely EX2 like never before with our interactive 360° viewer.',
      views,
      videoUrl: showcaseVideoUrl,
      isActive: true,
      status: 'PUBLISHED',
    },
  });
  console.log(`Created showcase with ${views.length} views.`);
}

main()
  .catch((err) => {
    console.error('IMPORT FAILED:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
