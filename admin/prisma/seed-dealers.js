const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding dealers...');

  // Sample dealers data
  const dealers = [
    {
      name: 'Geely Addis Ababa Showroom',
      type: 'both',
      city: 'Addis Ababa',
      region: 'Addis Ababa',
      address: {
        street: 'Bole Road',
        area: 'Bole',
        city: 'Addis Ababa',
        region: 'Addis Ababa',
        country: 'Ethiopia',
        postalCode: '1000',
      },
      latitude: 9.0054,
      longitude: 38.7636,
      contact: {
        phone: '+251 11 123 4567',
        email: 'addis@geelyethiopia.com',
        whatsapp: '+251911234567',
      },
      services: [
        'New Vehicle Sales',
        'Test Drives',
        'Vehicle Servicing',
        'Spare Parts',
        'Body Shop',
        'Warranty Repairs',
        'Financing Assistance',
      ],
      workingHours: {
        weekdays: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 5:00 PM',
        sunday: '10:00 AM - 2:00 PM',
      },
      facilities: {
        showroom: true,
        serviceCenter: true,
        partsShop: true,
        testDriveArea: true,
        customerLounge: true,
        parking: '20+ vehicles',
      },
      active: true,
      featured: true,
      salesCount: 150,
      staffCount: 25,
      rating: 4.8,
    },
    {
      name: 'Geely Bahir Dar Service Center',
      type: 'service',
      city: 'Bahir Dar',
      region: 'Amhara',
      address: {
        street: 'Near Tana Hotel',
        area: 'Kebele 03',
        city: 'Bahir Dar',
        region: 'Amhara',
        country: 'Ethiopia',
        postalCode: '2000',
      },
      latitude: 11.5933,
      longitude: 37.3905,
      contact: {
        phone: '+251 58 220 1234',
        email: 'bahirdar@geelyethiopia.com',
        whatsapp: '+251912345678',
      },
      services: [
        'Vehicle Servicing',
        'Spare Parts',
        'Oil Change',
        'Tire Services',
        'Battery Replacement',
        'Warranty Repairs',
      ],
      workingHours: {
        weekdays: '8:30 AM - 5:30 PM',
        saturday: '9:00 AM - 3:00 PM',
        sunday: 'Closed',
      },
      facilities: {
        showroom: false,
        serviceCenter: true,
        partsShop: true,
        testDriveArea: false,
        customerLounge: true,
        parking: '15 vehicles',
      },
      active: true,
      featured: false,
      salesCount: 0,
      staffCount: 12,
      rating: 4.5,
    },
    {
      name: 'Geely Hawassa Showroom',
      type: 'showroom',
      city: 'Hawassa',
      region: 'SNNPR',
      address: {
        street: 'Main Road',
        area: 'Piassa',
        city: 'Hawassa',
        region: 'SNNPR',
        country: 'Ethiopia',
        postalCode: '3000',
      },
      latitude: 7.0621,
      longitude: 38.4764,
      contact: {
        phone: '+251 46 220 5678',
        email: 'hawassa@geelyethiopia.com',
        whatsapp: '+251913456789',
      },
      services: [
        'New Vehicle Sales',
        'Test Drives',
        'Financing Assistance',
        'Trade-In Services',
        'Vehicle Registration',
      ],
      workingHours: {
        weekdays: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 4:00 PM',
        sunday: 'Closed',
      },
      facilities: {
        showroom: true,
        serviceCenter: false,
        partsShop: false,
        testDriveArea: true,
        customerLounge: true,
        parking: '12 vehicles',
      },
      active: true,
      featured: false,
      salesCount: 85,
      staffCount: 10,
      rating: 4.6,
    },
    {
      name: 'Geely Mekelle Service & Sales',
      type: 'both',
      city: 'Mekelle',
      region: 'Tigray',
      address: {
        street: 'Airport Road',
        area: 'Ayder',
        city: 'Mekelle',
        region: 'Tigray',
        country: 'Ethiopia',
        postalCode: '4000',
      },
      latitude: 13.4967,
      longitude: 39.4753,
      contact: {
        phone: '+251 34 440 1234',
        email: 'mekelle@geelyethiopia.com',
        whatsapp: '+251914567890',
      },
      services: [
        'New Vehicle Sales',
        'Test Drives',
        'Vehicle Servicing',
        'Spare Parts',
        'Warranty Repairs',
        'Financing Assistance',
      ],
      workingHours: {
        weekdays: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 5:00 PM',
        sunday: '10:00 AM - 2:00 PM',
      },
      facilities: {
        showroom: true,
        serviceCenter: true,
        partsShop: true,
        testDriveArea: true,
        customerLounge: true,
        parking: '18 vehicles',
      },
      active: true,
      featured: true,
      salesCount: 120,
      staffCount: 20,
      rating: 4.7,
    },
    {
      name: 'Geely Dire Dawa Showroom',
      type: 'showroom',
      city: 'Dire Dawa',
      region: 'Dire Dawa',
      address: {
        street: 'Addis Ketema',
        area: 'Kezira',
        city: 'Dire Dawa',
        region: 'Dire Dawa',
        country: 'Ethiopia',
        postalCode: '5000',
      },
      latitude: 9.5930,
      longitude: 41.8668,
      contact: {
        phone: '+251 25 111 2345',
        email: 'diredawa@geelyethiopia.com',
        whatsapp: '+251915678901',
      },
      services: [
        'New Vehicle Sales',
        'Test Drives',
        'Financing Assistance',
        'Vehicle Registration',
        'Trade-In Services',
      ],
      workingHours: {
        weekdays: '8:00 AM - 5:30 PM',
        saturday: '9:00 AM - 3:00 PM',
        sunday: 'Closed',
      },
      facilities: {
        showroom: true,
        serviceCenter: false,
        partsShop: false,
        testDriveArea: true,
        customerLounge: true,
        parking: '10 vehicles',
      },
      active: true,
      featured: false,
      salesCount: 65,
      staffCount: 8,
      rating: 4.4,
    },
  ];

  // Create dealers
  for (const dealer of dealers) {
    const created = await prisma.dealer.create({
      data: dealer,
    });
    console.log(`✅ Created dealer: ${created.name}`);
  }

  console.log('🎉 Dealers seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding dealers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
