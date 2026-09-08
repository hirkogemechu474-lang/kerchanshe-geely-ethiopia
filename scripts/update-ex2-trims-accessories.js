// Follow-up to import-geely-ex2-media.js: adds representative photos to the
// EX2's Trims (VehiclePackage) and to the global Accessory catalog
// (VehicleAccessory, vehicleId: null — shared across every vehicle, so these
// are stand-in vehicle photos, not literal per-accessory product shots, since
// no accessory-specific photography exists anywhere in the source asset drop).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require(path.join(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

const VEHICLE_ID = 'e3c05fbc-5112-4b7a-a103-f47691f5463d';
const PROCESSED_ROOT = 'D:\\GEELY_DOC_3\\processed';
const UPLOAD_DIR = path.resolve(__dirname, '..', 'apps', 'admin', 'public', 'uploads', 'vehicle');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let counter = 0;
function up(...processedRelParts) {
  const absPath = path.join(PROCESSED_ROOT, ...processedRelParts);
  if (!fs.existsSync(absPath)) throw new Error(`Missing processed file: ${absPath}`);
  const ext = path.extname(absPath);
  const filename = `${Date.now()}-${counter++}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  fs.copyFileSync(absPath, path.join(UPLOAD_DIR, filename));
  return `/uploads/vehicle/${filename}`;
}

const EXT = ['extracted_LHD', '1. Exterior'];
const INT = ['extracted_LHD', '2. Interior'];

async function main() {
  // ── TRIMS (VehiclePackage) — EX2-specific, one representative photo each ──
  const packages = await prisma.vehiclePackage.findMany({ where: { vehicleId: VEHICLE_ID } });
  const byName = Object.fromEntries(packages.map((p) => [p.name, p]));

  if (byName['Comfort']) {
    await prisma.vehiclePackage.update({
      where: { id: byName['Comfort'].id },
      data: { imageUrl: up(...EXT, '2-Star Silver', 'JPG', 'Front 30°.jpg') },
    });
  }
  if (byName['Luxury']) {
    await prisma.vehiclePackage.update({
      where: { id: byName['Luxury'].id },
      data: { imageUrl: up(...EXT, '4-Retouched Images-国内修图', 'E22H-正侧-拷贝.jpg') },
    });
  }
  if (byName['Sport']) {
    await prisma.vehiclePackage.update({
      where: { id: byName['Sport'].id },
      data: { imageUrl: up(...EXT, '1-Aurora Green', 'JPG', '315°.jpg') },
    });
  }
  console.log('Updated trim photos:', Object.keys(byName));

  // ── ACCESSORIES (VehicleAccessory, global) — best-available representative
  // photo per item; these are shared across every vehicle in the catalog, so
  // this improves the current all-blank state for everyone rather than being
  // EX2-exclusive. ──
  const accessoryPhotoByName = {
    'Wireless Phone Charger Pad': () => up(...INT, 'Skyline White', 'JPG', 'Storage+Wireless Charging.jpg'),
    'Cargo Tray / Boot Liner': () => up(...INT, 'Skyline White', 'JPG', 'Trunk Space.jpg'),
    'Leather Seat Covers': () => up(...INT, 'Retouched Interior-国内修图', 'front seat.jpg'),
    'Dash Cam (Front & Rear)': () => up(...INT, 'Retouched Interior-国内修图', 'center.jpg'),
    'Rear Parking Sensors': () => up(...EXT, '2-Star Silver', 'JPG', 'REAR.jpg'),
    'Roof Rack': () => up(...EXT, '4-Retouched Images-国内修图', 'e22左前50俯视-fn-拷贝.jpg'),
    'Mud Flaps (Set of 4)': () => up(...EXT, '1-Aurora Green', 'JPG', 'A50°.jpg'),
    'First Aid & Emergency Kit': () => up(...INT, 'Skyline White', 'JPG', 'Trunk.jpg'),
  };

  const accessories = await prisma.vehicleAccessory.findMany({ where: { vehicleId: null } });
  let updated = 0;
  for (const acc of accessories) {
    const getUrl = accessoryPhotoByName[acc.name];
    if (!getUrl) continue; // no reasonable representative photo available — left as-is
    await prisma.vehicleAccessory.update({ where: { id: acc.id }, data: { imageUrl: getUrl() } });
    updated++;
  }
  console.log(`Updated ${updated} global accessory photos.`);
}

main()
  .catch((err) => { console.error('FAILED:', err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
