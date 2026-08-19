import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ethiopian banks commonly offering vehicle/auto loans
const banks = [
  {
    name: 'Commercial Bank of Ethiopia',
    slug: 'commercial-bank-of-ethiopia',
    websiteUrl: 'https://www.combanketh.et',
    phoneNumber: '+251 11 551 4288',
    email: 'info@combanketh.et',
    branchAddress: 'Churchill Avenue, Addis Ababa',
    shortDescription:
      "Ethiopia's largest bank, offering competitive auto financing through its wide branch network.",
    isActive: true,
    displayOrder: 1,
  },
  {
    name: 'Dashen Bank',
    slug: 'dashen-bank',
    websiteUrl: 'https://www.dashenbanksc.com',
    phoneNumber: '+251 11 552 1976',
    email: 'info@dashenbanksc.com',
    branchAddress: 'Bole Road, Addis Ababa',
    shortDescription:
      'Leading private bank with flexible vehicle loan options and fast approvals.',
    isActive: true,
    displayOrder: 2,
  },
  {
    name: 'Awash Bank',
    slug: 'awash-bank',
    websiteUrl: 'https://www.awashbank.com',
    phoneNumber: '+251 11 551 0322',
    email: 'info@awashbank.com',
    branchAddress: 'Ras Abebe Aregay Street, Addis Ababa',
    shortDescription:
      "Ethiopia's largest private bank, offering attractive auto loan packages.",
    isActive: true,
    displayOrder: 3,
  },
  {
    name: 'Bank of Abyssinia',
    slug: 'bank-of-abyssinia',
    websiteUrl: 'https://www.bankofabyssinia.com',
    phoneNumber: '+251 11 550 5500',
    email: 'info@bankofabyssinia.com',
    branchAddress: 'Lideta, Addis Ababa',
    shortDescription:
      'Customer-focused banking with tailored financing for new vehicle purchases.',
    isActive: true,
    displayOrder: 4,
  },
];

type ProgramSeed = {
  name: string;
  slug: string;
  bankSlug: string;
  interestRate: number;
  downPaymentPercent: number;
  minDownPaymentPercent: number;
  maxDownPaymentPercent: number;
  tenureMonths: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  processingFeePercent: number;
  processingFeeMin?: number;
  processingFeeMax?: number;
  insurancePercent: number;
  vehicleSlug?: string;
  vehicleCategorySlug?: string;
  appliesToAllVehicles: boolean;
  applyEnabled: boolean;
  applyUrl?: string;
  applyLabel?: string;
  directPayEnabled: boolean;
  directPayUrl?: string;
  directPayLabel?: string;
  visitShowroomEnabled: boolean;
  visitShowroomUrl?: string;
  visitShowroomLabel?: string;
  scheduleEnabled: boolean;
  scheduleUrl?: string;
  badgeText?: string;
  highlightBadge: boolean;
  finePrint?: string;
  eligibilityNote?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  displayOrder: number;
};

const programs: ProgramSeed[] = [
  {
    name: 'CBE Standard Auto Loan — Up to 7 Years',
    slug: 'cbe-standard-auto-loan-7y',
    bankSlug: 'commercial-bank-of-ethiopia',
    interestRate: 14.5,
    downPaymentPercent: 30,
    minDownPaymentPercent: 20,
    maxDownPaymentPercent: 50,
    tenureMonths: 84,
    minTenureMonths: 12,
    maxTenureMonths: 84,
    processingFeePercent: 2,
    processingFeeMin: 5000,
    processingFeeMax: 30000,
    insurancePercent: 5,
    appliesToAllVehicles: true,
    applyEnabled: true,
    applyUrl: '/financing/apply',
    applyLabel: 'Apply for Financing',
    directPayEnabled: false,
    visitShowroomEnabled: true,
    visitShowroomUrl: '/dealers',
    scheduleEnabled: true,
    scheduleUrl: '/schedule',
    badgeText: 'Most Popular',
    highlightBadge: true,
    finePrint:
      'Rates subject to CBE credit assessment and market conditions. Terms and conditions apply.',
    eligibilityNote:
      'Ethiopian citizens/residents with verifiable income. CBE account holders preferred.',
    status: 'PUBLISHED',
    displayOrder: 1,
  },
  {
    name: 'Dashen Bank Flexi Auto Loan',
    slug: 'dashen-flexi-auto-loan',
    bankSlug: 'dashen-bank',
    interestRate: 15.0,
    downPaymentPercent: 25,
    minDownPaymentPercent: 20,
    maxDownPaymentPercent: 60,
    tenureMonths: 60,
    minTenureMonths: 12,
    maxTenureMonths: 72,
    processingFeePercent: 2.5,
    processingFeeMin: 4000,
    processingFeeMax: 25000,
    insurancePercent: 5,
    vehicleCategorySlug: 'suvs',
    appliesToAllVehicles: false,
    applyEnabled: true,
    applyUrl: '/financing/apply',
    applyLabel: 'Apply Now',
    directPayEnabled: false,
    visitShowroomEnabled: true,
    visitShowroomUrl: '/dealers',
    visitShowroomLabel: 'Visit Showroom',
    scheduleEnabled: true,
    badgeText: 'SUV Special',
    highlightBadge: false,
    finePrint:
      'Applicable to SUV models. Subject to bank approval and prevailing NBE directives.',
    eligibilityNote:
      'Salaried and self-employed customers with 2+ years verifiable employment.',
    status: 'PUBLISHED',
    displayOrder: 2,
  },
  {
    name: 'Awash Bank Low Down Payment Plan',
    slug: 'awash-low-down-payment',
    bankSlug: 'awash-bank',
    interestRate: 15.5,
    downPaymentPercent: 20,
    minDownPaymentPercent: 15,
    maxDownPaymentPercent: 50,
    tenureMonths: 60,
    minTenureMonths: 24,
    maxTenureMonths: 84,
    processingFeePercent: 2,
    processingFeeMin: 4500,
    processingFeeMax: 28000,
    insurancePercent: 5,
    appliesToAllVehicles: true,
    applyEnabled: true,
    applyUrl: '/financing/apply',
    applyLabel: 'Apply for Financing',
    directPayEnabled: false,
    visitShowroomEnabled: true,
    visitShowroomUrl: '/dealers',
    scheduleEnabled: true,
    scheduleUrl: '/schedule',
    badgeText: 'Low Down Payment',
    highlightBadge: false,
    finePrint: 'Terms and conditions apply. Minimum loan amount ETB 200,000.',
    eligibilityNote:
      'Ideal for first-time buyers. Proof of income and employment letter required.',
    status: 'PUBLISHED',
    displayOrder: 3,
  },
  {
    name: 'Bank of Abyssinia EV Green Loan',
    slug: 'boa-ev-green-loan',
    bankSlug: 'bank-of-abyssinia',
    interestRate: 13.5,
    downPaymentPercent: 20,
    minDownPaymentPercent: 15,
    maxDownPaymentPercent: 50,
    tenureMonths: 60,
    minTenureMonths: 12,
    maxTenureMonths: 72,
    processingFeePercent: 1.5,
    processingFeeMin: 3500,
    processingFeeMax: 20000,
    insurancePercent: 4,
    vehicleCategorySlug: 'electric',
    appliesToAllVehicles: false,
    applyEnabled: true,
    applyUrl: '/financing/apply',
    applyLabel: 'Apply Now',
    directPayEnabled: false,
    visitShowroomEnabled: true,
    visitShowroomUrl: '/dealers',
    scheduleEnabled: true,
    badgeText: 'Best EV Rate',
    highlightBadge: false,
    finePrint:
      'Exclusive green financing for electric vehicles. Reduced processing fee applies.',
    eligibilityNote:
      'Available for all electric models. Enjoy the lowest processing fee in the market.',
    status: 'PUBLISHED',
    displayOrder: 4,
  },
  {
    name: 'CBE Premium Sedan Program',
    slug: 'cbe-premium-sedan-program',
    bankSlug: 'commercial-bank-of-ethiopia',
    interestRate: 14.0,
    downPaymentPercent: 25,
    minDownPaymentPercent: 20,
    maxDownPaymentPercent: 40,
    tenureMonths: 60,
    minTenureMonths: 12,
    maxTenureMonths: 84,
    processingFeePercent: 1.5,
    processingFeeMin: 4000,
    processingFeeMax: 20000,
    insurancePercent: 5,
    vehicleCategorySlug: 'sedans',
    appliesToAllVehicles: false,
    applyEnabled: true,
    applyUrl: '/financing/apply',
    applyLabel: 'Apply for Financing',
    directPayEnabled: false,
    visitShowroomEnabled: true,
    visitShowroomUrl: '/dealers',
    scheduleEnabled: true,
    scheduleUrl: '/schedule',
    badgeText: 'Low Rate',
    highlightBadge: false,
    finePrint: 'Rates subject to change. Subject to CBE credit approval.',
    eligibilityNote: 'Competitive rate for sedan models with reduced processing fee.',
    status: 'PUBLISHED',
    displayOrder: 5,
  },
];

async function main() {
  console.log('🌱 Seeding financing banks & programs...');

  const createdBanks: Record<string, string> = {};

  // Upsert banks (slug is unique)
  for (const bank of banks) {
    const existing = await prisma.financingBank.findUnique({ where: { slug: bank.slug } });
    const saved = await prisma.financingBank.upsert({
      where: { slug: bank.slug },
      update: bank,
      create: bank,
    });
    createdBanks[bank.slug] = saved.id;
    console.log(
      `${existing ? '✅ Updated' : '✅ Created'} bank: ${bank.name}`
    );
  }

  // Cache vehicles & categories by slug for program links
  const vehicles = await prisma.vehicle.findMany({ select: { id: true, slug: true } });
  const vehicleIdBySlug: Record<string, string> = {};
  vehicles.forEach(v => { vehicleIdBySlug[v.slug] = v.id; });

  const categories = await prisma.vehicleCategory.findMany({ select: { id: true, slug: true } });
  const categoryIdBySlug: Record<string, string> = {};
  categories.forEach(c => { categoryIdBySlug[c.slug] = c.id; });

  for (const p of programs) {
    const bankId = createdBanks[p.bankSlug];
    if (!bankId) {
      console.warn(`⚠️ Skipping program "${p.name}" — bank slug "${p.bankSlug}" not found`);
      continue;
    }

    const data = {
      name: p.name,
      slug: p.slug,
      bankId,
      interestRate: p.interestRate,
      downPaymentPercent: p.downPaymentPercent,
      minDownPaymentPercent: p.minDownPaymentPercent,
      maxDownPaymentPercent: p.maxDownPaymentPercent,
      tenureMonths: p.tenureMonths,
      minTenureMonths: p.minTenureMonths,
      maxTenureMonths: p.maxTenureMonths,
      processingFeePercent: p.processingFeePercent,
      processingFeeMin: p.processingFeeMin,
      processingFeeMax: p.processingFeeMax,
      insurancePercent: p.insurancePercent,
      vehicleId: p.vehicleSlug ? vehicleIdBySlug[p.vehicleSlug] ?? null : null,
      vehicleCategoryId: p.vehicleCategorySlug
        ? categoryIdBySlug[p.vehicleCategorySlug] ?? null
        : null,
      appliesToAllVehicles: p.appliesToAllVehicles,
      applyEnabled: p.applyEnabled,
      applyUrl: p.applyUrl ?? null,
      applyLabel: p.applyLabel ?? null,
      directPayEnabled: p.directPayEnabled,
      directPayUrl: p.directPayUrl ?? null,
      directPayLabel: p.directPayLabel ?? null,
      visitShowroomEnabled: p.visitShowroomEnabled,
      visitShowroomUrl: p.visitShowroomUrl ?? null,
      visitShowroomLabel: p.visitShowroomLabel ?? null,
      scheduleEnabled: p.scheduleEnabled,
      scheduleUrl: p.scheduleUrl ?? null,
      badgeText: p.badgeText ?? null,
      highlightBadge: p.highlightBadge,
      finePrint: p.finePrint ?? null,
      eligibilityNote: p.eligibilityNote ?? null,
      status: p.status,
      publishedAt: p.status === 'PUBLISHED' ? new Date() : null,
      displayOrder: p.displayOrder,
    };

    const existing = await prisma.financingProgram.findUnique({ where: { slug: p.slug } });
    await prisma.financingProgram.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });
    console.log(`${existing ? '✅ Updated' : '✅ Created'} program: ${p.name}`);
  }

  console.log('🎉 Financing data seeded successfully!');
  console.log('\n💡 Public page: http://localhost:3002/financing');
  console.log('💡 Admin page: http://localhost:3001/admin/financing');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding financing data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
