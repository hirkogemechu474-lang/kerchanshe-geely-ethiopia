const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickSeedServices() {
  console.log('🌱 Quick seeding services...');

  try {
    // Clear existing data
    await prisma.servicePage.deleteMany();
    await prisma.serviceItem.deleteMany();
    await prisma.serviceSection.deleteMany();

    // Create sections
    const salesSection = await prisma.serviceSection.create({
      data: {
        title: 'Sales',
        slug: 'sales',
        description: 'Vehicle sales and purchase services',
        isActive: true,
        displayOrder: 1,
      },
    });

    const servicePartsSection = await prisma.serviceSection.create({
      data: {
        title: 'Service & Parts',
        slug: 'service-parts',
        description: 'After-sales service and genuine parts',
        isActive: true,
        displayOrder: 2,
      },
    });

    // Create items for Sales
    const testDriveItem = await prisma.serviceItem.create({
      data: {
        sectionId: salesSection.id,
        title: 'Test Drive',
        description: 'Book a test drive today',
        icon: 'Car',
        url: '/services/test-drive',
        isActive: true,
        isFeatured: true,
        displayOrder: 1,
      },
    });

    const getQuoteItem = await prisma.serviceItem.create({
      data: {
        sectionId: salesSection.id,
        title: 'Get Quote',
        description: 'Personalized pricing',
        icon: 'Calculator',
        url: '/services/get-quote',
        isActive: true,
        displayOrder: 2,
      },
    });

    // Create items for Service & Parts
    const serviceBookingItem = await prisma.serviceItem.create({
      data: {
        sectionId: servicePartsSection.id,
        title: 'Service Booking',
        description: 'Schedule maintenance',
        icon: 'Calendar',
        url: '/services/service-booking',
        isActive: true,
        isFeatured: true,
        displayOrder: 1,
      },
    });

    const sparePartsItem = await prisma.serviceItem.create({
      data: {
        sectionId: servicePartsSection.id,
        title: 'Spare Parts',
        description: 'Genuine Geely parts',
        icon: 'Package',
        url: '/parts',
        isActive: true,
        displayOrder: 2,
      },
    });

    // Create pages (these are needed for the API to show items)
    await prisma.servicePage.create({
      data: {
        title: 'Book a Test Drive',
        slug: 'test-drive',
        excerpt: 'Experience Geely excellence firsthand',
        content: '<h1>Book Your Test Drive</h1><p>Experience our vehicles firsthand.</p>',
        isPublished: true,
      },
    });

    await prisma.servicePage.create({
      data: {
        title: 'Get Your Quote',
        slug: 'get-quote',
        excerpt: 'Transparent pricing',
        content: '<h1>Get Your Quote</h1><p>Receive personalized pricing.</p>',
        isPublished: true,
      },
    });

    await prisma.servicePage.create({
      data: {
        title: 'Service Booking',
        slug: 'service-booking',
        excerpt: 'Expert care for your Geely',
        content: '<h1>Book Service</h1><p>Professional maintenance services.</p>',
        isPublished: true,
      },
    });

    await prisma.servicePage.create({
      data: {
        title: 'Spare Parts',
        slug: 'spare-parts',
        excerpt: 'Genuine parts',
        content: '<h1>Genuine Parts</h1><p>Quality parts for your vehicle.</p>',
        isPublished: true,
      },
    });

    console.log('✅ Services seeded successfully!');
    console.log('- 2 sections created');
    console.log('- 4 menu items created');
    console.log('- 4 pages created (all published)');
    
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickSeedServices();