import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedElectricVehicles() {
  console.log('🌱 Seeding comprehensive electric vehicle data...');

  try {
    // First, ensure Electric category exists
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

    // Create brands
    const geelyBrand = await prisma.vehicleBrand.upsert({
      where: { name: 'Geely' },
      update: {},
      create: {
        name: 'Geely',
        slug: 'geely',
        description: 'Global automotive brand with cutting-edge technology',
        isActive: true
      }
    });

    const geometryBrand = await prisma.vehicleBrand.upsert({
      where: { name: 'Geometry' },
      update: {},
      create: {
        name: 'Geometry',
        slug: 'geometry',
        description: 'Geely\'s premium electric vehicle sub-brand',
        isActive: true
      }
    });
    console.log('✅ Brands created');

    // Create comprehensive Geometry EX5 with all details
    const geometryEX5 = await prisma.vehicle.upsert({
      where: { slug: 'geometry-ex5' },
      update: {},
      create: {
        name: 'Geometry EX5',
        slug: 'geometry-ex5',
        model: 'EX5',
        year: 2024,
        category: 'Electric',
        description: 'Premium electric SUV combining advanced technology with exceptional range and comfort. Perfect for Ethiopian roads with intelligent all-wheel drive and cutting-edge safety features.',
        categoryId: electricCategory.id,
        brandId: geometryBrand.id,
        status: 'published',
        isActive: true,
        isFeatured: true,
        badge: 'NEW',
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
        },
        features: [
          'Zero Emissions - Completely electric drivetrain',
          '530km Range - Extended driving capability',
          'Fast Charging - 30min to 80% charge',
          'Smart Connectivity - Advanced infotainment system',
          '5-Star Safety - Comprehensive protection systems',
          'Panoramic Sunroof - Enhanced cabin experience',
          'All-Weather Capable - Suitable for Ethiopian conditions'
        ]
      }
    });
    console.log('✅ Geometry EX5 created with comprehensive specs');

    // Create additional electric vehicle - Geometry C11
    const geometryC11 = await prisma.vehicle.upsert({
      where: { slug: 'geometry-c11' },
      update: {},
      create: {
        name: 'Geometry C11',
        slug: 'geometry-c11',
        model: 'C11',
        year: 2024,
        category: 'Electric',
        description: 'Luxury electric SUV with premium features and extended range. Advanced technology meets refined comfort in this flagship electric vehicle.',
        categoryId: electricCategory.id,
        brandId: geometryBrand.id,
        status: 'published',
        isActive: true,
        isFeatured: false,
        badge: 'LUXURY',
        basePrice: 7500000,
        finalPrice: 7200000,
        discountAmount: 300000,
        displayOrder: 2,
        stock: 3,
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
        },
        features: [
          'All-Wheel Drive - Superior traction and control',
          '620km Range - Extended long-distance capability',
          'Dual Motors - Enhanced performance and efficiency',
          'Premium Interior - Luxury materials and finishes',
          'Air Suspension - Adaptive ride comfort',
          'Large Boot Space - 516L cargo capacity'
        ]
      }
    });
    console.log('✅ Geometry C11 created');

    // Create compact electric - Geometry A (future model)
    const geometryA = await prisma.vehicle.upsert({
      where: { slug: 'geometry-a' },
      update: {},
      create: {
        name: 'Geometry A',
        slug: 'geometry-a',
        model: 'A',
        year: 2025,
        category: 'Electric',
        description: 'Compact electric sedan designed for urban efficiency. Affordable entry into electric mobility with smart features and reliable performance.',
        categoryId: electricCategory.id,
        brandId: geometryBrand.id,
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
          },
          dimensions: {
            length: '4752 mm',
            width: '1804 mm',
            height: '1503 mm',
            wheelbase: '2750 mm',
            groundClearance: '150 mm',
            bootSpace: '430L'
          }
        },
        features: [
          'Urban Efficiency - Perfect for city driving',
          '420km Range - Suitable for daily commuting',
          'Compact Design - Easy parking and maneuvering',
          'Smart Technology - Connected car features',
          'Fast Charging - Quick top-ups during the day',
          'Spacious Interior - Comfortable 5-seat layout'
        ]
      }
    });
    console.log('✅ Geometry A created');

    // Create ElectricPage content for CMS
    const electricPageContent = await prisma.electricPage.upsert({
      where: { slug: 'main-electric' },
      update: {},
      create: {
        title: 'Electric Vehicles by Geely',
        slug: 'main-electric',
        subtitle: 'The Future of Mobility',
        description: 'Experience the future of driving with Geely\'s advanced electric vehicles. Zero emissions, lower running costs, and cutting-edge technology designed for Ethiopian roads.',
        heroImageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=1200&h=600&fit=crop',
        content: `
          <h2>Why Choose Electric?</h2>
          <p>Electric vehicles represent the future of transportation in Ethiopia. With government support, growing charging infrastructure, and proven technology, now is the perfect time to make the switch.</p>
          
          <h3>Environmental Benefits</h3>
          <ul>
            <li>Zero local emissions for cleaner air in Ethiopian cities</li>
            <li>Reduced dependence on imported fossil fuels</li>
            <li>Supports Ethiopia's renewable energy initiatives</li>
          </ul>
          
          <h3>Economic Advantages</h3>
          <ul>
            <li>Lower operating costs - electricity is cheaper than petrol</li>
            <li>Reduced maintenance requirements</li>
            <li>Government incentives and tax benefits</li>
            <li>Stable energy costs compared to volatile fuel prices</li>
          </ul>
        `,
        isActive: true,
        publishedAt: new Date(),
        sortOrder: 1
      }
    });
    console.log('✅ Electric page content created');

    // Create charging stations data
    const chargingStations = [
      {
        name: 'Geely Addis Ababa Service Center',
        location: 'Bole, Addis Ababa',
        type: 'DC Fast Charging',
        power: '50kW',
        isActive: true
      },
      {
        name: 'Skylight Hotel',
        location: 'Piazza, Addis Ababa', 
        type: 'AC Charging',
        power: '22kW',
        isActive: true
      },
      {
        name: 'Millennium Hall',
        location: 'Kazanchis, Addis Ababa',
        type: 'AC Charging', 
        power: '7kW',
        isActive: true
      }
    ];

    for (const station of chargingStations) {
      await prisma.chargingStation.upsert({
        where: { name: station.name },
        update: {},
        create: station
      });
    }
    console.log('✅ Charging stations created');

    console.log('🎉 Comprehensive electric vehicle seeding complete!');
    console.log(`
    Created:
    - ✅ 3 Electric vehicles (EX5, C11, Geometry A)  
    - ✅ Complete specifications and features
    - ✅ High-quality vehicle images
    - ✅ Electric page CMS content
    - ✅ Charging station locations
    - ✅ Proper category and brand setup
    `);

  } catch (error) {
    console.error('❌ Error seeding electric vehicles:', error);
    throw error;
  }
}

seedElectricVehicles()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });