import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding customer reviews...');

  // Clear existing reviews
  console.log('🗑️ Clearing existing reviews...');
  await prisma.review.deleteMany();
  console.log('✅ Existing reviews cleared');

  // Sample reviews
  const reviews = [
    {
      fullName: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      vehicleModel: 'Coolray',
      rating: 5,
      reviewTitle: 'Perfect Family SUV for Addis Ababa',
      reviewMessage: 'I bought the Coolray 6 months ago and it has been fantastic. Great fuel economy, smooth ride, and perfect size for our family. The safety features give me peace of mind when driving with my kids.',
      status: 'approved',
      isFeatured: true,
    },
    {
      fullName: 'Meron Tadesse',
      email: 'meron.t@email.com',
      vehicleModel: 'Emgrand',
      rating: 4,
      reviewTitle: 'Stylish and Reliable Sedan',
      reviewMessage: 'Very happy with my Emgrand. It looks elegant, drives smoothly, and has been very reliable. The interior is comfortable and the technology features are impressive for the price.',
      status: 'approved',
      isFeatured: true,
    },
    {
      fullName: 'Dawit Bekele',
      email: 'dawit.bekele@email.com',
      vehicleModel: 'Monjaro',
      rating: 5,
      reviewTitle: 'Luxury at Its Best',
      reviewMessage: 'The Monjaro exceeded all my expectations. The build quality, comfort, and features are outstanding. It handles Ethiopian roads beautifully and the service at Kerchanshe has been excellent.',
      status: 'approved',
      isFeatured: true,
    },
    {
      fullName: 'Sara Mohammed',
      email: 'sara.mohammed@email.com',
      vehicleModel: 'Geometry EX5',
      rating: 5,
      reviewTitle: 'Future of Driving in Ethiopia',
      reviewMessage: 'As one of the first EV owners in Ethiopia, I am amazed by the Geometry EX5. Zero emissions, incredibly quiet, and the range is perfect for city driving. Charging at home is so convenient.',
      status: 'approved',
      isFeatured: false,
    },
    {
      fullName: 'Yohannes Alemu',
      email: 'yohannes.a@email.com',
      vehicleModel: 'Okavango',
      rating: 4,
      reviewTitle: 'Great 7-Seater for Large Families',
      reviewMessage: 'Perfect vehicle for our large family. All 7 seats are comfortable and there is still plenty of cargo space. The third row is actually usable for adults, which is rare in this price range.',
      status: 'approved',
      isFeatured: false,
    },
    {
      fullName: 'Hanan Yusuf',
      email: 'hanan.yusuf@email.com',
      vehicleModel: 'Coolray',
      rating: 4,
      reviewTitle: 'Excellent Value for Money',
      reviewMessage: 'Great features at an affordable price. The panoramic sunroof and advanced safety systems were key selling points. Fuel economy is excellent for daily commuting in Addis Ababa.',
      status: 'approved',
      isFeatured: false,
    },
  ];

  // Create reviews
  for (const review of reviews) {
    await prisma.review.create({
      data: review,
    });
  }

  console.log('✅ Sample reviews created');
  console.log('🎉 Reviews seed complete!');
  console.log('');
  console.log('Created:');
  console.log('- 6 customer reviews');
  console.log('- 3 featured reviews');
  console.log('- Average rating: 4.5/5');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });