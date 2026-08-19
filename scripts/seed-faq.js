const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFAQ() {
  console.log('🌱 Seeding FAQ data...');

  try {
    // Clear existing FAQs
    await prisma.fAQ.deleteMany();

    // Sample FAQs
    const faqs = [
      {
        question: 'What is the warranty period for Geely vehicles?',
        answer: '<p>All Geely vehicles come with comprehensive warranty coverage:</p><ul><li><strong>Basic Warranty:</strong> 3 years or 100,000 km</li><li><strong>Powertrain Warranty:</strong> 5 years or 150,000 km</li><li><strong>Battery Warranty (EVs):</strong> 8 years or 150,000 km</li></ul>',
        category: 'Warranty',
        displayOrder: 0,
        isFeatured: true,
      },
      {
        question: 'How can I schedule a service appointment?',
        answer: '<p>You can schedule a service appointment through multiple convenient ways:</p><ul><li>Visit our <a href="/services/service-booking">online booking system</a></li><li>Call our service center directly</li><li>Visit any authorized Geely service center</li><li>Use our mobile app (coming soon)</li></ul><p>We recommend booking in advance to ensure your preferred time slot.</p>',
        category: 'Service',
        displayOrder: 1,
        isFeatured: true,
      },
      {
        question: 'Do you offer financing options for Geely vehicles?',
        answer: '<p>Yes! We offer flexible financing solutions through partnerships with leading banks:</p><ul><li>Traditional auto loans up to 7 years</li><li>Low down payment plans</li><li>Competitive interest rates</li><li>Quick approval process</li></ul><p><a href="/services/financing">Learn more about our financing options</a> or speak with our sales team.</p>',
        category: 'Purchase',
        displayOrder: 2,
        isFeatured: true,
      },
      {
        question: 'What should I bring for a test drive?',
        answer: '<p>To schedule and complete your test drive, please bring:</p><ul><li>Valid driver\'s license</li><li>Proof of insurance (for extended test drives)</li><li>Contact information</li></ul><p>Test drives typically last 15-30 minutes and include city and highway driving. <a href="/services/test-drive">Book your test drive today!</a></p>',
        category: 'Purchase',
        displayOrder: 3,
        isFeatured: false,
      },
      {
        question: 'Are genuine Geely spare parts available locally?',
        answer: '<p>Yes, we maintain a comprehensive inventory of genuine Geely spare parts at all our service centers. We stock:</p><ul><li>Engine components</li><li>Brake systems and pads</li><li>Filters and fluids</li><li>Electrical components</li><li>Body panels and accessories</li></ul><p>If a part is not in stock, we can order it with fast delivery from our central warehouse.</p>',
        category: 'Service',
        displayOrder: 4,
        isFeatured: false,
      },
      {
        question: 'How do I activate my vehicle\'s warranty?',
        answer: '<p>Your Geely warranty is automatically activated upon delivery. However, to ensure full coverage:</p><ol><li>Keep your warranty booklet safe</li><li>Follow the recommended service schedule</li><li>Use only authorized service centers</li><li>Keep all service records</li></ol><p>Your dealer will explain all warranty terms during delivery.</p>',
        category: 'Warranty',
        displayOrder: 5,
        isFeatured: false,
      },
      {
        question: 'What is included in regular maintenance?',
        answer: '<p>Regular maintenance typically includes:</p><ul><li>Engine oil and filter change</li><li>Tire rotation and pressure check</li><li>Brake inspection</li><li>Battery testing</li><li>Fluid level checks</li><li>Visual inspection of belts and hoses</li></ul><p>Maintenance intervals vary by model, typically every 10,000km or 6 months.</p>',
        category: 'Service',
        displayOrder: 6,
        isFeatured: false,
      },
      {
        question: 'Can I trade in my current vehicle?',
        answer: '<p>Absolutely! We offer competitive trade-in valuations for all vehicle brands. Benefits include:</p><ul><li>Fair market assessment</li><li>Instant evaluation process</li><li>Reduces your down payment</li><li>Tax benefits on your purchase</li><li>No hassle of selling privately</li></ul><p><a href="/services/trade-in">Get your trade-in quote today!</a></p>',
        category: 'Purchase',
        displayOrder: 7,
        isFeatured: false,
      },
    ];

    // Create FAQs
    for (const faq of faqs) {
      await prisma.fAQ.create({
        data: faq,
      });
    }

    console.log('✅ FAQ data seeded successfully!');
    console.log(`- ${faqs.length} FAQs created`);
    console.log('- 3 featured FAQs');
    console.log('- 4 categories: Warranty, Service, Purchase');
    
  } catch (error) {
    console.error('❌ Error seeding FAQ data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFAQ();