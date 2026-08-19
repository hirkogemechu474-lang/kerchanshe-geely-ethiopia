import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reviews, promotions, and quotations...');

  // Clear existing data
  await prisma.review.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.quotation.deleteMany({});

  // Seed Reviews
  const reviews = await prisma.review.createMany({
    data: [
      {
        fullName: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        vehicleModel: 'Geely Coolray',
        rating: 5,
        reviewTitle: 'Excellent Purchase!',
        reviewMessage: 'I purchased the Coolray and it has been fantastic. Great fuel efficiency, comfortable interior, and excellent customer service from Geely Ethiopia.',
        profileImage: null,
        status: 'approved',
        isFeatured: true,
        isActive: true,
      },
      {
        fullName: 'Fatima Mohammed',
        email: 'fatima@example.com',
        vehicleModel: 'Geely Emgrand',
        rating: 4,
        reviewTitle: 'Very Satisfied',
        reviewMessage: 'The Emgrand is a beautiful car with great performance. Smooth driving experience and reliable vehicle.',
        profileImage: null,
        status: 'approved',
        isFeatured: true,
        isActive: true,
      },
      {
        fullName: 'Tariku Kebede',
        email: 'tariku@example.com',
        vehicleModel: 'Geely Coolray',
        rating: 5,
        reviewTitle: 'Best Value for Money',
        reviewMessage: 'Outstanding quality and affordable price. The team was very helpful throughout the purchase process.',
        profileImage: null,
        status: 'approved',
        isFeatured: false,
        isActive: true,
      },
      {
        fullName: 'Marta Tadesse',
        email: 'marta@example.com',
        vehicleModel: 'Geely Geometry',
        rating: 5,
        reviewTitle: 'Modern and Efficient',
        reviewMessage: 'The electric vehicle from Geely is amazing. Zero emissions, low maintenance, and great technology features.',
        profileImage: null,
        status: 'approved',
        isFeatured: true,
        isActive: true,
      },
      {
        fullName: 'Getnet Alemu',
        email: 'getnet@example.com',
        vehicleModel: 'Geely Coolray',
        rating: 4,
        reviewTitle: 'Good Value',
        reviewMessage: 'Solid vehicle. Good performance and reliability. Recommend to friends and family.',
        profileImage: null,
        status: 'pending',
        isFeatured: false,
        isActive: true,
      },
    ],
  });

  console.log(`✓ Created ${reviews.count} reviews`);

  // Seed Promotions
  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const nextMonth = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

  const promotions = await prisma.promotion.createMany({
    data: [
      {
        title: 'New Year Special Offer',
        description: 'Get up to ETB 200,000 off select models. Limited time offer for the new year.',
        bannerImage: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&h=400&fit=crop',
        ctaButtonText: 'View Offers',
        ctaButtonLink: '/models',
        isFeatured: true,
        isActive: true,
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
        endDate: endDate,
        displayOrder: 1,
      },
      {
        title: 'Electric Vehicle Launch Promotion',
        description: 'Special financing rates for our new electric vehicle lineup. Save on installation charges.',
        bannerImage: 'https://images.unsplash.com/photo-1560958089-b8a63dd8aa8b?w=1200&h=400&fit=crop',
        ctaButtonText: 'Explore Electric',
        ctaButtonLink: '/electric',
        isFeatured: true,
        isActive: true,
        startDate: now,
        endDate: nextMonth,
        displayOrder: 2,
      },
      {
        title: 'Trade-In Bonus Program',
        description: 'Extra ETB 50,000 value for your old vehicle when trading in. Valid on all models.',
        bannerImage: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&h=400&fit=crop',
        ctaButtonText: 'Calculate Trade-In',
        ctaButtonLink: '/trade-in',
        isFeatured: false,
        isActive: true,
        startDate: now,
        endDate: endDate,
        displayOrder: 3,
      },
      {
        title: 'Financing Made Easy',
        description: 'Low interest rates starting from 8% per annum. Fast approval process. Get pre-approved today.',
        bannerImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=400&fit=crop',
        ctaButtonText: 'Apply for Financing',
        ctaButtonLink: '/financing',
        isFeatured: false,
        isActive: true,
        startDate: now,
        endDate: endDate,
        displayOrder: 4,
      },
      {
        title: 'Summer Service Special',
        description: 'Free vehicle inspection and maintenance check. Valid until end of season.',
        bannerImage: null,
        ctaButtonText: 'Book Service',
        ctaButtonLink: '/service',
        isFeatured: false,
        isActive: false,
        startDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
        displayOrder: 5,
      },
    ],
  });

  console.log(`✓ Created ${promotions.count} promotions`);

  // Seed Quotations
  const quotations = await prisma.quotation.createMany({
    data: [
      {
        customerName: 'John Doe',
        phoneNumber: '+251911234567',
        email: 'john@example.com',
        vehicleModel: 'Geely Coolray',
        preferredDealer: 'Addis Ababa Showroom',
        financingInterest: true,
        tradeInInterest: false,
        message: 'Interested in the Coolray. Would like to know about financing options.',
        status: 'new',
        internalNotes: 'Customer prefers weekend appointments',
        assignedTo: null,
      },
      {
        customerName: 'Jane Smith',
        phoneNumber: '+251912345678',
        email: 'jane@example.com',
        vehicleModel: 'Geely Emgrand',
        preferredDealer: null,
        financingInterest: false,
        tradeInInterest: true,
        message: 'Looking for an Emgrand. Have a 2015 Honda Civic to trade in.',
        status: 'contacted',
        internalNotes: 'Trade-in vehicle in good condition, appraised at ETB 450,000',
        assignedTo: 'Sales Rep 1',
      },
      {
        customerName: 'Ahmed Ali',
        phoneNumber: '+251913456789',
        email: 'ahmed.ali@example.com',
        vehicleModel: 'Geely Geometry',
        preferredDealer: 'Dire Dawa Dealer',
        financingInterest: true,
        tradeInInterest: false,
        message: 'Very interested in the electric vehicle. Need financing for the full amount.',
        status: 'in_progress',
        internalNotes: 'Customer approved for 80% financing at 9% interest rate',
        assignedTo: 'Sales Manager 1',
      },
      {
        customerName: 'Marta Tekle',
        phoneNumber: '+251914567890',
        email: 'marta.tekle@example.com',
        vehicleModel: 'Geely Coolray',
        preferredDealer: null,
        financingInterest: false,
        tradeInInterest: false,
        message: 'Paying cash for Coolray. Need it delivered next week.',
        status: 'converted',
        internalNotes: 'Contract signed, payment received, delivery scheduled for next Monday',
        assignedTo: 'Sales Rep 2',
      },
      {
        customerName: 'Getnet Worku',
        phoneNumber: '+251915678901',
        email: 'getnet.worku@example.com',
        vehicleModel: 'Geely Emgrand',
        preferredDealer: 'Addis Ababa Showroom',
        financingInterest: true,
        tradeInInterest: true,
        message: 'Requested quote for Emgrand. Changed mind, looking at other options.',
        status: 'closed',
        internalNotes: 'Customer decided to go with different brand. Lead closed.',
        assignedTo: null,
      },
      {
        customerName: 'Almaz Teshome',
        phoneNumber: '+251916789012',
        email: 'almaz@example.com',
        vehicleModel: 'Geely Coolray',
        preferredDealer: null,
        financingInterest: true,
        tradeInInterest: false,
        message: 'Interested in the Coolray with sunroof option. Need detailed quote.',
        status: 'new',
        internalNotes: null,
        assignedTo: null,
      },
    ],
  });

  console.log(`✓ Created ${quotations.count} quotations`);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
