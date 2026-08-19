import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedElectricSimple() {
  console.log('🌱 Seeding electric vehicle data...');

  try {
    // Ensure Electric category exists
    const electricCategory = await prisma.vehicleCategory.upsert({
      where: { slug: 'electric' },
      update: {},
      create: {
        name: 'Electric Vehicles',
        slug: 'electric',
        description: 'Zero-emission electric vehicles with advanced technology',
        isActive: true,
        displayOrder: 1
      }
    });
    console.log('✅ Electric category ensured');

    // Create/update Geometry EX5
    const geometryEX5 = await prisma.vehicle.upsert({
      where: { slug: 'geometry-ex5' },
      update: {},
      create: {
        name: 'Geometry EX5',
        slug: 'geometry-ex5',
        model: 'EX5',
        year: 2024,
        category: 'Electric',
        description: 'Premium electric SUV with 530km range, advanced safety features, and intelligent technology. Perfect for Ethiopian roads with zero emissions and lower running costs.',
        status: 'published',
        isActive: true,
        isFeatured: true,
        badge: 'AVAILABLE',
        basePrice: 6100000,
        finalPrice: 6100000,
        displayOrder: 1,
        stock: 5,
        images: [
          'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&h=600&fit=crop'
        ],
        specifications: {
          engine: {
            type: 'Permanent Magnet Synchronous Motor',
            power: '150 kW (204 HP)',
            torque: '310 Nm',
            drivetrain: 'Front-wheel Drive'
          },
          battery: {
            capacity: '61.9 kWh',
            type: 'Lithium-ion NCM',
            warranty: '8 years / 150,000 km',
            chargingTime: {
              ac7kw: '6.5 hours (10-100%)',
              dc50kw: '30 minutes (30-80%)',
              standardOutlet: '8-10 hours'
            }
          },
          performance: {
            range: '530 km (NEDC)',
            acceleration: '8.8 seconds',
            topSpeed: '150 km/h',
            consumption: '11.7 kWh/100km'
          },
          dimensions: {
            length: '4432 mm',
            width: '1833 mm', 
            height: '1560 mm',
            wheelbase: '2700 mm',
            groundClearance: '180 mm',
            bootSpace: '330L'
          },
          safety: {
            rating: '5-star C-NCAP',
            features: [
              'Automatic Emergency Braking',
              'Lane Departure Warning', 
              'Blind Spot Monitoring',
              'Rear Cross Traffic Alert',
              '360-degree Camera System',
              'Tire Pressure Monitoring'
            ]
          },
          technology: {
            infotainment: '12.3-inch touchscreen',
            connectivity: ['Apple CarPlay', 'Android Auto', 'WiFi Hotspot'],
            driver: [
              'Digital Instrument Cluster',
              'Head-Up Display',
              'Wireless Phone Charging',
              'Smart Key System'
            ]
          },
          comfort: {
            seating: '5 seats with premium materials',
            climate: 'Automatic dual-zone climate control',
            features: [
              'Heated Front Seats',
              'Electric Seat Adjustment',
              'Panoramic Sunroof', 
              'Premium Audio System'
            ]
          }
        }
      }
    });
    console.log('✅ Geometry EX5 created');

    // Create Geometry C11
    const geometryC11 = await prisma.vehicle.upsert({
      where: { slug: 'geometry-c11' },
      update: {},
      create: {
        name: 'Geometry C11',
        slug: 'geometry-c11',
        model: 'C11',
        year: 2024,
        category: 'Electric',
        description: 'Luxury electric SUV with 620km range, dual motors, and premium features. All-wheel drive system provides superior traction and performance.',
        status: 'published',
        isActive: true,
        isFeatured: false,
        badge: 'LUXURY',
        basePrice: 7500000,
        finalPrice: 7200000,
        discountAmount: 300000,
        displayOrder: 2,
        stock: 2,
        images: [
          'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
        ],
        specifications: {
          engine: {
            type: 'Dual Motor Setup',
            power: '272 kW (370 HP)',
            torque: '543 Nm',
            drivetrain: 'All-wheel Drive'
          },
          battery: {
            capacity: '85 kWh',
            type: 'Lithium-ion NCM',
            warranty: '8 years / 150,000 km',
            chargingTime: {
              ac11kw: '7 hours (10-100%)',
              dc100kw: '28 minutes (30-80%)',
              standardOutlet: '12-14 hours'
            }
          },
          performance: {
            range: '620 km (NEDC)',
            acceleration: '5.9 seconds',
            topSpeed: '180 km/h',
            consumption: '13.2 kWh/100km'
          },
          dimensions: {
            length: '4750 mm',
            width: '1804 mm',
            height: '1651 mm',
            wheelbase: '2800 mm',
            groundClearance: '200 mm',
            bootSpace: '516L'
          }
        }
      }
    });
    console.log('✅ Geometry C11 created');

    // Create Geometry A (Coming Soon)
    const geometryA = await prisma.vehicle.upsert({
      where: { slug: 'geometry-a' },
      update: {},
      create: {
        name: 'Geometry A',
        slug: 'geometry-a',
        model: 'A',
        year: 2025,
        category: 'Electric',
        description: 'Compact electric sedan for urban efficiency. 420km range with fast charging capabilities, perfect for city commuting and daily driving.',
        status: 'published',
        isActive: true,
        isFeatured: false,
        badge: 'COMING SOON',
        basePrice: 4800000,
        finalPrice: 4800000,
        displayOrder: 3,
        stock: 0,
        images: [
          'https://images.unsplash.com/photo-1549399736-849206e3b12e?w=800&h=600&fit=crop'
        ],
        specifications: {
          engine: {
            type: 'Permanent Magnet Synchronous Motor',
            power: '120 kW (163 HP)',
            torque: '250 Nm',
            drivetrain: 'Front-wheel Drive'
          },
          battery: {
            capacity: '50 kWh',
            type: 'Lithium Iron Phosphate',
            warranty: '8 years / 150,000 km',
            chargingTime: {
              ac7kw: '5.5 hours (10-100%)',
              dc50kw: '35 minutes (30-80%)',
              standardOutlet: '7-8 hours'
            }
          },
          performance: {
            range: '420 km (NEDC)',
            acceleration: '9.2 seconds',
            topSpeed: '140 km/h',
            consumption: '11.9 kWh/100km'
          }
        }
      }
    });
    console.log('✅ Geometry A created');

    console.log('🎉 Electric vehicle seeding complete!');
    console.log(`
    ✅ Electric category ensured
    ✅ Geometry EX5 - Premium SUV (530km range) - ETB 6,100,000
    ✅ Geometry C11 - Luxury SUV (620km range) - ETB 7,200,000  
    ✅ Geometry A - Compact sedan (420km range) - ETB 4,800,000
    `);

  } catch (error) {
    console.error('❌ Error seeding electric vehicles:', error);
    throw error;
  }
}

seedElectricSimple()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });