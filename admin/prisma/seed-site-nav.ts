import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Trimmed to match the nav pattern used on Geely's regional distributor
// sites (e.g. geely.com.eg): Models, Company, After-Sales Services, Dealers,
// Contact — rather than every section the site happens to have a page for.
// Mirrors web/components/Header.tsx's DEFAULT_NAV_ITEMS fallback, so the
// pre-fetch fallback and the seeded CMS data stay in sync.
const topNav = [
  { label: 'Models', href: '/models', displayOrder: 1 },
  { label: 'Company', href: '/about', displayOrder: 2 },
  { label: 'After-Sales Services', href: '/service', displayOrder: 3 },
  { label: 'Dealers', href: '/dealers', displayOrder: 4 },
  { label: 'Contact Us', href: '/contact', displayOrder: 5 },
];

const quickActions = [
  {
    label: 'Compare Models',
    subtitle: 'Side-by-side comparison',
    href: '/compare',
    icon: 'BarChart3',
    displayOrder: 1,
  },
  {
    label: 'Build & Price',
    subtitle: 'Configure your vehicle',
    href: '/configure',
    icon: 'Settings',
    displayOrder: 2,
  },
  {
    label: 'View All Models',
    subtitle: 'Complete vehicle lineup',
    href: '/models',
    icon: 'ArrowRight',
    isHighlighted: true,
    displayOrder: 3,
  },
  {
    label: 'Finance Calculator',
    subtitle: 'Calculate monthly payments',
    href: '/financing',
    icon: 'BarChart3',
    displayOrder: 4,
  },
];

async function main() {
  console.log('🌱 Seeding Site Navigation...\n');

  const existing = await prisma.siteNavItem.count();
  if (existing > 0) {
    console.log(`⏭️  ${existing} SiteNavItem rows already exist — skipping (delete them first to reseed).`);
    return;
  }

  for (const item of topNav) {
    await prisma.siteNavItem.create({ data: { placement: 'TOP_NAV', ...item } });
  }
  console.log(`✅ Created ${topNav.length} top nav items`);

  for (const item of quickActions) {
    await prisma.siteNavItem.create({ data: { placement: 'MODELS_QUICK_ACTIONS', ...item } });
  }
  console.log(`✅ Created ${quickActions.length} Quick Actions items`);

  console.log('\n═══════════════════════════════════════');
  console.log('✅ SITE NAVIGATION SEEDING COMPLETE!');
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding site navigation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
