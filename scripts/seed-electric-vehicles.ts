import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedElectricVehicles() {
  console.log('🔋 Seeding electric vehicles...');

  try {
    // Get or create Electric category
    let electricCategory = await prisma.vehicleCategory.findFirst({
      where: { slug: 'electric' },
    });

    if (!electricCategory) {
      electricCategory = await prisma.vehicleCategory.create({
        data: {
          name: 'Electric',
          slug: 'electric',
          description: 'Zero emissions, advanced technology, and lower running costs',
          imageUrl: '/images/categories/electric.jpg',
          iconUrl: '/images/icons/electric.svg',
          heroImageUrl: '/images/hero/electric-hero.jpg',
          metaTitle: 'Electric Vehicles | Geely Ethiopia',
          metaDescription: 'Explore Geely electric vehicles in Ethiopia. Zero emissions, lower running costs, cutting-edge technology.',
          isActive: true,
          displayOrder: 1,
        },
      });
      console.log('✅ Created Electric category');
    } else {
      console.log('✅ Electric category already exists');
    }

    // Check if Geometry EX5 already exists
    const existingEV = await prisma.vehicle.findFirst({
      where: { slug: 'geometry-ex5' },
    });

    if (existingEV) {
      console.log('✅ Electric vehicles already exist. Skipping seed.');
      return;
    }

    // Create Geometry EX5
    const geometryEX5 = await prisma.vehicle.create({
      data: {
        name: 'Geometry EX5',
        slug: 'geometry-ex5',
        model: 'EX5',
        year: 2024,
        category: 'Electric',
        categoryId: electricCategory.id,
        description: 'Premium electric SUV with 520km range. Advanced technology, spacious interior, and zero emissions for Ethiopian roads.',
        images: [
          '/images/vehicles/geometry-ex5-1.jpg',
          '/images/vehicles/geometry-ex5-2.jpg',
          '/images/vehicles/geometry-ex5-3.jpg',
        ],
        specifications: {
          overview: {
            type: 'Electric SUV',
            seats: 5,
            doors: 5,
            transmission: 'Single-Speed Automatic',
            driveType: 'FWD',
          },
          engine: {
            type: 'Permanent Magnet Synchronous Motor',
            power: '160 kW (218 HP)',
            torque: '310 Nm',
          },
          battery: {
            type: 'Lithium-ion',
            capacity: '61.5 kWh',
            voltage: '400V',
            warranty: '8 years / 150,000 km',
          },
          performance: {
            range: '520 km (NEDC)',
            acceleration: '8.5 seconds',
            topSpeed: '150 km/h',
            energyConsumption: '11.8 kWh/100km',
          },
          charging: {
            acCharging: '6.6 kW (10 hours)',
            dcFastCharging: '80 kW (30 min to 80%)',
            homeCharging: '220V (8-10 hours)',
          },
          dimensions: {
            length: '4615 mm',
            width: '1880 mm',
            height: '1650 mm',
            wheelbase: '2750 mm',
            groundClearance: '180 mm',
            curbWeight: '1790 kg',
            bootCapacity: '450 liters',
          },
          exterior: [
            'LED Headlights',
            'LED Daytime Running Lights',
            'LED Tail Lights',
            '18-inch Alloy Wheels',
            'Panoramic Sunroof',
            'Power Tailgate',
            'Roof Rails',
          ],
          interior: [
            '10.25" Digital Instrument Cluster',
            '12.3" Touchscreen Infotainment',
            'Wireless Apple CarPlay & Android Auto',
            'Premium Leather Seats',
            'Heated Front Seats',
            'Dual-Zone Climate Control',
            'Wireless Phone Charging',
            '8-Speaker Sound System',
          ],
          safety: [
            'ABS with EBD',
            '6 Airbags',
            'Electronic Stability Control',
            'Hill Start Assist',
            'Traction Control',
            '360° Camera',
            'Parking Sensors (Front & Rear)',
            'Blind Spot Monitoring',
            'Lane Departure Warning',
            'Automatic Emergency Braking',
          ],
          technology: [
            'Regenerative Braking',
            'Multiple Driving Modes (Eco, Normal, Sport)',
            'One-Pedal Driving Mode',
            'Battery Pre-conditioning',
            'Mobile App Remote Control',
            'Over-the-Air Updates',
            'Voice Control',
          ],
        },
        basePrice: 6100000,
        discountAmount: null,
        discountType: null,
        badge: 'NEW',
        taxRate: 15,
        finalPrice: 6100000,
        stock: 5,
        sku: 'GEO-EX5-2024',
        reorderPoint: 2,
        warehouse: 'Addis Ababa Main',
        location: 'Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 1,
      },
    });

    console.log('✅ Created: Geometry EX5');

    // You can add more electric vehicles here in the future
    // Example: Geely Galaxy E8, Zeekr models, etc.

    console.log('\n🎉 Electric vehicles seeded successfully!');
    console.log('\n📍 Available at:');
    console.log('   - http://localhost:3000/electric');
    console.log('   - http://localhost:3000/category/electric');
    console.log('   - http://localhost:3000/models/geometry-ex5');
    
  } catch (error) {
    console.error('❌ Error seeding electric vehicles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedElectricVehicles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
