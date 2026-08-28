import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Child-before-parent order so FK constraints never block a delete.
// Catalog/CMS/config/login tables (Vehicle, User, Dealer, Setting, etc.)
// are deliberately excluded — see admin/scripts/create-admin.ts for how
// to re-bootstrap an admin login if User is ever wiped separately.
const TABLES = [
  'cSISurveyResponse',
  'warrantyClaimStatusHistory',
  'warrantyClaim',
  'jobCardPart',
  'jobCardStatusHistory',
  'jobCard',
  'customerVehicle',
  'customer',
  'serviceBooking',
  'pdiChecklistItem',
  'salesOrderStatusHistory',
  'vehicleAllocation',
  'testDrive',
  'salesOrder',
  'quotation',
  'showroomVisit',
  'partRequestItem',
  'partRequest',
  'review',
  'message',
  'cRMSyncLog',
  'newsletterSubscriber',
] as const;

type Delegate = { count(): Prisma.PrismaPromise<number>; deleteMany(): Prisma.PrismaPromise<Prisma.BatchPayload> };

function delegate(table: (typeof TABLES)[number]): Delegate {
  return (prisma as unknown as Record<string, Delegate>)[table];
}

async function main() {
  const confirmed = process.argv.includes('--yes');

  const counts = await Promise.all(
    TABLES.map(async (table) => ({ table, count: await delegate(table).count() }))
  );

  console.log(confirmed ? 'Deleting rows:' : 'Dry run (pass --yes to actually delete):');
  for (const { table, count } of counts) {
    console.log(`  ${table}: ${count}`);
  }

  if (!confirmed) {
    console.log('\nNo changes made. Re-run with --yes to delete the rows above.');
    return;
  }

  await prisma.$transaction(TABLES.map((table) => delegate(table).deleteMany()));

  console.log('\n✅ Transactional data cleared. Catalog, CMS content, and admin logins were left untouched.');
}

main()
  .catch((error) => {
    console.error('❌ Error resetting transactional data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
