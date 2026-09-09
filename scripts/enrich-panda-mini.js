// Enriches the Geely Panda Mini page using real, already-uploaded EX2/EX5
// photos (no dedicated Panda Mini asset drop exists — user confirmed: don't
// fabricate colors/interiors/360, just make the existing photo mix richer).
// Pure DB update — every URL here is already hosted from the EX2/EX5 imports,
// no new files to process/copy.

const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

const PANDA_MINI_ID = '072de2fa-9b90-4c0c-85b9-1c2ad322ebb2';
const EX2_ID = 'e3c05fbc-5112-4b7a-a103-f47691f5463d';
const EX5_ID = '021eee8f-d84a-4204-84b3-b17114ef1b87';

async function main() {
  const [pandaMini, ex2, ex5, ex2Colors, ex5Colors] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: PANDA_MINI_ID } }),
    prisma.vehicle.findUnique({ where: { id: EX2_ID } }),
    prisma.vehicle.findUnique({ where: { id: EX5_ID } }),
    prisma.vehicleColor.findMany({ where: { vehicleId: EX2_ID }, orderBy: { sortOrder: 'asc' } }),
    prisma.vehicleColor.findMany({ where: { vehicleId: EX5_ID }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const dedupe = (arr) => [...new Set(arr.filter(Boolean))];

  // ── Top gallery — a bigger, cleaner mix (no duplicates this time) ──
  const topGallery = dedupe([
    pandaMini.heroImageUrl,
    ex5.heroImageUrl,
    ex2Colors[0]?.imageUrl,
    ex5Colors[1]?.imageUrl,
    ex2Colors[2]?.imageUrl,
    ex5Colors[3]?.imageUrl,
    ex2.images?.[1],
    ex5.images?.[1],
    ex2.images?.[3],
    ex5.images?.[3],
  ]);

  // ── Vehicle Sections galleries + highlights, generic descriptions only
  // (not claiming any specific feature unique to EX2/EX5's actual trim) ──
  const specs = pandaMini.specifications || {};
  specs.exterior = specs.exterior || {};
  specs.interior = specs.interior || {};
  specs.technology = specs.technology || {};
  specs.safety = specs.safety || {};

  specs.exterior.images = dedupe([ex2Colors[1]?.imageUrl, ex5Colors[2]?.imageUrl, ex2.specifications?.exterior?.images?.[1]]);
  specs.exterior.highlights = [
    { title: 'A Distinctive Silhouette', description: 'Clean, modern styling gives the Panda Mini a friendly, city-ready presence.', imageUrl: ex5Colors[0]?.imageUrl || '' },
    { title: 'A Colour For Every Personality', description: 'A range of finishes lets you make the Panda Mini your own.', imageUrl: ex2Colors[3]?.imageUrl || '' },
  ].filter((h) => h.imageUrl);

  specs.interior.images = dedupe([ex2.specifications?.interior?.images?.[1], ex5.specifications?.interior?.images?.[0], ex5.specifications?.interior?.images?.[1]]);
  specs.interior.highlights = [
    { title: 'A Cabin Built For The City', description: 'A compact footprint outside, a smart, comfortable cabin inside — designed for everyday city driving.', imageUrl: ex5.specifications?.interior?.images?.[0] || '' },
    { title: 'Everyday Practicality', description: 'Thoughtful storage and a driver-focused layout make daily errands effortless.', imageUrl: ex2.specifications?.interior?.images?.[1] || '' },
  ].filter((h) => h.imageUrl);

  specs.technology.images = dedupe([ex5.specifications?.technology?.images?.[2], ex2.specifications?.technology?.images?.[2]]);
  specs.technology.highlights = [
    { title: 'Smart, Connected Driving', description: 'Modern infotainment and connectivity keep you in touch on every trip.', imageUrl: ex5.specifications?.technology?.images?.[2] || ex2.specifications?.technology?.images?.[2] || '' },
  ].filter((h) => h.imageUrl);

  // NOTE: EX2's safety.images[0] is actually its safety-explainer *video* —
  // fine for the media grid below (it auto-detects video vs image), but
  // FeatureStorySection's highlight image can only render a still image, so
  // the highlight picks EX5's (all-image) array first instead.
  specs.safety.images = dedupe([ex2.specifications?.safety?.images?.[0], ex5.specifications?.safety?.images?.[0]]);
  specs.safety.highlights = [
    { title: 'Built With Safety In Mind', description: 'A robust structure and a full suite of driver-assistance features help protect everyone on board.', imageUrl: ex5.specifications?.safety?.images?.[0] || ex2.specifications?.safety?.images?.[1] || '' },
  ].filter((h) => h.imageUrl);

  await prisma.vehicle.update({
    where: { id: PANDA_MINI_ID },
    data: {
      images: topGallery,
      specifications: specs,
    },
  });

  console.log('Panda Mini enriched:', {
    topGalleryCount: topGallery.length,
    exteriorImages: specs.exterior.images.length,
    exteriorHighlights: specs.exterior.highlights.length,
    interiorImages: specs.interior.images.length,
    interiorHighlights: specs.interior.highlights.length,
    technologyImages: specs.technology.images.length,
    technologyHighlights: specs.technology.highlights.length,
    safetyImages: specs.safety.images.length,
    safetyHighlights: specs.safety.highlights.length,
  });
}

main()
  .catch((err) => { console.error('FAILED:', err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
