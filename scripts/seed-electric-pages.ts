import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedElectricPages() {
  console.log('🌱 Seeding electric pages and charging stations...');

  // Check if pages already exist
  const existingPages = await prisma.electricPage.count();
  if (existingPages > 0) {
    console.log('✅ Electric pages already exist. Skipping seed.');
    return;
  }

  // Create Charging Map page
  const chargingMapPage = await prisma.electricPage.create({
    data: {
      title: 'Charging Station Network',
      slug: 'charging',
      pageType: 'charging-map',
      heroTitle: 'Find Charging Stations Near You',
      heroSubtitle: 'NATIONWIDE CHARGING NETWORK',
      heroImage: '',
      content: 'Discover our growing network of charging stations across Ethiopia. Whether you\'re in Addis Ababa or planning a road trip, we\'ve got you covered with convenient charging solutions.',
      isPublished: true,
      displayOrder: 1,
    },
  });
  console.log('✅ Created: Charging Station Network');

  // Create Home Charging page
  const homeChargingPage = await prisma.electricPage.create({
    data: {
      title: 'Home Charging Solutions',
      slug: 'home-charging',
      pageType: 'home-charging',
      heroTitle: 'Charge at Home, Wake Up Ready',
      heroSubtitle: 'HOME CHARGING INSTALLATION',
      heroImage: '',
      content: 'Install a dedicated home charging station and enjoy the convenience of overnight charging. Our professional installation service ensures safe, efficient charging right at your doorstep. Wake up every morning with a full battery, ready for the day ahead.',
      isPublished: true,
      displayOrder: 2,
    },
  });
  console.log('✅ Created: Home Charging Solutions');

  // Create Fast Charging page
  const fastChargingPage = await prisma.electricPage.create({
    data: {
      title: 'Fast Charging Network',
      slug: 'fast-charging',
      pageType: 'fast-charging',
      heroTitle: 'Ultra-Fast Charging On The Go',
      heroSubtitle: 'DC FAST CHARGING',
      heroImage: '',
      content: 'Our fast charging network features state-of-the-art DC fast chargers capable of delivering up to 150kW of power. Charge from 20% to 80% in just 30 minutes - perfect for quick stops during your journey. Located at strategic points along major highways and in city centers.',
      isPublished: true,
      displayOrder: 3,
    },
  });
  console.log('✅ Created: Fast Charging Network');

  // Create sample charging stations for the Charging Map
  await prisma.chargingStation.createMany({
    data: [
      {
        name: 'Bole International Airport',
        address: 'Bole Road, Near Terminal',
        city: 'Addis Ababa',
        latitude: 8.9806,
        longitude: 38.7991,
        stationType: 'fast-dc',
        chargerCount: 4,
        maxPower: '150kW',
        connector: ['CCS2', 'CHAdeMO'],
        availability: 'operational',
        pricing: 'ETB 25 per kWh',
        hours: '24/7',
        amenities: ['WiFi', 'Cafe', 'Restrooms', 'Parking'],
        images: [],
        electricPageId: chargingMapPage.id,
        isActive: true,
      },
      {
        name: 'Meskel Square Station',
        address: 'Meskel Square',
        city: 'Addis Ababa',
        latitude: 9.0131,
        longitude: 38.7621,
        stationType: 'fast-dc',
        chargerCount: 2,
        maxPower: '100kW',
        connector: ['CCS2'],
        availability: 'operational',
        pricing: 'ETB 22 per kWh',
        hours: '6:00 AM - 10:00 PM',
        amenities: ['Security', 'Parking'],
        images: [],
        electricPageId: chargingMapPage.id,
        isActive: true,
      },
      {
        name: 'Edna Mall Charging Hub',
        address: 'Edna Mall, 2nd Floor Parking',
        city: 'Addis Ababa',
        latitude: 9.0164,
        longitude: 38.7914,
        stationType: 'level-2',
        chargerCount: 6,
        maxPower: '22kW',
        connector: ['Type 2'],
        availability: 'operational',
        pricing: 'ETB 15 per kWh',
        hours: '9:00 AM - 9:00 PM',
        amenities: ['Shopping', 'Cinema', 'Restaurants', 'WiFi'],
        images: [],
        electricPageId: chargingMapPage.id,
        isActive: true,
      },
      {
        name: 'Dire Dawa Station',
        address: 'Main Highway, Near Shell Station',
        city: 'Dire Dawa',
        latitude: 9.5930,
        longitude: 41.8662,
        stationType: 'fast-dc',
        chargerCount: 2,
        maxPower: '120kW',
        connector: ['CCS2', 'CHAdeMO'],
        availability: 'operational',
        pricing: 'ETB 24 per kWh',
        hours: '24/7',
        amenities: ['Restrooms', 'Snacks', 'Parking'],
        images: [],
        electricPageId: chargingMapPage.id,
        isActive: true,
      },
    ],
  });
  console.log('✅ Created: Sample charging stations');

  console.log('\n🎉 Electric pages seeded successfully!');
  console.log('\n📍 Available pages:');
  console.log('   - /electric/charging (Charging Map)');
  console.log('   - /electric/home-charging (Home Charging)');
  console.log('   - /electric/fast-charging (Fast Charging)');
}

seedElectricPages()
  .catch((error) => {
    console.error('❌ Error seeding electric pages:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
