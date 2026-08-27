import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  // ===================================
  // 1. PROMOTIONS
  // ===================================
  console.log('🎁 Seeding Promotions...');
  
  const promotions = await Promise.all([
    prisma.promotion.create({
      data: {
        title: 'New Year Mega Sale - Up to 20% Off',
        description: 'Celebrate the new year with massive savings on select Geely models. Get up to 20% off on Coolray, Emgrand, and Azkarra models. Limited time offer with special financing available.',
        bannerImage: '/images/promotions/new-year-sale.jpg',
        ctaButtonText: 'View Offers',
        ctaButtonLink: '/quote',
        isFeatured: true,
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-02-28'),
        displayOrder: 1,
      },
    }),
    prisma.promotion.create({
      data: {
        title: '0% Financing for 12 Months',
        description: 'Get your dream Geely vehicle with 0% interest financing for the first year. No hidden fees, flexible payment terms, and quick approval process. Available on all models.',
        bannerImage: '/images/promotions/zero-financing.jpg',
        ctaButtonText: 'Apply Now',
        ctaButtonLink: '/financing',
        isFeatured: true,
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        displayOrder: 2,
      },
    }),
    prisma.promotion.create({
      data: {
        title: 'Trade-In Bonus Program',
        description: 'Trade in your old vehicle and get an extra 50,000 ETB bonus towards your new Geely. Any make, any model accepted. Get instant valuation and upgrade today.',
        bannerImage: '/images/promotions/trade-in-bonus.jpg',
        ctaButtonText: 'Get Trade-In Value',
        ctaButtonLink: '/quote',
        isFeatured: false,
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-30'),
        displayOrder: 3,
      },
    }),
    prisma.promotion.create({
      data: {
        title: 'Electric Vehicle Incentive',
        description: 'Go green and save! Get 100,000 ETB off any Geely electric vehicle plus free home charging installation. Join the electric revolution with Ethiopia\'s most trusted brand.',
        bannerImage: '/images/promotions/ev-incentive.jpg',
        ctaButtonText: 'Explore EVs',
        ctaButtonLink: '/electric',
        isFeatured: false,
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        displayOrder: 4,
      },
    }),
    prisma.promotion.create({
      data: {
        title: 'First Responder Appreciation',
        description: 'Special discount for medical professionals, police, firefighters, and teachers. 15% off MSRP as our way of saying thank you for your service to the community.',
        bannerImage: '/images/promotions/first-responder.jpg',
        ctaButtonText: 'Verify Eligibility',
        ctaButtonLink: '/quote',
        isFeatured: false,
        isActive: true,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        displayOrder: 5,
      },
    }),
  ]);

  console.log(`✅ Created ${promotions.length} promotions\n`);

  // ===================================
  // 2. TESTIMONIALS/REVIEWS
  // ===================================
  console.log('⭐ Seeding Customer Reviews...');
  
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        fullName: 'Abebe Tadesse',
        email: 'abebe.t@example.com',
        vehicleModel: 'Geely Coolray',
        rating: 5,
        reviewTitle: 'Best SUV for City Driving',
        reviewMessage: 'I\'ve owned my Coolray for 6 months now and I absolutely love it. The fuel efficiency is incredible for an SUV, and the tech features are way ahead of other cars in this price range. The service from Geely Ethiopia has been exceptional.',
        status: 'approved',
        isFeatured: true,
        isActive: true,
      },
    }),
    prisma.review.create({
      data: {
        fullName: 'Hana Bekele',
        email: 'hana.b@example.com',
        vehicleModel: 'Geely Emgrand',
        rating: 5,
        reviewTitle: 'Elegant and Reliable',
        reviewMessage: 'The Emgrand has exceeded all my expectations. It\'s spacious, comfortable, and drives like a dream. I especially love the safety features and the premium interior. Great value for money!',
        status: 'approved',
        isFeatured: true,
        isActive: true,
      },
    }),
    prisma.review.create({
      data: {
        fullName: 'Solomon Mekonnen',
        email: 'solomon.m@example.com',
        vehicleModel: 'Geely Azkarra',
        rating: 5,
        reviewTitle: 'Perfect Family Car',
        reviewMessage: 'Bought the Azkarra for my growing family and it\'s been perfect. Plenty of space for car seats, great cargo capacity, and the panoramic sunroof is a hit with the kids. Highly recommend!',
        status: 'approved',
        isFeatured: true,
        isActive: true,
      },
    }),
    prisma.review.create({
      data: {
        fullName: 'Tigist Alemu',
        email: 'tigist.a@example.com',
        vehicleModel: 'Geely Atlas',
        rating: 5,
        reviewTitle: 'Luxury at an Affordable Price',
        reviewMessage: 'The Atlas is a stunning vehicle. The design is modern and elegant, and the ride quality is smooth and quiet. I feel like I\'m driving a much more expensive car. The warranty gives me peace of mind too.',
        status: 'approved',
        isFeatured: false,
        isActive: true,
      },
    }),
    prisma.review.create({
      data: {
        fullName: 'Dawit Haile',
        email: 'dawit.h@example.com',
        vehicleModel: 'Geely Coolray',
        rating: 4,
        reviewTitle: 'Great Technology Features',
        reviewMessage: 'The infotainment system is intuitive and the 360-degree camera makes parking so easy. Only minor complaint is I wish the trunk was slightly larger, but overall very happy with my purchase.',
        status: 'approved',
        isFeatured: false,
        isActive: true,
      },
    }),
    prisma.review.create({
      data: {
        fullName: 'Meron Assefa',
        email: 'meron.a@example.com',
        vehicleModel: 'Geely Emgrand',
        rating: 5,
        reviewTitle: 'Excellent Customer Service',
        reviewMessage: 'Beyond the great car, I have to praise Geely Ethiopia\'s customer service. They made the buying process smooth and the after-sales service has been prompt and professional. Very satisfied!',
        status: 'approved',
        isFeatured: false,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${reviews.length} customer reviews\n`);

  // ===================================
  // 3. NEWS ARTICLES
  // ===================================
  console.log('📰 Seeding News Articles...');
  
  const newsArticles = await Promise.all([
    prisma.newsArticle.create({
      data: {
        title: 'Geely Ethiopia Opens New Showroom in Bahir Dar',
        category: 'Company News',
        author: 'Communications Team',
        excerpt: 'Expanding our presence to serve customers in the Amhara region with world-class facilities and service.',
        content: `Geely Ethiopia, in partnership with Kerchanshe Auto, is proud to announce the opening of our newest showroom in Bahir Dar. This state-of-the-art facility represents our commitment to bringing world-class automotive excellence to every corner of Ethiopia.

The new showroom features:
- Full range of Geely vehicles on display
- Modern service center with certified technicians
- Genuine spare parts inventory
- Customer lounge and test drive facilities
- Dedicated sales team fluent in Amharic and English

"This expansion reflects our vision to make Geely vehicles accessible to customers throughout Ethiopia," said the General Manager. "Bahir Dar is a vibrant city with growing demand for quality vehicles, and we're excited to serve this community."

The showroom officially opens on February 15, 2026, with a special launch event featuring promotional pricing and exclusive offers for early visitors.`,
        imageUrl: '/images/news/bahir-dar-showroom.jpg',
        status: 'published',
        publishDate: new Date('2026-01-15'),
        views: 245,
      },
    }),
    prisma.newsArticle.create({
      data: {
        title: 'Geely Coolray Wins "SUV of the Year" Award',
        category: 'Awards',
        author: 'Editorial Team',
        excerpt: 'Ethiopian Automotive Association recognizes Coolray for outstanding design, safety, and value.',
        content: `The Geely Coolray has been awarded "SUV of the Year" by the Ethiopian Automotive Association, recognizing its exceptional combination of design, safety features, and value for money.

The award committee praised the Coolray for:
- Advanced safety systems including automatic emergency braking
- Fuel-efficient turbocharged engine
- Premium interior features at an accessible price point
- Outstanding after-sales support from Geely Ethiopia
- High customer satisfaction ratings

"This award validates what our customers have been telling us," said our Sales Director. "The Coolray delivers premium features and safety technology that were previously only available in luxury vehicles."

The Coolray has been Ethiopia's best-selling compact SUV for the past six months, with over 500 units delivered to satisfied customers nationwide.`,
        imageUrl: '/images/news/coolray-award.jpg',
        status: 'published',
        publishDate: new Date('2026-01-10'),
        views: 423,
      },
    }),
    prisma.newsArticle.create({
      data: {
        title: 'Introducing the All-New Geely Galaxy E8',
        category: 'New Models',
        author: 'Product Team',
        excerpt: 'Pure electric luxury sedan with 665km range coming to Ethiopia in Q2 2026.',
        content: `Geely Ethiopia is excited to announce the upcoming arrival of the Galaxy E8, a revolutionary all-electric luxury sedan that combines cutting-edge technology with sustainable mobility.

Key Features:
- 665km CLTC range on a single charge
- 0-100km/h in just 3.49 seconds
- Advanced autonomous driving capabilities
- Premium interior with sustainable materials
- Fast charging: 10-80% in 30 minutes

The Galaxy E8 represents Geely's commitment to electric mobility and Ethiopia's sustainable transportation future. Pre-orders will open in March 2026, with deliveries beginning in May.

Special launch pricing and home charging installation packages will be available for early adopters. Visit our electric vehicle page to learn more and register your interest.`,
        status: 'published',
        publishDate: new Date('2026-01-20'),
        views: 789,
      },
    }),
    prisma.newsArticle.create({
      data: {
        title: 'Geely Ethiopia Launches Mobile Service Initiative',
        category: 'Service',
        author: 'Service Team',
        excerpt: 'Bringing vehicle maintenance and repairs directly to customers\' homes and offices.',
        content: `Geely Ethiopia is launching a new Mobile Service Initiative to make vehicle maintenance more convenient than ever. Our certified technicians will come to your location for routine maintenance and minor repairs.

Services Available:
- Regular maintenance and oil changes
- Tire rotation and replacement
- Battery service
- Minor repairs and diagnostics
- Pre-purchase inspections

The mobile service is available in Addis Ababa and will expand to other major cities throughout 2026. Book your appointment through our website or mobile app.

"We understand our customers' time is valuable," said our Service Director. "This initiative allows them to maintain their vehicles without disrupting their busy schedules."`,
        imageUrl: '/images/news/mobile-service.jpg',
        status: 'published',
        publishDate: new Date('2026-01-05'),
        views: 156,
      },
    }),
  ]);

  console.log(`✅ Created ${newsArticles.length} news articles\n`);

  // ===================================
  // 4. HERO SECTIONS
  // ===================================
  console.log('🎬 Seeding Hero Sections...');
  
  const heroSections = await Promise.all([
    prisma.heroSection.create({
      data: {
        title: 'Experience the Future of Driving',
        subtitle: 'Discover Innovation',
        description: 'Explore Geely\'s cutting-edge technology, premium design, and unmatched safety features that make every journey extraordinary.',
        mediaType: 'VIDEO',
        videoUrl: '/videos/hero-main.mp4',
        posterUrl: '/images/hero-poster-1.jpg',
        buttonText: 'Explore Models',
        buttonLink: '/models',
        status: 'active',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.heroSection.create({
      data: {
        title: 'Go Electric with Geely',
        subtitle: 'Sustainable Mobility',
        description: 'Join the electric revolution with Geely\'s advanced EV technology. Zero emissions, maximum performance, and incredible range.',
        mediaType: 'IMAGE',
        imageUrl: '/images/hero-electric.jpg',
        buttonText: 'Discover EVs',
        buttonLink: '/electric',
        status: 'active',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.heroSection.create({
      data: {
        title: 'Limited Time Offers',
        subtitle: 'New Year Sale',
        description: 'Save up to 20% on select models. Special financing available with 0% interest for 12 months.',
        mediaType: 'IMAGE',
        imageUrl: '/images/hero-promo.jpg',
        buttonText: 'View Offers',
        buttonLink: '/offers',
        status: 'active',
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${heroSections.length} hero sections\n`);

  // ===================================
  // 5. DEALERS
  // ===================================
  console.log('🏢 Seeding Dealers...');
  
  const dealers = await Promise.all([
    prisma.dealer.create({
      data: {
        name: 'Geely Ethiopia - Sarbet Showroom',
        type: 'both',
        city: 'Addis Ababa',
        region: 'Addis Ababa',
        address: {
          street: 'Sarbet',
          area: 'Sarbet',
          city: 'Addis Ababa',
          region: 'Addis Ababa',
          country: 'Ethiopia',
          postalCode: '1000',
        },
        latitude: 9.0192,
        longitude: 38.7525,
        contact: {
          phone: '+251 11 000 0000',
          email: 'sarbet@geelyethiopia.com',
          whatsapp: '+251 911 000 000',
        },
        services: [
          'New Vehicle Sales',
          'Test Drives',
          'Service & Maintenance',
          'Genuine Parts',
          'Financing Assistance',
          'Trade-In Valuation',
        ],
        workingHours: {
          weekdays: '8:00 AM - 6:00 PM',
          saturday: '9:00 AM - 5:00 PM',
          sunday: 'Closed',
        },
        facilities: {
          showroom: true,
          serviceCenter: true,
          partsShop: true,
          testDriveArea: true,
          customerLounge: true,
          parking: true,
        },
        active: true,
        featured: true,
        salesCount: 450,
        staffCount: 35,
        rating: 4.8,
      },
    }),
    prisma.dealer.create({
      data: {
        name: 'Geely Ethiopia - Bole Service Center',
        type: 'service',
        city: 'Addis Ababa',
        region: 'Addis Ababa',
        address: {
          street: 'Bole Road',
          area: 'Bole',
          city: 'Addis Ababa',
          region: 'Addis Ababa',
          country: 'Ethiopia',
          postalCode: '1000',
        },
        latitude: 8.9806,
        longitude: 38.7578,
        contact: {
          phone: '+251 11 111 1111',
          email: 'bole-service@geelyethiopia.com',
          whatsapp: '+251 911 111 111',
        },
        services: [
          'Service & Maintenance',
          'Genuine Parts',
          'Warranty Repairs',
          'Diagnostic Services',
          'Tire Services',
        ],
        workingHours: {
          weekdays: '7:30 AM - 6:00 PM',
          saturday: '8:00 AM - 4:00 PM',
          sunday: 'Closed',
        },
        facilities: {
          showroom: false,
          serviceCenter: true,
          partsShop: true,
          testDriveArea: false,
          customerLounge: true,
          parking: true,
        },
        active: true,
        featured: false,
        salesCount: 0,
        staffCount: 20,
        rating: 4.7,
      },
    }),
    prisma.dealer.create({
      data: {
        name: 'Geely Ethiopia - Bahir Dar Showroom',
        type: 'both',
        city: 'Bahir Dar',
        region: 'Amhara',
        address: {
          street: 'Main Road',
          area: 'Kebele 01',
          city: 'Bahir Dar',
          region: 'Amhara',
          country: 'Ethiopia',
          postalCode: '2000',
        },
        latitude: 11.5942,
        longitude: 37.3615,
        contact: {
          phone: '+251 58 220 0000',
          email: 'bahirdar@geelyethiopia.com',
          whatsapp: '+251 918 220 000',
        },
        services: [
          'New Vehicle Sales',
          'Test Drives',
          'Service & Maintenance',
          'Genuine Parts',
          'Financing Assistance',
        ],
        workingHours: {
          weekdays: '8:00 AM - 6:00 PM',
          saturday: '9:00 AM - 5:00 PM',
          sunday: 'Closed',
        },
        facilities: {
          showroom: true,
          serviceCenter: true,
          partsShop: true,
          testDriveArea: true,
          customerLounge: true,
          parking: true,
        },
        active: true,
        featured: true,
        salesCount: 125,
        staffCount: 18,
        rating: 4.6,
      },
    }),
  ]);

  console.log(`✅ Created ${dealers.length} dealers\n`);

  // ===================================
  // 6. SETTINGS
  // ===================================
  console.log('⚙️ Seeding Settings...');
  
  await prisma.setting.upsert({
    where: { key: 'social_media_links' },
    update: {},
    create: {
      key: 'social_media_links',
      type: 'social',
      value: JSON.stringify({
        facebook: 'https://facebook.com/geelyethiopia',
        instagram: 'https://instagram.com/geelyethiopia',
        twitter: 'https://twitter.com/geelyethiopia',
        youtube: 'https://youtube.com/@geelyethiopia',
        linkedin: 'https://linkedin.com/company/geely-ethiopia',
        tiktok: 'https://tiktok.com/@geelyethiopia',
      }),
    },
  });

  await prisma.setting.upsert({
    where: { key: 'privacy_policy' },
    update: {},
    create: {
      key: 'privacy_policy',
      type: 'policy',
      value: `PRIVACY POLICY - Geely Ethiopia

Last Updated: January 2026

1. INTRODUCTION
Geely Ethiopia respects your privacy and is committed to protecting your personal data.

2. DATA COLLECTION
We collect: name, email, phone, vehicle preferences, and browsing data.

3. DATA USAGE
Your data is used for: quotations, test drive bookings, service requests, and marketing (with consent).

4. DATA SECURITY
We implement industry-standard security measures to protect your information.

5. YOUR RIGHTS
You have the right to access, correct, or delete your personal data.

Contact: info@geelyethiopia.com | +251 11 000 0000`,
    },
  });

  await prisma.setting.upsert({
    where: { key: 'terms_of_service' },
    update: {},
    create: {
      key: 'terms_of_service',
      type: 'policy',
      value: `TERMS OF SERVICE - Geely Ethiopia

Last Updated: January 2026

1. ACCEPTANCE
By using this website, you agree to these terms.

2. VEHICLE INFORMATION
Prices and specifications are subject to change without notice.

3. TEST DRIVES
Valid driver's license required. Minimum age: 23 years.

4. QUOTATIONS
All quotes valid for 30 days. Deposits are non-refundable.

5. LIABILITY
Geely Ethiopia is not liable for indirect or consequential damages.

Contact: info@geelyethiopia.com | +251 11 000 0000`,
    },
  });

  const vehicleSettings = {
  categories: [
    {
      id: '1',
      name: 'Sedans',
      description: 'Comfortable and fuel-efficient sedans for daily commuting and family use.',
      displayOrder: 1,
      active: true,
    },
    {
      id: '2',
      name: 'SUVs',
      description: 'Spacious and rugged SUVs for families and adventurous driving.',
      displayOrder: 2,
      active: true,
    },
    {
      id: '3',
      name: 'Electric Vehicles',
      description: 'Zero-emission electric vehicles with advanced technology and impressive range.',
      displayOrder: 3,
      active: true,
    },
    {
      id: '4',
      name: 'Hatchbacks',
      description: 'Compact and practical hatchbacks perfect for city driving.',
      displayOrder: 4,
      active: true,
    },
  ],
  features: {
    safety: [
      'ABS (Anti-lock Braking System)',
      'EBD (Electronic Brakeforce Distribution)',
      'ESP (Electronic Stability Program)',
      'TCS (Traction Control System)',
      'Dual Front Airbags',
      'Side & Curtain Airbags',
      'Tire Pressure Monitoring System (TPMS)',
      'Reverse Camera with Parking Sensors',
      'Hill Start Assist (HSA)',
      'Hill Descent Control (HDC)',
      'Blind Spot Detection (BSD)',
      'Lane Departure Warning (LDW)',
      'Forward Collision Warning (FCW)',
      'Automatic Emergency Braking (AEB)',
      'ISOFIX Child Seat Anchors',
      'High-Strength Steel Safety Cage',
    ],
    comfort: [
      'Automatic Climate Control / Dual-Zone AC',
      'Leather Upholstery',
      'Heated Front Seats',
      'Ventilated Front Seats',
      'Power-Adjustable Driver Seat with Memory',
      '60/40 Split-Folding Rear Seats',
      'Ambient Interior Lighting',
      'Panoramic Sunroof',
      'Push-Button Start / Stop',
      'Smart Key Entry',
      'Cruise Control / Adaptive Cruise Control',
      'Tilt & Telescopic Steering Adjustment',
      'Steering Wheel-Mounted Controls',
      'Front & Rear Power Windows',
      'Power-Folding Side Mirrors',
      'Auto-Dimming Rearview Mirror',
      'Wireless Charging Pad',
      'Center Armrest with Storage',
    ],
    technology: [
      '10.25" / 12.3" Touchscreen Infotainment Display',
      'Apple CarPlay & Android Auto Integration',
      'Bluetooth Hands-Free Calling & Audio Streaming',
      'Voice Command Recognition',
      'GPS Navigation System',
      'USB / Type-C Charging Ports',
      'Premium Sound System (8-12 Speakers)',
      'Subwoofer & Amplifier (Premium)',
      'Digital Instrument Cluster',
      'Head-Up Display (HUD)',
      '360° Surround View Camera',
      'Remote Engine Start',
      'App-Based Vehicle Controls',
      'OTA Software Updates',
      'Drive Mode Selector (Eco / Normal / Sport)',
      'Electronic Parking Brake with Auto Hold',
    ],
    performance: [
      'Turbocharged Engine Options',
      '7-Speed DCT Automatic Transmission',
      'CVT Transmission (for efficiency)',
      'Front-Wheel Drive (FWD)',
      'All-Wheel Drive (AWD) - Select Models',
      'Front Suspension: MacPherson Strut',
      'Rear Suspension: Multi-Link / Torsion Beam',
      'Electric Power Steering (EPS)',
      'Disc Brakes on All Wheels',
      'Regenerative Braking (EV models)',
      'Selectable Drive Modes',
      'High Energy-Density Battery (EV models)',
      'Fast Charging Capability (EV models)',
    ],
  },
  specifications: {
    engine: [
      '1.5T Turbocharged Petrol - 173 HP',
      '1.5L Naturally Aspirated Petrol - 114 HP',
      '2.0T Turbocharged Petrol - 238 HP',
      '1.0T Turbocharged Petrol - 140 HP',
      'Electric Motor - 150 kW (201 HP)',
      'Electric Motor - 200 kW (268 HP)',
    ],
    transmission: [
      '7-Speed Dual-Clutch Transmission (DCT)',
      'Continuously Variable Transmission (CVT)',
      '6-Speed Automatic',
      '6-Speed Manual',
      'Single-Speed Reduction Gear (EV)',
    ],
    fuelType: [
      'Petrol (Gasoline)',
      'Battery Electric Vehicle (BEV)',
      'Plug-In Hybrid (PHEV)',
    ],
    driveType: [
      'Front-Wheel Drive (FWD)',
      'All-Wheel Drive (AWD)',
      'Rear-Wheel Drive (RWD)',
    ],
  },
  warranty: {
    vehicle: '5 Years or 150,000 km (whichever comes first)',
    battery: '8 Years or 160,000 km (for EV battery packs)',
    paintwork: '3 Years or 100,000 km against perforation',
    corrosion: '12 Years Against Perforation Corrosion',
  },
  serviceIntervals: {
    standard: 'Every 10,000 km or 6 months',
    electric: 'Every 20,000 km or 12 months',
  },
  brochure: {
    url: '',
    fileName: '',
    fileSize: null,
    uploadedAt: null,
  },
};

  await prisma.setting.upsert({
    where: { key: 'vehicle_settings' },
    update: {
        value: JSON.stringify(vehicleSettings),
    },
    create: {
      key: 'vehicle_settings',
      type: 'cms',
      value: JSON.stringify(vehicleSettings),
    },
  });

  console.log('✅ Settings created\n');

  // ===================================
  // 7. VEHICLE BRANDS
  // ===================================
  console.log('🏷️ Seeding Vehicle Brands...');
  
  const geelyBrand = await prisma.vehicleBrand.upsert({
    where: { name: 'Geely' },
    update: {},
    create: {
      name: 'Geely',
      slug: 'geely',
      description: 'Geely Auto Group is a leading Chinese automotive manufacturer known for innovative design, advanced technology, and exceptional value.',
      logoUrl: '/images/brands/geely-logo.png',
      isActive: true,
      displayOrder: 1,
    },
  });

  console.log('✅ Created 1 vehicle brand\n');

  // ===================================
  // 8. VEHICLE CATEGORIES
  // ===================================
  console.log('📁 Seeding Vehicle Categories...');
  
  const suvCategory = await prisma.vehicleCategory.upsert({
    where: { slug: 'suvs' },
    update: {},
    create: {
      name: 'SUVs',
      slug: 'suvs',
      description: 'Spacious and versatile sport utility vehicles perfect for families and adventures.',
      imageUrl: '/images/categories/suvs.jpg',
      iconUrl: '/images/categories/suv-icon.svg',
      heroImageUrl: '/images/categories/suvs-hero.jpg',
      metaTitle: 'Geely SUVs - Premium Sport Utility Vehicles',
      metaDescription: 'Explore Geely\'s range of premium SUVs including Coolray, Azkarra, and Atlas. Advanced safety, modern design, and exceptional value.',
      brandId: geelyBrand.id,
      isActive: true,
      displayOrder: 1,
    },
  });

  const sedanCategory = await prisma.vehicleCategory.upsert({
    where: { slug: 'sedans' },
    update: {},
    create: {
      name: 'Sedans',
      slug: 'sedans',
      description: 'Elegant and efficient sedans offering comfort, style, and performance.',
      imageUrl: '/images/categories/sedans.jpg',
      iconUrl: '/images/categories/sedan-icon.svg',
      heroImageUrl: '/images/categories/sedans-hero.jpg',
      metaTitle: 'Geely Sedans - Premium Family Sedans',
      metaDescription: 'Discover Geely sedans like Emgrand and Preface. Spacious interiors, advanced safety, and refined driving experience.',
      brandId: geelyBrand.id,
      isActive: true,
      displayOrder: 2,
    },
  });

  const electricCategory = await prisma.vehicleCategory.upsert({
    where: { slug: 'electric' },
    update: {},
    create: {
      name: 'Electric',
      slug: 'electric',
      description: 'Zero-emission electric vehicles with cutting-edge technology and impressive range.',
      imageUrl: '/images/categories/electric.jpg',
      iconUrl: '/images/categories/electric-icon.svg',
      heroImageUrl: '/images/categories/electric-hero.jpg',
      heroVideoUrl: '/videos/electric-hero.mp4',
      metaTitle: 'Geely Electric Vehicles - Sustainable Mobility',
      metaDescription: 'Experience the future with Geely electric vehicles. Zero emissions, advanced battery technology, and incredible performance.',
      brandId: geelyBrand.id,
      isActive: true,
      displayOrder: 3,
    },
  });

  const categories = [suvCategory, sedanCategory, electricCategory];

  console.log(`✅ Created ${categories.length} vehicle categories\n`);

  // ===================================
  // 9. VEHICLES
  // ===================================
  console.log('🚗 Seeding Vehicles...');
  
  // Find the categories we just created

  const vehicles = await Promise.all([
    // SUVs
    prisma.vehicle.upsert({
      where: { slug: 'coolray' },
      update: {
        name: 'Geely Coolray',
        model: 'Coolray Sport',
        year: 2024,
        category: 'SUV',
        brandId: geelyBrand.id,
        categoryId: suvCategory?.id,
        description: 'The Coolray is a compact SUV that combines sporty styling with practical features. Perfect for city driving with excellent fuel efficiency and advanced safety systems.',
        images: [
          '/images/vehicles/coolray-front.jpg',
          '/images/vehicles/coolray-side.jpg',
          '/images/vehicles/coolray-rear.jpg',
          '/images/vehicles/coolray-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '1.5L Turbocharged',
            power: '177 HP',
            torque: '255 Nm',
            transmission: '7-Speed DCT',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4330 mm',
            width: '1800 mm',
            height: '1609 mm',
            wheelbase: '2600 mm',
            groundClearance: '180 mm',
          },
          performance: {
            topSpeed: '190 km/h',
            acceleration: '7.9 seconds (0-100 km/h)',
            fuelConsumption: '6.8 L/100km',
          },
          features: [
            'Panoramic Sunroof',
            '10.25" Touchscreen',
            'Apple CarPlay & Android Auto',
            '360° Camera System',
            'Adaptive Cruise Control',
            'Lane Keep Assist',
            'Automatic Emergency Braking',
            'Leather Seats',
          ],
          safety: [
            '6 Airbags',
            'ABS with EBD',
            'Traction Control',
            'Hill Start Assist',
            'ISOFIX Child Seat Anchors',
            'Tire Pressure Monitoring',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 1250000,
        discountAmount: 50000,
        discountType: 'flat',
        badge: 'Best Seller',
        taxRate: 15,
        finalPrice: 1200000,
        stock: 15,
        sku: 'GEELY-COOLRAY-2024',
        reorderPoint: 5,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 1,
        heroImageUrl: '/images/vehicles/coolray-hero.jpg',
      },
      create: {
        name: 'Geely Coolray',
        slug: 'coolray',
        model: 'Coolray Sport',
        year: 2024,
        category: 'SUV',
        brandId: geelyBrand.id,
        categoryId: suvCategory?.id,
        description: 'The Coolray is a compact SUV that combines sporty styling with practical features. Perfect for city driving with excellent fuel efficiency and advanced safety systems.',
        images: [
          '/images/vehicles/coolray-front.jpg',
          '/images/vehicles/coolray-side.jpg',
          '/images/vehicles/coolray-rear.jpg',
          '/images/vehicles/coolray-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '1.5L Turbocharged',
            power: '177 HP',
            torque: '255 Nm',
            transmission: '7-Speed DCT',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4330 mm',
            width: '1800 mm',
            height: '1609 mm',
            wheelbase: '2600 mm',
            groundClearance: '180 mm',
          },
          performance: {
            topSpeed: '190 km/h',
            acceleration: '7.9 seconds (0-100 km/h)',
            fuelConsumption: '6.8 L/100km',
          },
          features: [
            'Panoramic Sunroof',
            '10.25" Touchscreen',
            'Apple CarPlay & Android Auto',
            '360° Camera System',
            'Adaptive Cruise Control',
            'Lane Keep Assist',
            'Automatic Emergency Braking',
            'Leather Seats',
          ],
          safety: [
            '6 Airbags',
            'ABS with EBD',
            'Traction Control',
            'Hill Start Assist',
            'ISOFIX Child Seat Anchors',
            'Tire Pressure Monitoring',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 1250000,
        discountAmount: 50000,
        discountType: 'flat',
        badge: 'Best Seller',
        taxRate: 15,
        finalPrice: 1200000,
        stock: 15,
        sku: 'GEELY-COOLRAY-2024',
        reorderPoint: 5,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 1,
        heroImageUrl: '/images/vehicles/coolray-hero.jpg',
      },
    }),
    prisma.vehicle.upsert({
      where: { slug: 'azkarra' },
      update: {
        name: 'Geely Azkarra',
        model: 'Azkarra Premium',
        year: 2024,
        category: 'SUV',
        brandId: geelyBrand.id,
        categoryId: suvCategory?.id,
        description: 'The Azkarra is a mid-size SUV offering premium features and spacious interiors. Ideal for families seeking comfort, safety, and style.',
        images: [
          '/images/vehicles/azkarra-front.jpg',
          '/images/vehicles/azkarra-side.jpg',
          '/images/vehicles/azkarra-rear.jpg',
          '/images/vehicles/azkarra-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '1.8L Turbocharged',
            power: '184 HP',
            torque: '300 Nm',
            transmission: '7-Speed DCT',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4544 mm',
            width: '1831 mm',
            height: '1713 mm',
            wheelbase: '2670 mm',
            groundClearance: '195 mm',
          },
          performance: {
            topSpeed: '195 km/h',
            acceleration: '8.8 seconds (0-100 km/h)',
            fuelConsumption: '7.2 L/100km',
          },
          features: [
            'Panoramic Sunroof',
            '12.3" Digital Instrument Cluster',
            '12.3" Touchscreen Infotainment',
            'Wireless Phone Charging',
            '360° Camera with Parking Sensors',
            'Adaptive Cruise Control',
            'Lane Departure Warning',
            'Premium Leather Interior',
          ],
          safety: [
            '6 Airbags',
            'ABS with EBD',
            'Electronic Stability Control',
            'Hill Descent Control',
            'Blind Spot Monitoring',
            'Rear Cross Traffic Alert',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 1650000,
        taxRate: 15,
        finalPrice: 1650000,
        stock: 10,
        sku: 'GEELY-AZKARRA-2024',
        reorderPoint: 3,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 2,
        heroImageUrl: '/images/vehicles/azkarra-hero.jpg',
      },
      create: {
        name: 'Geely Azkarra',
        slug: 'azkarra',
        model: 'Azkarra Premium',
        year: 2024,
        category: 'SUV',
        brandId: geelyBrand.id,
        categoryId: suvCategory?.id,
        description: 'The Azkarra is a mid-size SUV offering premium features and spacious interiors. Ideal for families seeking comfort, safety, and style.',
        images: [
          '/images/vehicles/azkarra-front.jpg',
          '/images/vehicles/azkarra-side.jpg',
          '/images/vehicles/azkarra-rear.jpg',
          '/images/vehicles/azkarra-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '1.8L Turbocharged',
            power: '184 HP',
            torque: '300 Nm',
            transmission: '7-Speed DCT',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4544 mm',
            width: '1831 mm',
            height: '1713 mm',
            wheelbase: '2670 mm',
            groundClearance: '195 mm',
          },
          performance: {
            topSpeed: '195 km/h',
            acceleration: '8.8 seconds (0-100 km/h)',
            fuelConsumption: '7.2 L/100km',
          },
          features: [
            'Panoramic Sunroof',
            '12.3" Digital Instrument Cluster',
            '12.3" Touchscreen Infotainment',
            'Wireless Phone Charging',
            '360° Camera with Parking Sensors',
            'Adaptive Cruise Control',
            'Lane Departure Warning',
            'Premium Leather Interior',
          ],
          safety: [
            '6 Airbags',
            'ABS with EBD',
            'Electronic Stability Control',
            'Hill Descent Control',
            'Blind Spot Monitoring',
            'Rear Cross Traffic Alert',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 1650000,
        taxRate: 15,
        finalPrice: 1650000,
        stock: 10,
        sku: 'GEELY-AZKARRA-2024',
        reorderPoint: 3,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 2,
        heroImageUrl: '/images/vehicles/azkarra-hero.jpg',
      },
    }),
    prisma.vehicle.upsert({
      where: { slug: 'atlas' },
      update: {
        name: 'Geely Atlas',
        model: 'Atlas Luxury',
        year: 2024,
        category: 'SUV',
        brandId: geelyBrand.id,
        categoryId: suvCategory?.id,
        description: 'The Atlas is a full-size luxury SUV with three-row seating. Premium materials, advanced technology, and commanding road presence.',
        images: [
          '/images/vehicles/atlas-front.jpg',
          '/images/vehicles/atlas-side.jpg',
          '/images/vehicles/atlas-rear.jpg',
          '/images/vehicles/atlas-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '2.0L Turbocharged',
            power: '238 HP',
            torque: '350 Nm',
            transmission: '8-Speed Automatic',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4820 mm',
            width: '1930 mm',
            height: '1780 mm',
            wheelbase: '2845 mm',
            groundClearance: '200 mm',
          },
          performance: {
            topSpeed: '200 km/h',
            acceleration: '9.2 seconds (0-100 km/h)',
            fuelConsumption: '8.5 L/100km',
          },
          features: [
            'Three-Row Seating (7 seats)',
            'Dual Panoramic Sunroof',
            '12.3" Digital Cluster',
            '12.3" Central Touchscreen',
            'Premium Sound System',
            'Heated & Ventilated Seats',
            'Power Tailgate',
            'Adaptive LED Headlights',
          ],
          safety: [
            '8 Airbags',
            'ABS with EBD',
            'Electronic Stability Program',
            'Adaptive Cruise Control',
            'Automatic Emergency Braking',
            '360° Surround View',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 2150000,
        badge: 'Premium',
        taxRate: 15,
        finalPrice: 2150000,
        stock: 8,
        sku: 'GEELY-ATLAS-2024',
        reorderPoint: 2,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: false,
        isActive: true,
        status: 'published',
        displayOrder: 3,
        heroImageUrl: '/images/vehicles/atlas-hero.jpg',
      },
      create: {
        name: 'Geely Atlas',
        slug: 'atlas',
        model: 'Atlas Luxury',
        year: 2024,
        category: 'SUV',
        brandId: geelyBrand.id,
        categoryId: suvCategory?.id,
        description: 'The Atlas is a full-size luxury SUV with three-row seating. Premium materials, advanced technology, and commanding road presence.',
        images: [
          '/images/vehicles/atlas-front.jpg',
          '/images/vehicles/atlas-side.jpg',
          '/images/vehicles/atlas-rear.jpg',
          '/images/vehicles/atlas-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '2.0L Turbocharged',
            power: '238 HP',
            torque: '350 Nm',
            transmission: '8-Speed Automatic',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4820 mm',
            width: '1930 mm',
            height: '1780 mm',
            wheelbase: '2845 mm',
            groundClearance: '200 mm',
          },
          performance: {
            topSpeed: '200 km/h',
            acceleration: '9.2 seconds (0-100 km/h)',
            fuelConsumption: '8.5 L/100km',
          },
          features: [
            'Three-Row Seating (7 seats)',
            'Dual Panoramic Sunroof',
            '12.3" Digital Cluster',
            '12.3" Central Touchscreen',
            'Premium Sound System',
            'Heated & Ventilated Seats',
            'Power Tailgate',
            'Adaptive LED Headlights',
          ],
          safety: [
            '8 Airbags',
            'ABS with EBD',
            'Electronic Stability Program',
            'Adaptive Cruise Control',
            'Automatic Emergency Braking',
            '360° Surround View',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 2150000,
        badge: 'Premium',
        taxRate: 15,
        finalPrice: 2150000,
        stock: 8,
        sku: 'GEELY-ATLAS-2024',
        reorderPoint: 2,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: false,
        isActive: true,
        status: 'published',
        displayOrder: 3,
        heroImageUrl: '/images/vehicles/atlas-hero.jpg',
      },
    }),
    // Sedans
    prisma.vehicle.upsert({
      where: { slug: 'emgrand' },
      update: {
        name: 'Geely Emgrand',
        model: 'Emgrand GL',
        year: 2024,
        category: 'Sedan',
        brandId: geelyBrand.id,
        categoryId: sedanCategory?.id,
        description: 'The Emgrand is a refined family sedan combining elegant design with practical features. Spacious, comfortable, and fuel-efficient.',
        images: [
          '/images/vehicles/emgrand-front.jpg',
          '/images/vehicles/emgrand-side.jpg',
          '/images/vehicles/emgrand-rear.jpg',
          '/images/vehicles/emgrand-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '1.5L Naturally Aspirated',
            power: '109 HP',
            torque: '142 Nm',
            transmission: 'CVT',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4725 mm',
            width: '1802 mm',
            height: '1478 mm',
            wheelbase: '2700 mm',
            groundClearance: '165 mm',
          },
          performance: {
            topSpeed: '185 km/h',
            acceleration: '11.3 seconds (0-100 km/h)',
            fuelConsumption: '5.9 L/100km',
          },
          features: [
            '10.25" Touchscreen',
            'Apple CarPlay & Android Auto',
            'Cruise Control',
            'Rear Parking Sensors',
            'Automatic Climate Control',
            'Fabric/Leather Seats',
            'LED Daytime Running Lights',
          ],
          safety: [
            '4 Airbags',
            'ABS with EBD',
            'Electronic Stability Control',
            'Hill Start Assist',
            'Reverse Camera',
            'ISOFIX Anchors',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 950000,
        discountAmount: 30000,
        discountType: 'flat',
        badge: 'Value Pick',
        taxRate: 15,
        finalPrice: 920000,
        stock: 20,
        sku: 'GEELY-EMGRAND-2024',
        reorderPoint: 5,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 4,
        heroImageUrl: '/images/vehicles/emgrand-hero.jpg',
      },
      create: {
        name: 'Geely Emgrand',
        slug: 'emgrand',
        model: 'Emgrand GL',
        year: 2024,
        category: 'Sedan',
        brandId: geelyBrand.id,
        categoryId: sedanCategory?.id,
        description: 'The Emgrand is a refined family sedan combining elegant design with practical features. Spacious, comfortable, and fuel-efficient.',
        images: [
          '/images/vehicles/emgrand-front.jpg',
          '/images/vehicles/emgrand-side.jpg',
          '/images/vehicles/emgrand-rear.jpg',
          '/images/vehicles/emgrand-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '1.5L Naturally Aspirated',
            power: '109 HP',
            torque: '142 Nm',
            transmission: 'CVT',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4725 mm',
            width: '1802 mm',
            height: '1478 mm',
            wheelbase: '2700 mm',
            groundClearance: '165 mm',
          },
          performance: {
            topSpeed: '185 km/h',
            acceleration: '11.3 seconds (0-100 km/h)',
            fuelConsumption: '5.9 L/100km',
          },
          features: [
            '10.25" Touchscreen',
            'Apple CarPlay & Android Auto',
            'Cruise Control',
            'Rear Parking Sensors',
            'Automatic Climate Control',
            'Fabric/Leather Seats',
            'LED Daytime Running Lights',
          ],
          safety: [
            '4 Airbags',
            'ABS with EBD',
            'Electronic Stability Control',
            'Hill Start Assist',
            'Reverse Camera',
            'ISOFIX Anchors',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 950000,
        discountAmount: 30000,
        discountType: 'flat',
        badge: 'Value Pick',
        taxRate: 15,
        finalPrice: 920000,
        stock: 20,
        sku: 'GEELY-EMGRAND-2024',
        reorderPoint: 5,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 4,
        heroImageUrl: './images/vehicles/emgrand-hero.jpg',
      },
    }),
    prisma.vehicle.upsert({
      where: { slug: 'preface' },
      update: {
        name: 'Geely Preface',
        model: 'Preface Executive',
        year: 2024,
        category: 'Sedan',
        brandId: geelyBrand.id,
        categoryId: sedanCategory?.id,
        description: 'The Preface is a premium executive sedan with sophisticated design and cutting-edge technology. Comfort and performance in perfect harmony.',
        images: [
          '/images/vehicles/preface-front.jpg',
          '/images/vehicles/preface-side.jpg',
          '/images/vehicles/preface-rear.jpg',
          '/images/vehicles/preface-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '2.0L Turbocharged',
            power: '190 HP',
            torque: '300 Nm',
            transmission: '7-Speed DCT',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4785 mm',
            width: '1869 mm',
            height: '1469 mm',
            wheelbase: '2800 mm',
            groundClearance: '140 mm',
          },
          performance: {
            topSpeed: '210 km/h',
            acceleration: '7.9 seconds (0-100 km/h)',
            fuelConsumption: '6.7 L/100km',
          },
          features: [
            '12.3" Digital Instrument Cluster',
            '12.3" Central Touchscreen',
            'Premium Sound System',
            'Wireless Charging',
            'Heated & Ventilated Seats',
            'Ambient Lighting',
            'Power Driver Seat with Memory',
            'Smart Key with Push Start',
          ],
          safety: [
            '6 Airbags',
            'ABS with EBD',
            'Adaptive Cruise Control',
            'Lane Keep Assist',
            'Blind Spot Detection',
            'Automatic Emergency Braking',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 1850000,
        badge: 'Executive',
        taxRate: 15,
        finalPrice: 1850000,
        stock: 7,
        sku: 'GEELY-PREFACE-2024',
        reorderPoint: 2,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: false,
        isActive: true,
        status: 'published',
        displayOrder: 5,
        heroImageUrl: '/images/vehicles/preface-hero.jpg',
      },
      create: {
        name: 'Geely Preface',
        slug: 'preface',
        model: 'Preface Executive',
        year: 2024,
        category: 'Sedan',
        brandId: geelyBrand.id,
        categoryId: sedanCategory?.id,
        description: 'The Preface is a premium executive sedan with sophisticated design and cutting-edge technology. Comfort and performance in perfect harmony.',
        images: [
          '/images/vehicles/preface-front.jpg',
          '/images/vehicles/preface-side.jpg',
          '/images/vehicles/preface-rear.jpg',
          '/images/vehicles/preface-interior.jpg',
        ],
        specifications: {
          engine: {
            type: '2.0L Turbocharged',
            power: '190 HP',
            torque: '300 Nm',
            transmission: '7-Speed DCT',
            fuelType: 'Gasoline',
          },
          dimensions: {
            length: '4785 mm',
            width: '1869 mm',
            height: '1469 mm',
            wheelbase: '2800 mm',
            groundClearance: '140 mm',
          },
          performance: {
            topSpeed: '210 km/h',
            acceleration: '7.9 seconds (0-100 km/h)',
            fuelConsumption: '6.7 L/100km',
          },
          features: [
            '12.3" Digital Instrument Cluster',
            '12.3" Central Touchscreen',
            'Premium Sound System',
            'Wireless Charging',
            'Heated & Ventilated Seats',
            'Ambient Lighting',
            'Power Driver Seat with Memory',
            'Smart Key with Push Start',
          ],
          safety: [
            '6 Airbags',
            'ABS with EBD',
            'Adaptive Cruise Control',
            'Lane Keep Assist',
            'Blind Spot Detection',
            'Automatic Emergency Braking',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 1850000,
        badge: 'Executive',
        taxRate: 15,
        finalPrice: 1850000,
        stock: 7,
        sku: 'GEELY-PREFACE-2024',
        reorderPoint: 2,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: false,
        isActive: true,
        status: 'published',
        displayOrder: 5,
        heroImageUrl: '/images/vehicles/preface-hero.jpg',
      },
    }),
    prisma.vehicle.upsert({
      where: { slug: 'geometry-c' },
      update: {
        name: 'Geely Geometry C',
        model: 'Geometry C Pro',
        year: 2024,
        category: 'Electric',
        brandId: geelyBrand.id,
        categoryId: electricCategory?.id,
        description: 'The Geometry C is a pure electric SUV with impressive range and advanced technology. Zero emissions with no compromise on performance.',
        images: [
          '/images/vehicles/geometry-c-front.jpg',
          '/images/vehicles/geometry-c-side.jpg',
          '/images/vehicles/geometry-c-rear.jpg',
          '/images/vehicles/geometry-c-interior.jpg',
        ],
        specifications: {
          engine: {
            type: 'Electric Motor',
            power: '204 HP (150 kW)',
            torque: '310 Nm',
            transmission: 'Single-Speed Automatic',
            fuelType: 'Electric',
          },
          battery: {
            capacity: '70 kWh',
            range: '550 km (NEDC)',
            charging: 'DC Fast: 30 mins (30-80%), AC: 11 hours',
          },
          dimensions: {
            length: '4432 mm',
            width: '1833 mm',
            height: '1560 mm',
            wheelbase: '2700 mm',
            groundClearance: '150 mm',
          },
          performance: {
            topSpeed: '150 km/h',
            acceleration: '6.9 seconds (0-100 km/h)',
            energyConsumption: '14.7 kWh/100km',
          },
          features: [
            '12.3" Digital Cluster',
            '12.3" Touchscreen',
            'Over-the-Air Updates',
            'Smart Voice Control',
            'Panoramic Sunroof',
            'Heat Pump Climate System',
            'Regenerative Braking',
            'Smartphone App Control',
          ],
          safety: [
            '6 Airbags',
            'ABS with EBD',
            'Adaptive Cruise Control',
            'Lane Centering Assist',
            'Automatic Emergency Braking',
            '360° Camera System',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            battery: '8 years / 150,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 2250000,
        discountAmount: 100000,
        discountType: 'flat',
        badge: 'EV Incentive',
        taxRate: 15,
        finalPrice: 2150000,
        stock: 5,
        sku: 'GEELY-GEOMETRY-C-2024',
        reorderPoint: 2,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 6,
        heroImageUrl: '/images/vehicles/geometry-c-hero.jpg',
        heroVideoUrl: '/videos/geometry-c-hero.mp4',
      },
      create: {
        name: 'Geely Geometry C',
        slug: 'geometry-c',
        model: 'Geometry C Pro',
        year: 2024,
        category: 'Electric',
        brandId: geelyBrand.id,
        categoryId: electricCategory?.id,
        description: 'The Geometry C is a pure electric SUV with impressive range and advanced technology. Zero emissions with no compromise on performance.',
        images: [
          '/images/vehicles/geometry-c-front.jpg',
          '/images/vehicles/geometry-c-side.jpg',
          '/images/vehicles/geometry-c-rear.jpg',
          '/images/vehicles/geometry-c-interior.jpg',
        ],
        specifications: {
          engine: {
            type: 'Electric Motor',
            power: '204 HP (150 kW)',
            torque: '310 Nm',
            transmission: 'Single-Speed Automatic',
            fuelType: 'Electric',
          },
          battery: {
            capacity: '70 kWh',
            range: '550 km (NEDC)',
            charging: 'DC Fast: 30 mins (30-80%), AC: 11 hours',
          },
          dimensions: {
            length: '4432 mm',
            width: '1833 mm',
            height: '1560 mm',
            wheelbase: '2700 mm',
            groundClearance: '150 mm',
          },
          performance: {
            topSpeed: '150 km/h',
            acceleration: '6.9 seconds (0-100 km/h)',
            energyConsumption: '14.7 kWh/100km',
          },
          features: [
            '12.3" Digital Cluster',
            '12.3" Touchscreen',
            'Over-the-Air Updates',
            'Smart Voice Control',
            'Panoramic Sunroof',
            'Heat Pump Climate System',
            'Regenerative Braking',
            'Smartphone App Control',
          ],
          safety: [
            '6 Airbags',
            'ABS with EBD',
            'Adaptive Cruise Control',
            'Lane Centering Assist',
            'Automatic Emergency Braking',
            '360° Camera System',
          ],
          warranty: {
            basic: '3 years / 100,000 km',
            battery: '8 years / 150,000 km',
            powertrain: '5 years / 150,000 km',
          },
        },
        basePrice: 2250000,
        discountAmount: 100000,
        discountType: 'flat',
        badge: 'EV Incentive',
        taxRate: 15,
        finalPrice: 2150000,
        stock: 5,
        sku: 'GEELY-GEOMETRY-C-2024',
        reorderPoint: 2,
        warehouse: 'Main Warehouse',
        location: 'Sarbet Showroom',
        isFeatured: true,
        isActive: true,
        status: 'published',
        displayOrder: 6,
        heroImageUrl: '/images/vehicles/geometry-c-hero.jpg',
        heroVideoUrl: '/videos/geometry-c-hero.mp4',
      },
    }),
  ]);

  console.log(`✅ Created ${vehicles.length} vehicles\n`);

  // ===================================
  // SUMMARY
  // ===================================
  console.log('═══════════════════════════════════════');
  console.log('✅ COMPREHENSIVE DATABASE SEEDING COMPLETE!');
  console.log('═══════════════════════════════════════\n');

  console.log('📊 Data Created:');
  console.log(`  🎁 ${promotions.length} Promotions (featured & regular)`);
  console.log(`  ⭐ ${reviews.length} Customer Reviews (approved & featured)`);
  console.log(`  📰 ${newsArticles.length} News Articles (published)`);
  console.log(`  🎬 ${heroSections.length} Hero Sections (active)`);
  console.log(`  🏢 ${dealers.length} Dealer Locations`);
  console.log(`  🏷️  1 Vehicle Brand (Geely)`);
  console.log(`  📁 ${categories.length} Vehicle Categories`);
  console.log(`  🚗 ${vehicles.length} Vehicles (3 SUVs, 2 Sedans, 1 Electric)`);
  console.log('  ⚙️  Settings (social media, policies, vehicle settings)\n');

  console.log('🌐 Test Your Pages:');
  console.log('  → http://localhost:7501 (homepage with hero sections)');
  console.log('  → http://localhost:7501/offers (promotions page)');
  console.log('  → http://localhost:7501/models (all vehicles)');
  console.log('  → http://localhost:7501/models/suvs (SUV category)');
  console.log('  → http://localhost:7501/models/sedans (Sedan category)');
  console.log('  → http://localhost:7501/models/electric (Electric category)');
  console.log('  → http://localhost:7501/vehicle/coolray (vehicle detail)');
  console.log('  → http://localhost:7501/news (news articles)');
  console.log('  → http://localhost:7501/dealers (dealer locations)');
  console.log('  → http://localhost:7501/reviews (customer testimonials)\n');

  console.log('🔧 Admin Pages:');
  console.log('  → http://localhost:7501/admin/promotions');
  console.log('  → http://localhost:7501/admin/content/hero');
  console.log('  → http://localhost:7501/admin/vehicles (manage vehicles)');
  console.log('  → http://localhost:7501/admin/categories/new (add category)');
  console.log('  → http://localhost:7501/admin/news');
  console.log('  → http://localhost:7501/admin/dealers');
  console.log('  → http://localhost:7501/admin/reviews\n');

  console.log('═══════════════════════════════════════');
  console.log('🎉 Ready to test! Run: npm run dev');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
