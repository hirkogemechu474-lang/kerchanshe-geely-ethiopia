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

  // 1. Create Hero Section
  const heroPage = await prisma.electricPage.create({
    data: {
      title: 'Electric Hero Section',
      slug: 'hero',
      pageType: 'custom',
      heroTitle: 'Electric Vehicles by Geely',
      heroSubtitle: 'THE FUTURE OF MOBILITY',
      heroImage: '',
      content: 'Experience the future of driving with Geely\'s advanced electric vehicles. Zero emissions, lower running costs, and cutting-edge technology for Ethiopian roads.',
      metadata: {
        ctaButtonText: 'Explore Our Electric Vehicles',
        ctaButtonLink: '/models/geometry-ex5',
        ctaSecondaryButtonText: 'Book Test Drive',
        ctaSecondaryButtonLink: '/test-drive',
        backgroundGradient: 'from-green-600 via-green-500 to-blue-500',
      },
      isPublished: true,
      displayOrder: 0,
    },
  });
  console.log('✅ Created: Electric Hero Section');

  // 2. Create Charging Map page
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

  // 3. Create Home Charging page
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

  // 4. Create Fast Charging page
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

  // 5. Create Cost Calculator page
  const costCalculatorPage = await prisma.electricPage.create({
    data: {
      title: 'Cost Calculator',
      slug: 'cost-calculator',
      pageType: 'custom',
      heroTitle: 'Calculate Your Savings',
      heroSubtitle: 'DISCOVER HOW MUCH YOU\'LL SAVE',
      heroImage: '',
      content: 'Use our interactive cost calculator to see how much you can save by switching to an electric Geometry EX5 compared to a traditional petrol vehicle.',
      metadata: {
        type: 'benefits',
      },
      isPublished: true,
      displayOrder: 10,
    },
  });
  console.log('✅ Created: Cost Calculator Page');

  // 6. Create Government Incentives page
  const incentivesPage = await prisma.electricPage.create({
    data: {
      title: 'Government Incentives',
      slug: 'government-incentives',
      pageType: 'custom',
      heroTitle: 'Government Incentives & Support',
      heroSubtitle: 'TAX BENEFITS AND SUBSIDIES',
      heroImage: '',
      content: 'Learn about government incentives and support available for electric vehicle owners in Ethiopia, including tax benefits, reduced registration fees, and priority parking.',
      metadata: {
        type: 'benefits',
      },
      isPublished: true,
      displayOrder: 11,
    },
  });
  console.log('✅ Created: Government Incentives Page');

  // 7. Create Environmental Impact page
  const impactPage = await prisma.electricPage.create({
    data: {
      title: 'Environmental Impact',
      slug: 'environmental-impact',
      pageType: 'custom',
      heroTitle: 'Reduce Your Carbon Footprint',
      heroSubtitle: 'ENVIRONMENTAL BENEFITS',
      heroImage: '',
      content: 'Discover the environmental benefits of driving electric. Learn how a Geometry EX5 can reduce emissions and contribute to a cleaner Ethiopia.',
      metadata: {
        type: 'benefits',
      },
      isPublished: true,
      displayOrder: 12,
    },
  });
  console.log('✅ Created: Environmental Impact Page');

  // 8. Create sample charging stations
  const stations = [
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
    },
    {
      name: 'Geely Service Center - Addis Ababa',
      address: '123 Bole Road, Geely Center',
      city: 'Addis Ababa',
      latitude: 8.9750,
      longitude: 38.8050,
      stationType: 'level-2',
      chargerCount: 3,
      maxPower: '22kW',
      connector: ['Type 2', 'CCS2'],
      availability: 'operational',
      pricing: 'ETB 18 per kWh (customers: free)',
      hours: '7:00 AM - 7:00 PM',
      amenities: ['Service Center', 'Cafe', 'WiFi', 'Waiting Room'],
    },
  ];

  // Create charging stations and link to charging map page
  for (const station of stations) {
    await prisma.chargingStation.create({
      data: {
        ...station,
        images: [],
        electricPageId: chargingMapPage.id,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created: ${stations.length} charging stations`);

  console.log('\n🎉 Electric pages and charging stations seeded successfully!');
  console.log('\n📍 Available electric pages:');
  console.log('   - /electric (Main page with hero from database)');
  console.log('   - /electric/charging (Charging Map with stations)');
  console.log('   - /electric/home-charging (Home Charging)');
  console.log('   - /electric/fast-charging (Fast Charging)');
  console.log('   - /electric/benefits/cost-calculator (Cost Calculator)');
  console.log('   - /electric/benefits/government-incentives (Government Incentives)');
  console.log('   - /electric/benefits/environmental-impact (Environmental Impact)');
  console.log('\n🔧 Admin pages:');
  console.log('   - /admin/electric (Management Hub)');
  console.log('   - /admin/electric/hero (Edit Hero Section)');
  console.log('   - /admin/electric/stations (Manage Charging Stations)');
  console.log('   - /admin/electric/benefits/cost-calculator');
  console.log('   - /admin/electric/benefits/government-incentives');
  console.log('   - /admin/electric/benefits/environmental-impact');
}

seedElectricPages()
  .catch((error) => {
    console.error('❌ Error seeding electric pages:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
