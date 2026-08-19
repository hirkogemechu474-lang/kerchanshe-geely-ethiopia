import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedHomepageContent() {
  console.log('🌱 Seeding homepage content...');

  // About Section
  const aboutContent = {
    title: 'About Geely Ethiopia',
    description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia, bringing world-class automotive excellence to the Ethiopian market. With over 5 years of experience, we provide comprehensive warranty coverage, nationwide service network, and unwavering commitment to customer satisfaction. Our mission is to make advanced automotive technology accessible to Ethiopian drivers while maintaining the highest standards of quality and service.',
    image: 'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&h=600&fit=crop'
  };

  // Features Section
  const featuresContent = [
    {
      title: 'Advanced Safety',
      description: '5-star safety rating with comprehensive protection including advanced driver assistance systems, collision avoidance technology, lane departure warning, and automatic emergency braking for maximum peace of mind.',
      icon: 'shield',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'
    },
    {
      title: 'Cutting-Edge Technology',
      description: 'Experience the future with smart connectivity features, integrated infotainment systems, smartphone integration, GPS navigation, and intelligent driving assistance that makes every journey effortless.',
      icon: 'cpu',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
    },
    {
      title: 'Exceptional Comfort',
      description: 'Premium interiors crafted with attention to detail, featuring ergonomic design, high-quality materials, advanced climate control, and spacious cabins designed for ultimate comfort on Ethiopian roads.',
      icon: 'star',
      image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=400&h=300&fit=crop'
    },
    {
      title: 'Competitive Value',
      description: 'Exceptional value proposition with transparent pricing, flexible financing options, comprehensive warranty coverage, and dedicated after-sales support that ensures your investment is protected.',
      icon: 'dollar',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop'
    }
  ];

  // Statistics Section
  const statsContent = [
    { label: 'Vehicles Sold', value: '12,500+' },
    { label: 'Happy Customers', value: '11,000+' },
    { label: 'Service Centers', value: '18+' },
    { label: 'Years of Excellence', value: '6+' }
  ];

  try {
    // Create or update About section
    await prisma.setting.upsert({
      where: { key: 'homepage_about' },
      update: { 
        value: JSON.stringify(aboutContent),
        updatedAt: new Date()
      },
      create: {
        key: 'homepage_about',
        value: JSON.stringify(aboutContent),
        type: 'general'
      }
    });
    console.log('✅ About section content seeded');

    // Create or update Features section
    await prisma.setting.upsert({
      where: { key: 'homepage_features' },
      update: { 
        value: JSON.stringify(featuresContent),
        updatedAt: new Date()
      },
      create: {
        key: 'homepage_features',
        value: JSON.stringify(featuresContent),
        type: 'general'
      }
    });
    console.log('✅ Features section content seeded');

    // Create or update Statistics section
    await prisma.setting.upsert({
      where: { key: 'homepage_stats' },
      update: { 
        value: JSON.stringify(statsContent),
        updatedAt: new Date()
      },
      create: {
        key: 'homepage_stats',
        value: JSON.stringify(statsContent),
        type: 'general'
      }
    });
    console.log('✅ Statistics section content seeded');

    console.log('🎉 Homepage content seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding homepage content:', error);
    throw error;
  }
}

seedHomepageContent()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });