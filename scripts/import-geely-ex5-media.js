// One-off data import for the Geely EX5 vehicle (backend/prisma/schema.prisma
// models: Vehicle, VehicleColor, VehicleInterior, VehicleShowcase), following
// the exact structure of scripts/import-geely-ex2-media.js. Also does a
// small stopgap fix for Geely Panda Mini (mixes in real EX2/EX5 photos since
// no Panda Mini photography exists anywhere).
//
// Run AFTER scripts/process-ex5-media.js has produced D:\GEELY_ex5\processed.
// Run with: node scripts/import-geely-ex5-media.js   (from repo root)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require(path.join(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

const VEHICLE_ID = 'e3c05fbc-5112-4b7a-a103-f47691f5463d'; // Geely EX2 (source of reused videos)
const EX5_ID = '021eee8f-d84a-4204-84b3-b17114ef1b87';
const PANDA_MINI_ID = '072de2fa-9b90-4c0c-85b9-1c2ad322ebb2';
const PROCESSED_ROOT = 'D:\\GEELY_ex5\\processed';
const UPLOAD_DIR = path.resolve(__dirname, '..', 'apps', 'admin', 'public', 'uploads', 'vehicle');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Already-uploaded EX2 videos, reused directly per the user's request ("for
// video use it for ex2") — no re-copy needed, just point EX5 at these URLs.
const EX2_HERO_VIDEO_URL = '/uploads/vehicle/1788855732147-43-087b35e0.mp4';
const EX2_SHOWCASE_VIDEO_URL = '/uploads/vehicle/1788855736857-229-eff79926.mp4';

let counter = 0;
const SCRIPT_PATH = __filename;
let scriptSource = null;

const normalizeSpaces = (s) => s.replace(/[\s ]+/g, ' ');

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

// Plain-JS port of apps/admin/lib/vehicle-specifications.ts (see
// import-geely-ex2-media.js for why this is duplicated rather than required).
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

// ── Source path helpers ─────────────────────────────────────────────────────
const EXT_WHOLE = ['1. Exterior', 'Whole Exterior', 'GEELY E5 EM-i'];
const EXT_PART = ['1. Exterior', 'Exterior Part'];
const INT = ['2. Interior'];
const SPIN_EXT = ['5. 360', 'Exterior 360'];
const SPIN_INT = ['5. 360', 'Interior 360'];
const FEATURES = ['3. Feature Related Assets'];
const KV = ['4. KV'];
const OUTDOOR = ['6. Outdoor shooting'];
const VIDEOS = ['videos'];

function spinFrame(color, frameNum) {
  return up(...SPIN_EXT, color, `${frameNum}.jpg`);
}

async function main() {
  // ── COLORS ────────────────────────────────────────────────────────────────
  await prisma.vehicleColor.deleteMany({ where: { vehicleId: EX5_ID } });

  const colorDefs = [
    {
      name: 'Alpine White', colorCode: '#F2F1EE', sortOrder: 1, isDefault: true,
      imageUrl: spinFrame('alpine white', 1),
      images: [spinFrame('alpine white', 7), spinFrame('alpine white', 13), spinFrame('alpine white', 19)],
    },
    {
      name: 'Cloudveil Silver', colorCode: '#C9CBCC', sortOrder: 2, isDefault: false,
      imageUrl: up(...EXT_WHOLE, 'jpg', '（左舵银色）left 45°.jpg'),
      images: [up(...EXT_WHOLE, 'jpg', '（左舵银色）car front.jpg'), up(...EXT_WHOLE, 'jpg', '（左舵银色）right 75°.jpg'), spinFrame('cloudveil silver', 1)],
    },
    {
      name: 'Glacier Blue', colorCode: '#8FA9C2', sortOrder: 3, isDefault: false,
      imageUrl: spinFrame('glacier blue', 1),
      images: [spinFrame('glacier blue', 7), spinFrame('glacier blue', 13), spinFrame('glacier blue', 19)],
    },
    {
      name: 'Jungle Green', colorCode: '#4A5D45', sortOrder: 4, isDefault: false,
      imageUrl: up(...EXT_WHOLE, 'jpg', '（左舵绿色）right 45°.jpg'),
      images: [spinFrame('jungle green', 1), spinFrame('jungle green', 7), spinFrame('jungle green', 13)],
    },
    {
      name: 'Polar Black', colorCode: '#17181A', sortOrder: 5, isDefault: false,
      imageUrl: spinFrame('polar black', 1),
      images: [spinFrame('polar black', 7), spinFrame('polar black', 13), spinFrame('polar black', 19)],
    },
    {
      name: 'Volcanic Grey', colorCode: '#5B5D60', sortOrder: 6, isDefault: false,
      imageUrl: spinFrame('volcanic grey', 1),
      images: [spinFrame('volcanic grey', 7), spinFrame('volcanic grey', 13), spinFrame('volcanic grey', 19)],
    },
  ];

  const createdColors = [];
  for (const c of colorDefs) {
    const row = await prisma.vehicleColor.create({
      data: {
        vehicleId: EX5_ID,
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
  await prisma.vehicleInterior.deleteMany({ where: { vehicleId: EX5_ID } });

  await prisma.vehicleInterior.create({
    data: {
      vehicleId: EX5_ID,
      name: 'Amber Brown',
      materialType: 'Leather',
      description: 'A warm, rich cabin finish for a premium, inviting feel.',
      imageUrl: up(...INT, 'Amber Brown', 'jpg', '（左舵棕色）entire interior + seats.jpg'),
      images: [
        up(...INT, 'Amber Brown', 'jpg', '（左舵棕色）front-side interior.jpg'),
        up(...INT, 'Amber Brown', 'jpg', '（左舵棕色）rear seats.jpg'),
        up(...INT, 'Amber Brown', 'jpg', '（左舵棕色）trunk.jpg'),
        up(...SPIN_INT, 'Amber Brown', 'interior-360.jpg'),
      ],
      price: 0,
      isDefault: true,
      inStock: true,
      sortOrder: 0,
    },
  });

  await prisma.vehicleInterior.create({
    data: {
      vehicleId: EX5_ID,
      name: 'Sapphire Blue',
      materialType: 'Leather',
      description: 'A cool, sophisticated cabin finish with a modern edge.',
      imageUrl: up(...INT, 'Sapphire Blue', 'JPG', '（左舵蓝黑）entire interior + seats.jpg'),
      images: [
        up(...INT, 'Sapphire Blue', 'JPG', '（左舵蓝黑）front-side interior.jpg'),
        up(...INT, 'Sapphire Blue', 'JPG', '（左舵蓝黑）trunk.jpg'),
        up(...SPIN_INT, 'Sapphire Blue', 'interior-360.jpg'),
      ],
      price: 0,
      isDefault: false,
      inStock: true,
      sortOrder: 1,
    },
  });
  console.log('Created 2 interiors.');

  // ── VEHICLE (rename + hero + gallery + specifications) ───────────────────
  const heroImageUrl = up(...KV, 'KV-ULTRA AWD', 'KV-ULTRA AWD-LHD.jpg');

  const topGalleryImages = [
    heroImageUrl,
    up(...KV, 'KV-(Nameplate GEELY E5 EM-i)-L', 'JPG', 'KV-with-text_E5_EM-i-1.jpg'),
    up(...OUTDOOR, 'Exterior', 'GEELY E5 EM-i左舵', 'JPG', 'GEELY E5 EM-i左舵(2).jpg'),
    up(...OUTDOOR, 'Exterior', 'GEELY E5 EM-i左舵', 'JPG', 'GEELY E5 EM-i左舵(7).jpg'),
    up(...OUTDOOR, 'TVC photos', 'GEELY E5 EM-i', 'Large size', '美图01-GEELY E5 EM-i.jpg'),
    up(...OUTDOOR, 'TVC photos', 'GEELY E5 EM-i', 'Large size', '美图06-GEELY E5 EM-i.jpg'),
  ];

  const existing = await prisma.vehicle.findUnique({ where: { id: EX5_ID } });
  const canonical = normalizeToSections(existing.specifications);

  canonical.exterior.images = [
    up(...EXT_PART, 'Headlights', '前大灯Headlights.jpg'),
    up(...EXT_PART, 'Taillights', 'JPG', 'Taillights贯穿尾灯-GEELY E5 EM-i.jpg'),
    up(...EXT_PART, 'Wheel Hub', 'JPG', '左舵19-inch wheels.jpg'),
    up(...OUTDOOR, 'Exterior', 'GEELY E5 EM-i左舵', 'JPG', 'GEELY E5 EM-i左舵(3).jpg'),
  ];
  canonical.exterior.highlights = [
    { title: 'Signature Lighting Design', description: 'Distinctive full-width taillights and sculpted headlights give the EX5 a striking road presence day or night.', imageUrl: up(...EXT_PART, 'Taillights', 'JPG', 'Taillights贯穿尾灯-GEELY E5 EM-i.jpg') },
    { title: '19-inch Alloy Wheels', description: 'Aerodynamically optimised alloy wheels balance efficiency with a confident, planted stance.', imageUrl: up(...EXT_PART, 'Wheel Hub', 'JPG', '左舵19-inch wheels.jpg') },
  ];

  canonical.interior.images = [
    up(...OUTDOOR, 'Interior', 'JPG', '左舵(1).jpg'),
    up(...INT, 'Amber Brown', 'jpg', '（左舵棕色）storage compartment with bag.jpg'),
    up(...INT, 'Sapphire Blue', 'JPG', '（左舵蓝黑）passenger-side storage box.jpg'),
  ];
  canonical.interior.highlights = [
    { title: 'Heads-Up Display', description: 'Key driving information projected directly into the driver\'s line of sight, keeping eyes on the road.', imageUrl: up(...INT, 'Amber Brown', 'jpg', '（左舵棕色）HUD.jpg') },
    { title: 'Wireless Charging', description: 'A dedicated wireless charging pad keeps your phone topped up without reaching for a cable.', imageUrl: up(...INT, 'Amber Brown', 'jpg', '（左舵棕色）wireless charging.jpg') },
    { title: 'Smart Storage Throughout', description: 'Thoughtful storage compartments and a spacious trunk adapt to everyday life.', imageUrl: up(...INT, 'Amber Brown', 'jpg', '（左舵棕色）storage compartment.jpg') },
  ];

  canonical.safety.images = [
    up(...FEATURES, 'airbags', 'GEELY E5 EM-i左舵', 'jpg', '（左舵银色）7 airbags .jpg'),
    up(...FEATURES, '540° panoramic parking view', 'JPG', '（左舵棕色）540.jpg'),
  ];
  canonical.safety.highlights = [
    { title: 'Comprehensive Airbag Protection', description: 'A full 7-airbag system helps protect every occupant in the cabin.', imageUrl: up(...FEATURES, 'airbags', 'GEELY E5 EM-i左舵', 'jpg', '（左舵银色）7 airbags .jpg') },
    { title: '540° Panoramic Parking View', description: 'A full surround camera system gives a complete view around the vehicle for confident, precise parking.', imageUrl: up(...FEATURES, '540° panoramic parking view', 'JPG', '（左舵棕色）540.jpg') },
  ];

  canonical.technology.images = [
    up(...VIDEOS, 'ambient-lighting.mp4'),
    up(...VIDEOS, 'flyme-sound.mp4'),
    up(...FEATURES, 'OTA', 'GEELY E5 EM-i左舵', 'GEELY E5 EM-i左舵OTA.jpg'),
    up(...FEATURES, 'Geely APP remote control', 'Horizontal', '横版.jpg'),
    up(...FEATURES, 'Geely Battery', 'P145电池图片- Geely Battery.jpg'),
  ];
  canonical.technology.highlights = [
    { title: '256-Color Ambient Lighting', description: 'Personalise the cabin atmosphere with a full spectrum of ambient lighting colors.', imageUrl: up(...FEATURES, 'Geely Battery', 'P145电池图片- Geely Battery.jpg') },
    { title: 'Over-the-Air Updates', description: 'The EX5 keeps improving after purchase, with new features and refinements delivered wirelessly.', imageUrl: up(...FEATURES, 'OTA', 'GEELY E5 EM-i左舵', 'GEELY E5 EM-i左舵OTA.jpg') },
    { title: 'Geely App Remote Control', description: 'Lock, locate, precondition and check your EX5 remotely from the Geely smartphone app.', imageUrl: up(...FEATURES, 'Geely APP remote control', 'Horizontal', '横版.jpg') },
  ];

  const specifications = toSpecificationsPayload(canonical);

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: EX5_ID },
    data: {
      name: 'GEELY EX5',
      slug: 'geely-ex5',
      images: topGalleryImages,
      heroImageUrl,
      heroVideoUrl: EX2_HERO_VIDEO_URL,
      specifications,
    },
  });
  console.log('Vehicle updated:', updatedVehicle.name, updatedVehicle.slug);

  // ── SHOWCASE (per-color 360° spin, reused EX2 showcase video) ────────────
  await prisma.vehicleShowcase.deleteMany({ where: { vehicleId: { in: [EX5_ID, 'geely-e5', 'geely-ex5'] } } });

  const views = [];
  for (const color of createdColors) {
    for (let frame = 1; frame <= 24; frame++) {
      views.push({
        angle: String((frame - 1) * 15),
        imageUrl: spinFrame(color.name.toLowerCase(), frame),
        label: color.name,
        colorId: color.id,
      });
    }
  }

  await prisma.vehicleShowcase.create({
    data: {
      vehicleId: 'geely-ex5',
      vehicleName: 'GEELY EX5',
      title: 'Explore Every Angle',
      subtitle: 'Experience the GEELY EX5 like never before with our interactive 360° viewer.',
      views,
      videoUrl: EX2_SHOWCASE_VIDEO_URL,
      isActive: true,
      status: 'PUBLISHED',
    },
  });
  console.log(`Created showcase with ${views.length} views.`);

  // ── PANDA MINI STOPGAP — fix stray hero + gallery with a mix of real EX2/EX5 photos ──
  const ex2Vehicle = await prisma.vehicle.findUnique({ where: { id: VEHICLE_ID }, select: { images: true, heroImageUrl: true } });
  const ex2Images = (Array.isArray(ex2Vehicle?.images) ? ex2Vehicle.images : []).filter((u) => typeof u === 'string' && !/\.(mp4|mov|webm)$/i.test(u));
  const pandaHero = up(...OUTDOOR, 'TVC photos', 'GEELY E5 EM-i', 'Large size', '美图03-GEELY E5 EM-i.jpg');
  const pandaGallery = [
    pandaHero,
    up(...OUTDOOR, 'Exterior', 'GEELY E5 EM-i左舵', 'JPG', 'GEELY E5 EM-i左舵(4).jpg'),
    topGalleryImages[0],
    topGalleryImages[2],
    ex2Vehicle?.heroImageUrl,
    ...ex2Images.slice(0, 2),
  ].filter(Boolean);
  await prisma.vehicle.update({
    where: { id: PANDA_MINI_ID },
    data: {
      heroImageUrl: pandaHero,
      heroVideoUrl: EX2_HERO_VIDEO_URL,
      images: pandaGallery,
    },
  });
  console.log('Panda Mini hero/gallery refreshed (stopgap mix of EX2/EX5 photos — no dedicated Panda Mini photography exists).');
}

main()
  .catch((err) => {
    console.error('IMPORT FAILED:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
