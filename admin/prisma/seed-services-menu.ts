import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Services Menu...\n');

  // Clear existing services menu data
  console.log('🗑️ Clearing existing services data...');
  await prisma.servicePage.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.serviceSection.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create Sections
  console.log('📁 Creating sections...');
  
  const salesSection = await prisma.serviceSection.create({
    data: {
      title: 'Sales',
      slug: 'sales',
      description: 'Vehicle sales and purchase services',
      isActive: true,
      displayOrder: 1,
    },
  });

  const servicePartsSection = await prisma.serviceSection.create({
    data: {
      title: 'Service & Parts',
      slug: 'service-parts',
      description: 'After-sales service and genuine parts',
      isActive: true,
      displayOrder: 2,
    },
  });

  console.log('✅ Created 2 sections\n');

  // Create Items and Pages for Sales Section
  console.log('📋 Creating sales items and pages...');
  
  const testDriveItem = await prisma.serviceItem.create({
    data: {
      sectionId: salesSection.id,
      title: 'Test Drive',
      description: 'Book a test drive today',
      icon: 'Car',
      url: '/test-drive',
      isActive: true,
      isFeatured: true,
      displayOrder: 1,
    },
  });

  await prisma.servicePage.create({
    data: {
      title: 'Book a Test Drive',
      slug: 'test-drive',
      excerpt: 'Experience Geely excellence firsthand',
      content: `
        <h1>Experience Geely Excellence</h1>
        <p>Nothing compares to experiencing a Geely vehicle firsthand. Book a test drive at your nearest dealership and discover the perfect blend of innovation, comfort, and performance.</p>
        
        <h2>Why Test Drive?</h2>
        <ul>
          <li>Feel the superior ride quality and handling</li>
          <li>Experience advanced safety features</li>
          <li>Test the latest technology and infotainment</li>
          <li>Get expert advice from our sales team</li>
        </ul>
        
        <h2>What to Expect</h2>
        <p>Your test drive experience includes a comprehensive demonstration of your chosen vehicle's features, a guided route through various driving conditions, and answers to all your questions.</p>
      `,
      heroImage: '/images/services/test-drive-hero.jpg',
      metaTitle: 'Book a Geely Test Drive | Experience Excellence',
      metaDescription: 'Schedule your test drive today and experience Geely\'s superior engineering, advanced safety, and modern design firsthand.',
      isPublished: true,
    },
  });

  const getQuoteItem = await prisma.serviceItem.create({
    data: {
      sectionId: salesSection.id,
      title: 'Get Quote',
      description: 'Personalized pricing',
      icon: 'Calculator',
      url: '/quote',
      isActive: true,
      displayOrder: 2,
    },
  });

  await prisma.servicePage.create({
    data: {
      title: 'Get Your Personalized Quote',
      slug: 'get-quote',
      excerpt: 'Transparent pricing with no surprises',
      content: `
        <h1>Transparent Pricing, No Surprises</h1>
        <p>Get a detailed, personalized quote for your dream Geely vehicle. Our pricing is competitive, transparent, and includes all applicable features and options.</p>
        
        <h2>What's Included</h2>
        <ul>
          <li>Complete vehicle pricing breakdown</li>
          <li>Available financing options</li>
          <li>Trade-in valuation (if applicable)</li>
          <li>Insurance estimates</li>
          <li>Registration and documentation fees</li>
        </ul>
        
        <h2>Quick and Easy Process</h2>
        <p>Simply fill out our online form or visit your nearest dealership. Our sales team will prepare a comprehensive quote tailored to your needs within 24 hours.</p>
      `,
      heroImage: '/images/services/quote-hero.jpg',
      metaTitle: 'Get Your Geely Quote | Transparent Pricing',
      metaDescription: 'Request a personalized quote for your Geely vehicle with transparent pricing, financing options, and trade-in valuation.',
      isPublished: true,
    },
  });

  const tradeInItem = await prisma.serviceItem.create({
    data: {
      sectionId: salesSection.id,
      title: 'Trade-In',
      description: 'Trade your current vehicle',
      icon: 'RefreshCw',
      url: '/trade-in',
      isActive: true,
      displayOrder: 3,
    },
  });

  await prisma.servicePage.create({
    data: {
      title: 'Trade-In Your Vehicle',
      slug: 'trade-in',
      excerpt: 'Upgrade to Geely with ease',
      content: `
        <h1>Upgrade to Geely with Ease</h1>
        <p>Trading in your current vehicle is the easiest way to upgrade to a new Geely. We offer competitive valuations and a hassle-free process.</p>
        
        <h2>Trade-In Benefits</h2>
        <ul>
          <li>Fair market valuation</li>
          <li>Instant assessment available</li>
          <li>Reduces your down payment</li>
          <li>Tax benefits on your purchase</li>
          <li>No need to sell privately</li>
        </ul>
        
        <h2>How It Works</h2>
        <ol>
          <li>Bring your vehicle to any Geely dealership</li>
          <li>Our experts inspect and evaluate your vehicle</li>
          <li>Receive a competitive offer within minutes</li>
          <li>Apply the value towards your new Geely</li>
        </ol>
      `,
      heroImage: '/images/services/trade-in-hero.jpg',
      metaTitle: 'Trade-In Your Vehicle | Geely Ethiopia',
      metaDescription: 'Get a competitive valuation for your current vehicle and upgrade to a new Geely with our hassle-free trade-in program.',
      isPublished: true,
    },
  });

  const financingItem = await prisma.serviceItem.create({
    data: {
      sectionId: salesSection.id,
      title: 'Financing',
      description: 'Flexible payment options',
      icon: 'CreditCard',
      url: '/financing',
      isActive: true,
      displayOrder: 4,
    },
  });

  await prisma.servicePage.create({
    data: {
      title: 'Flexible Financing Options',
      slug: 'financing',
      excerpt: 'Drive your dream Geely today',
      content: `
        <h1>Drive Your Dream Geely Today</h1>
        <p>Make your Geely purchase affordable with our flexible financing solutions. We partner with leading banks to offer competitive rates and terms that suit your budget.</p>
        
        <h2>Financing Options</h2>
        <ul>
          <li>Traditional auto loans (up to 7 years)</li>
          <li>Low down payment plans</li>
          <li>Competitive interest rates</li>
          <li>Quick approval process</li>
          <li>Flexible monthly payment terms</li>
        </ul>
        
        <h2>Special Offers</h2>
        <p>Check our current promotions for special financing rates, including 0% APR on select models and extended warranty packages.</p>
        
        <h2>Pre-Approval</h2>
        <p>Get pre-approved for financing before you visit. Know your budget and shop with confidence.</p>
      `,
      heroImage: '/images/services/financing-hero.jpg',
      metaTitle: 'Geely Financing Options | Flexible Payment Plans',
      metaDescription: 'Explore flexible financing options for your Geely purchase with competitive rates, low down payments, and quick approval.',
      isPublished: true,
    },
  });

  console.log('✅ Created 4 sales items with pages\n');

  // Create Items and Pages for Service & Parts Section
  console.log('🔧 Creating service items and pages...');

  const serviceBookingItem = await prisma.serviceItem.create({
    data: {
      sectionId: servicePartsSection.id,
      title: 'Service Booking',
      description: 'Schedule maintenance',
      icon: 'Calendar',
      url: '/service',
      isActive: true,
      isFeatured: true,
      displayOrder: 1,
    },
  });

  await prisma.servicePage.create({
    data: {
      title: 'Book Your Service Appointment',
      slug: 'service-booking',
      excerpt: 'Expert care for your Geely',
      content: `
        <h1>Expert Care for Your Geely</h1>
        <p>Keep your Geely running smoothly with professional service from our certified technicians. Book your appointment online and enjoy priority service.</p>
        
        <h2>Service Types</h2>
        <ul>
          <li>Routine maintenance (oil change, filters, etc.)</li>
          <li>Scheduled inspections</li>
          <li>Brake service</li>
          <li>Tire rotation and alignment</li>
          <li>Battery testing and replacement</li>
          <li>Air conditioning service</li>
          <li>Diagnostic services</li>
        </ul>
        
        <h2>Why Choose Geely Service?</h2>
        <ul>
          <li>Certified technicians trained by Geely</li>
          <li>Genuine parts guaranteed</li>
          <li>Advanced diagnostic equipment</li>
          <li>Warranty-compliant service</li>
          <li>Comfortable waiting area</li>
        </ul>
      `,
      heroImage: '/images/services/service-booking-hero.jpg',
      metaTitle: 'Book Geely Service Appointment | Expert Care',
      metaDescription: 'Schedule your Geely service appointment with certified technicians using genuine parts and advanced equipment.',
      isPublished: true,
    },
  });

  const sparePartsItem = await prisma.serviceItem.create({
    data: {
      sectionId: servicePartsSection.id,
      title: 'Spare Parts',
      description: 'Genuine Geely parts',
      icon: 'Package',
      url: '/parts',
      isActive: true,
      displayOrder: 2,
    },
  });

  await prisma.servicePage.create({
    data: {
      title: 'Genuine Geely Spare Parts',
      slug: 'parts',
      excerpt: 'Quality parts for lasting performance',
      content: `
        <h1>Quality Parts for Lasting Performance</h1>
        <p>Maintain your Geely's performance and safety with genuine spare parts. Every part is designed specifically for your vehicle and comes with a manufacturer warranty.</p>
        
        <h2>Available Parts</h2>
        <ul>
          <li>Engine components</li>
          <li>Brake systems</li>
          <li>Suspension parts</li>
          <li>Electrical components</li>
          <li>Filters and fluids</li>
          <li>Body panels and accessories</li>
          <li>Interior components</li>
        </ul>
        
        <h2>Why Genuine Parts?</h2>
        <ul>
          <li>Perfect fit guaranteed</li>
          <li>Manufacturer warranty coverage</li>
          <li>Optimal performance and safety</li>
          <li>Longer lifespan</li>
          <li>Maintains vehicle value</li>
        </ul>
      `,
      heroImage: '/images/services/spare-parts-hero.jpg',
      metaTitle: 'Genuine Geely Spare Parts | Quality Guaranteed',
      metaDescription: 'Order genuine Geely spare parts with manufacturer warranty for optimal performance, safety, and longevity.',
      isPublished: true,
    },
  });

  const warrantyItem = await prisma.serviceItem.create({
    data: {
      sectionId: servicePartsSection.id,
      title: 'Warranty',
      description: '5-year comprehensive warranty',
      icon: 'Shield',
      url: '/warranty',
      isActive: true,
      displayOrder: 3,
    },
  });

  await prisma.servicePage.create({
    data: {
      title: 'Comprehensive Warranty Coverage',
      slug: 'warranty',
      excerpt: 'Drive with confidence',
      content: `
        <h1>Drive with Confidence</h1>
        <p>Every Geely vehicle comes with comprehensive warranty coverage for complete peace of mind. We stand behind the quality and reliability of our vehicles.</p>
        
        <h2>Warranty Coverage</h2>
        <ul>
          <li><strong>Basic Warranty:</strong> 3 years / 100,000 km</li>
          <li><strong>Powertrain Warranty:</strong> 5 years / 150,000 km</li>
          <li><strong>Battery Warranty (EVs):</strong> 8 years / 150,000 km</li>
          <li><strong>Paint Warranty:</strong> 3 years</li>
          <li><strong>Corrosion Warranty:</strong> 7 years</li>
        </ul>
        
        <h2>What's Covered</h2>
        <p>Our warranty covers all manufacturing defects, components, and workmanship. This includes engine, transmission, electrical systems, and more.</p>
        
        <h2>Warranty Claims</h2>
        <p>Making a warranty claim is simple. Visit any authorized Geely service center with your warranty booklet. Our team will handle the rest.</p>
      `,
      heroImage: '/images/services/warranty-hero.jpg',
      metaTitle: 'Geely Warranty Coverage | 5-Year Protection',
      metaDescription: 'Comprehensive warranty coverage for your Geely including 5-year powertrain warranty and 8-year battery warranty for electric vehicles.',
      isPublished: true,
    },
  });

  const roadsideItem = await prisma.serviceItem.create({
    data: {
      sectionId: servicePartsSection.id,
      title: 'Roadside Assistance',
      description: '24/7 emergency support',
      icon: 'Phone',
      url: '/roadside',
      isActive: true,
      displayOrder: 4,
    },
  });

  await prisma.servicePage.create({
    data: {
      title: '24/7 Roadside Assistance',
      slug: 'roadside-assistance',
      excerpt: 'Help when you need it most',
      content: `
        <h1>Help When You Need It Most</h1>
        <p>Geely Roadside Assistance is available 24/7 to help you with emergency situations. Whether you're stuck with a flat tire or need a tow, we're just a phone call away.</p>
        
        <h2>Services Included</h2>
        <ul>
          <li>24/7 emergency hotline</li>
          <li>Towing to nearest Geely service center</li>
          <li>Flat tire replacement</li>
          <li>Battery jump-start</li>
          <li>Fuel delivery</li>
          <li>Lockout service</li>
          <li>Minor roadside repairs</li>
        </ul>
        
        <h2>Coverage</h2>
        <p>Roadside assistance is included free for the first year with every new Geely purchase. Extended plans are available for continued peace of mind.</p>
        
        <h2>Emergency Contact</h2>
        <p><strong>Call: +251 11 000 0000</strong></p>
        <p>Available 24 hours a day, 365 days a year</p>
      `,
      heroImage: '/images/services/roadside-hero.jpg',
      metaTitle: 'Geely Roadside Assistance | 24/7 Emergency Support',
      metaDescription: '24/7 roadside assistance for Geely owners including towing, flat tire service, battery jump-start, and emergency support.',
      isPublished: true,
    },
  });

  console.log('✅ Created 4 service items with pages\n');

  console.log('═══════════════════════════════════════');
  console.log('✅ SERVICES MENU SEEDING COMPLETE!');
  console.log('═══════════════════════════════════════\n');

  console.log('📊 Created:');
  console.log('  📁 2 Sections (Sales, Service & Parts)');
  console.log('  📋 8 Menu Items');
  console.log('  📄 8 Service Pages (all published)\n');

  console.log('🌐 Test Admin:');
  console.log('  → http://localhost:3000/admin/services-menu\n');

  console.log('🔗 Test Frontend (coming soon):');
  console.log('  → Hover over "Services" in navigation');
  console.log('  → Visit /services/test-drive');
  console.log('  → Visit /services/service-booking\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding services menu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
