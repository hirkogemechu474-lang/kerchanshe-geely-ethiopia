import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const faqs = [
  {
    question: 'Where can I buy a Geely vehicle in Ethiopia?',
    answer:
      'Geely vehicles are available at our authorized dealerships in Addis Ababa and across major cities in Ethiopia. You can find a complete list of showrooms and service centers on our <a href="/dealers">Dealers</a> page, or contact us to arrange a showroom visit near you.',
    category: 'Purchase',
    displayOrder: 1,
    isFeatured: true,
  },
  {
    question: 'What warranty comes with a new Geely?',
    answer:
      'Every new Geely comes with a comprehensive warranty package: a basic warranty of 3 years / 100,000 km, a powertrain warranty of 5 years / 150,000 km, and an 8-year / 150,000 km battery warranty on electric models. Paint and corrosion protection are also covered. Visit our <a href="/warranty">Warranty</a> page for full details.',
    category: 'Warranty',
    displayOrder: 2,
    isFeatured: true,
  },
  {
    question: 'How do I book a test drive?',
    answer:
      'Booking a test drive is easy. Visit our <a href="/test-drive">Test Drive</a> page, choose your preferred model, select a date and time, and submit the form. Our team will confirm your appointment and have the vehicle ready for you at your chosen dealership.',
    category: 'Purchase',
    displayOrder: 3,
    isFeatured: true,
  },
  {
    question: 'Do you offer financing options?',
    answer:
      'Yes. We partner with leading banks in Ethiopia to offer flexible financing plans with low down payments and competitive interest rates. Visit our <a href="/financing">Financing</a> page to explore the options or contact our sales team for a pre-approval.',
    category: 'Financing',
    displayOrder: 4,
  },
  {
    question: 'Can I trade in my current vehicle?',
    answer:
      'Absolutely. Our trade-in program gives you a fair market valuation for your current vehicle, which can be applied toward your new Geely purchase. Bring your vehicle to any authorized dealership for a free inspection and instant offer. Learn more on our <a href="/trade-in">Trade-In</a> page.',
    category: 'Purchase',
    displayOrder: 5,
  },
  {
    question: 'How do I schedule a service appointment?',
    answer:
      'You can book a service appointment online through our <a href="/service-booking">Service Booking</a> page or by calling your nearest Geely service center. We offer priority scheduling and a comfortable waiting area while our certified technicians care for your vehicle.',
    category: 'Service',
    displayOrder: 6,
  },
  {
    question: 'Are Geely spare parts genuine and available in Ethiopia?',
    answer:
      'Yes. We stock genuine Geely spare parts at all authorized service centers to ensure the best fit, performance, and safety for your vehicle. All genuine parts come with a manufacturer warranty. Contact your local dealer for availability and pricing.',
    category: 'Service',
    displayOrder: 7,
  },
  {
    question: 'Does Geely provide roadside assistance?',
    answer:
      'Yes. Every new Geely includes 24/7 roadside assistance for the first year, covering towing, flat tire replacement, battery jump-start, fuel delivery, and lockout service. Visit our <a href="/roadside">Roadside Assistance</a> page for the emergency contact number and coverage details.',
    category: 'Ownership',
    displayOrder: 8,
  },
  {
    question: 'How long does a Geely EV take to charge?',
    answer:
      'Charging time depends on the model and charger type. With a fast DC charger, most Geely EVs can go from 20% to 80% in about 30-40 minutes. A full charge with a standard home charger typically takes several hours overnight. See our <a href="/electric">Electric</a> page for details and the charging station map.',
    category: 'Electric',
    displayOrder: 9,
    isFeatured: true,
  },
  {
    question: 'Is there a charging station network in Ethiopia?',
    answer:
      'We are actively expanding our fast-charging network across Addis Ababa and other major cities. You can find the latest available charging stations, locations, and connector types on our <a href="/electric">Electric</a> page charging map, updated regularly.',
    category: 'Electric',
    displayOrder: 10,
  },
  {
    question: 'What is Geely\'s after-sales service coverage?',
    answer:
      'Geely Ethiopia maintains a growing network of authorized service centers staffed by certified technicians using genuine parts and advanced diagnostic equipment. Regular maintenance schedules and service packages are available to keep your vehicle in peak condition.',
    category: 'Service',
    displayOrder: 11,
  },
  {
    question: 'How can I contact Geely Ethiopia for support?',
    answer:
      'You can reach us through our <a href="/contact">Contact</a> page, call our head office, or visit any authorized dealer or service center. Our team is ready to assist with sales, service, parts, and general inquiries during business hours.',
    category: 'General',
    displayOrder: 12,
  },
];

async function main() {
  console.log('🌱 Seeding FAQs...\n');

  // Clear existing FAQs
  console.log('🗑️ Clearing existing FAQs...');
  await prisma.fAQ.deleteMany();
  console.log('✅ Existing FAQs cleared\n');

  // Create FAQs
  console.log('📋 Creating FAQs...');
  let featured = 0;
  for (const faq of faqs) {
    await prisma.fAQ.create({
      data: {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        displayOrder: faq.displayOrder,
        isActive: true,
        isFeatured: faq.isFeatured || false,
      },
    });
    if (faq.isFeatured) featured++;
  }
  console.log(`✅ Created ${faqs.length} FAQs (${featured} featured)\n`);

  console.log('═══════════════════════════════════════');
  console.log('✅ FAQ SEEDING COMPLETE!');
  console.log('═══════════════════════════════════════\n');

  console.log('🌐 Test:');
  console.log('  → Homepage FAQ section: http://localhost:7501');
  console.log('  → FAQ page: http://localhost:7501/faq');
  console.log('  → Admin FAQ management: http://localhost:7501/admin/faq\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding FAQs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
