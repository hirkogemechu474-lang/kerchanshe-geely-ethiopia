import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying seed data...\n');

  try {
    const promotions = await prisma.promotion.count();
    const reviews = await prisma.review.count();
    const news = await prisma.newsArticle.count();
    const heroes = await prisma.heroSection.count();
    const dealers = await prisma.dealer.count();
    const brands = await prisma.vehicleBrand.count();
    const categories = await prisma.vehicleCategory.count();
    const vehicles = await prisma.vehicle.count();

    console.log('📊 Database Record Counts:');
    console.log(`  🎁 Promotions: ${promotions}`);
    console.log(`  ⭐ Reviews: ${reviews}`);
    console.log(`  📰 News Articles: ${news}`);
    console.log(`  🎬 Hero Sections: ${heroes}`);
    console.log(`  🏢 Dealers: ${dealers}`);
    console.log(`  🏷️  Brands: ${brands}`);
    console.log(`  📁 Categories: ${categories}`);
    console.log(`  🚗 Vehicles: ${vehicles}\n`);

    if (vehicles > 0) {
      console.log('🚗 Vehicle Details:');
      const vehicleList = await prisma.vehicle.findMany({
        select: {
          name: true,
          category: true,
          basePrice: true,
          finalPrice: true,
          stock: true,
          isFeatured: true,
          status: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });

      vehicleList.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.name} (${v.category})`);
        console.log(`     Price: ${v.finalPrice?.toLocaleString()} ETB | Stock: ${v.stock}`);
        console.log(`     Featured: ${v.isFeatured ? 'Yes' : 'No'} | Status: ${v.status}`);
      });
      console.log('');
    }

    console.log('✅ Verification complete!');
    
    if (promotions === 0 && vehicles === 0) {
      console.log('\n⚠️  No data found. Run: npm run seed\n');
    }
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
