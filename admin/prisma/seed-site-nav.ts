import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mirrors exactly what was hardcoded in web/components/Header.tsx (mainNavItems)
// and web/components/VehicleDropdown.tsx (Quick Actions) before both were made
// admin-editable, so switching to SiteNavItem is behaviorally invisible until
// an admin edits something.
const topNav = [
  { label: 'Models', href: '/models', displayOrder: 1 },
  { label: 'Electric', href: '/electric', icon: 'Zap', displayOrder: 2 },
  { label: 'Technology', href: '/technology', displayOrder: 3 },
  { label: 'Services', href: '/service', displayOrder: 4 },
  { label: 'Dealers', href: '/dealers', displayOrder: 5 },
  { label: 'Financing', href: '/financing', displayOrder: 6 },
  { label: 'News', href: '/news', displayOrder: 7 },
  { label: 'About', href: '/about', displayOrder: 8 },
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
