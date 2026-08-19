import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const content = {
  heroTitle: 'Parts & Accessories',
  heroSubtitle:
    'Find genuine Geely parts and accessories to keep your vehicle running at peak performance. All parts come with warranty and professional installation support.',
  heroBannerImage: null,
  heroBackgroundImage: null,
  introHeading: 'Everything Your Geely Needs, All in One Place',
  introDescription:
    'From routine maintenance filters to body panels, we stock a full range of genuine Geely parts for every model we sell. Order online, call our parts department, or visit any authorized service center for expert advice and installation.',
  ctaTitle: 'Need Help Finding the Right Part?',
  ctaDescription:
    'Our parts specialists can help you identify the correct parts for your Geely vehicle and arrange professional installation.',
  ctaButtonText: 'Call Parts Department',
  ctaButtonLink: 'tel:+251110000000',
  metaTitle: 'Genuine Geely Parts & Accessories | Geely Ethiopia',
  metaDescription:
    'Browse genuine Geely parts and accessories for Coolray, Emgrand, Monjaro, Azkarra and Okavango. Warranty-backed parts with nationwide delivery and installation.',
  metaKeywords: 'Geely parts, Geely accessories, spare parts Ethiopia, genuine Geely',
};

const categories = [
  { name: 'Engine Parts', slug: 'engine-parts', description: 'Filters, spark plugs, belts and engine components', displayOrder: 1 },
  { name: 'Brakes & Suspension', slug: 'brakes-suspension', description: 'Brake pads, discs, fluids and suspension parts', displayOrder: 2 },
  { name: 'Electrical', slug: 'electrical', description: 'Batteries, bulbs, sensors and electronic modules', displayOrder: 3 },
  { name: 'Filters', slug: 'filters', description: 'Oil, air, cabin and fuel filters', displayOrder: 4 },
  { name: 'Fluids & Oils', slug: 'fluids-oils', description: 'Engine oils, coolants and brake fluids', displayOrder: 5 },
  { name: 'Body Parts', slug: 'body-parts', description: 'Panels, lights, wipers and exterior trim', displayOrder: 6 },
  { name: 'Interior', slug: 'interior', description: 'Cabin accessories, mats and interior trim', displayOrder: 7 },
  { name: 'Lighting', slug: 'lighting', description: 'Headlights, tail lights and LED upgrades', displayOrder: 8 },
];

const brands = [
  { name: 'Coolray', description: 'Compact crossover' },
  { name: 'Emgrand', description: 'Premium sedan' },
  { name: 'Monjaro', description: 'Flagship SUV' },
  { name: 'Azkarra', description: 'Compact SUV' },
  { name: 'Okavango', description: '7-seater SUV' },
];

const benefits = [
  { title: 'Genuine Parts Only', description: '100% authentic Geely parts', icon: 'Shield', displayOrder: 1 },
  { title: 'Fast Delivery', description: '2-3 days to major cities', icon: 'Truck', displayOrder: 2 },
  { title: 'Easy Ordering', description: 'Online & phone orders', icon: 'ShoppingCart', displayOrder: 3 },
];

const parts = [
  {
    name: 'Brake Pad Set (Front)',
    sku: 'GE-BRK-001-F',
    category: 'brakes',
    description: 'Genuine Geely front brake pads with superior stopping power and durability. Includes wear indicators for safety.',
    stock: 48,
    reorderPoint: 15,
    price: 2500,
    supplier: 'Geely Parts East',
    isFeatured: true,
    displayOrder: 1,
  },
  {
    name: 'Air Filter',
    sku: 'GE-AF-002',
    category: 'filters',
    description: 'High-efficiency air filter that protects your engine and improves performance. Replace every 15,000 km.',
    stock: 67,
    reorderPoint: 20,
    price: 1200,
    supplier: 'Geely Parts East',
    isFeatured: true,
    displayOrder: 2,
  },
  {
    name: 'Oil Filter',
    sku: 'GE-OF-003',
    category: 'filters',
    description: 'Premium oil filter designed to keep your engine oil clean and extend engine life.',
    stock: 80,
    reorderPoint: 20,
    price: 850,
    supplier: 'Geely Parts East',
    isFeatured: true,
    displayOrder: 3,
  },
  {
    name: 'Engine Oil (5W-30)',
    sku: 'GE-EO-005',
    category: 'fluids',
    description: 'Fully synthetic engine oil (4L) specially formulated for Geely engines. Provides excellent protection in all climates.',
    stock: 120,
    reorderPoint: 30,
    price: 3200,
    supplier: 'Geely Parts East',
    isFeatured: true,
    displayOrder: 4,
  },
  {
    name: 'Headlight Assembly (LED)',
    sku: 'GE-HL-004-L',
    category: 'lighting',
    description: 'Complete LED headlight assembly with daytime running lights. Professional installation recommended.',
    stock: 5,
    reorderPoint: 8,
    price: 8900,
    supplier: 'OEM Supply Co',
    isFeatured: false,
    displayOrder: 5,
  },
  {
    name: 'Battery (12V 60Ah)',
    sku: 'GE-BAT-009',
    category: 'electrical',
    description: 'Maintenance-free 12V battery with 60Ah capacity. Includes 2-year warranty and free installation.',
    stock: 9,
    reorderPoint: 10,
    price: 4500,
    supplier: 'AutoCare Supply',
    isFeatured: false,
    displayOrder: 6,
  },
];

async function main() {
  // Parts page content (single record)
  const existingContent = await prisma.partsPageContent.findFirst();
  if (existingContent) {
    await prisma.partsPageContent.update({ where: { id: existingContent.id }, data: content });
  } else {
    await prisma.partsPageContent.create({ data: content });
  }

  // Categories (upsert by slug)
  for (const cat of categories) {
    await prisma.partCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // Brands (idempotent by name)
  for (const b of brands) {
    const existing = await prisma.partBrand.findFirst({ where: { name: b.name } });
    if (existing) {
      await prisma.partBrand.update({ where: { id: existing.id }, data: b });
    } else {
      await prisma.partBrand.create({ data: b });
    }
  }

  // Benefits (idempotent by title)
  for (const b of benefits) {
    const existing = await prisma.partBenefit.findFirst({ where: { title: b.title } });
    if (existing) {
      await prisma.partBenefit.update({ where: { id: existing.id }, data: b });
    } else {
      await prisma.partBenefit.create({ data: b });
    }
  }

  // Spare parts (upsert by sku, link category via slug)
  for (const p of parts) {
    const categorySlug = mapCategorySlug(p.category);
    const partCategory = await prisma.partCategory.findUnique({ where: { slug: categorySlug } });
    await prisma.sparePart.upsert({
      where: { sku: p.sku },
      update: {
        ...p,
        partCategoryId: partCategory?.id || null,
      },
      create: {
        ...p,
        partCategoryId: partCategory?.id || null,
      },
    });
  }

  console.log('Parts seed complete.');
}

function mapCategorySlug(category: string): string {
  const map: Record<string, string> = {
    engine: 'engine-parts',
    brakes: 'brakes-suspension',
    electrical: 'electrical',
    filters: 'filters',
    fluids: 'fluids-oils',
    body: 'body-parts',
    interior: 'interior',
    lighting: 'lighting',
    accessories: 'interior',
  };
  return map[category] || 'engine-parts';
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());