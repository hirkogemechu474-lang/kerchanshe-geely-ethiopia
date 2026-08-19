import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding vehicle showcases...');

  // Clear existing showcase data
  console.log('🗑️ Clearing existing showcase data...');
  await prisma.vehicleShowcase.deleteMany();
  console.log('✅ Existing data cleared');

  // Create showcase for Geometry EX5
  await prisma.vehicleShowcase.create({
    data: {
      vehicleId: 'geometry-ex5',
      vehicleName: 'Geometry EX5',
      title: 'Explore Every Angle',
      subtitle: 'Experience the Geometry EX5 like never before with our interactive 360° viewer',
      views: [
        {
          angle: '0',
          imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800',
          label: 'Front View'
        },
        {
          angle: '45',
          imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
          label: 'Front Quarter'
        },
        {
          angle: '90',
          imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
          label: 'Side View'
        },
        {
          angle: '135',
          imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
          label: 'Rear Quarter'
        },
        {
          angle: '180',
          imageUrl: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800',
          label: 'Rear View'
        },
        {
          angle: 'charging',
          imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
          label: 'Charging Port'
        },
        {
          angle: 'interior-front',
          imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800',
          label: 'Interior Front'
        },
        {
          angle: 'interior-dashboard',
          imageUrl: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800',
          label: 'Dashboard'
        }
      ],
      ctaText: 'Explore in Detail',
      ctaLink: '/models/geometry-ex5',
      sortOrder: 0,
      isActive: true,
    },
  });

  // Create showcase for Geometry C11
  await prisma.vehicleShowcase.create({
    data: {
      vehicleId: 'geometry-c11',
      vehicleName: 'Geometry C11',
      title: 'Discover Premium Electric',
      subtitle: 'View our luxury electric SUV from all angles and explore its premium interior',
      views: [
        {
          angle: '0',
          imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800',
          label: 'Front View'
        },
        {
          angle: '45',
          imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
          label: 'Front Quarter'
        },
        {
          angle: '90',
          imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
          label: 'Side Profile'
        },
        {
          angle: '180',
          imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
          label: 'Rear Design'
        },
        {
          angle: 'charging',
          imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800',
          label: 'Charging Port'
        },
        {
          angle: 'interior',
          imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
          label: 'Luxury Interior'
        },
        {
          angle: 'dashboard',
          imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
          label: 'Digital Dashboard'
        }
      ],
      ctaText: 'View Full Specifications',
      ctaLink: '/models/geometry-c11',
      sortOrder: 1,
      isActive: true,
    },
  });

  // Create showcase for Geometry A
  await prisma.vehicleShowcase.create({
    data: {
      vehicleId: 'geometry-a',
      vehicleName: 'Geometry A',
      title: 'Urban Electric Elegance',
      subtitle: 'Preview our compact electric sedan built for city commuting and daily driving',
      views: [
        {
          angle: '0',
          imageUrl: 'https://images.unsplash.com/photo-1549399736-849206e3b12e?w=800',
          label: 'Front View'
        },
        {
          angle: '90',
          imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
          label: 'Side Profile'
        },
        {
          angle: '180',
          imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
          label: 'Rear Design'
        },
        {
          angle: 'charging',
          imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
          label: 'Fast Charging'
        },
        {
          angle: 'interior',
          imageUrl: 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800',
          label: 'Modern Cabin'
        }
      ],
      ctaText: 'Discover Electric',
      ctaLink: '/models/geometry-a',
      sortOrder: 2,
      isActive: true,
    },
  });

  console.log('✅ Vehicle showcases created');
  console.log('🎉 Showcase seed complete!');
  console.log('');
  console.log('Created:');
  console.log('- 3 vehicle showcases');
  console.log('- 20 total 360° views');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });