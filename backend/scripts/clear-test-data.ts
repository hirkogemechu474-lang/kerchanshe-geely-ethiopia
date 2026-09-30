// Clears UAT / testing transactions before go-live, keeping everything that is
// real setup: users, vehicles/models/trims/colours/galleries, site content &
// settings, news, FAQ, reviews, financing banks/programs, dealers, spare-parts
// catalogue, technicians/bays, sales targets, chatbot knowledge.
//
// REMOVED: customers, leads, walk-ins, showroom visits, test drives,
// quotations, orders (+PDI, signatures, allocations, history), payments,
// commissions, warranties, service bookings, job cards, warranty claims,
// complaints, loyalty, follow-ups, surveys, part/roadside requests, chatbot
// conversations, newsletter sign-ups, notifications, audit log, and the
// reference-number counters (so the first real quotation/order starts at 1).
//
// Vehicle stock and spare-part stock that test orders/job cards consumed are
// put back first.
//
//   npx tsx scripts/clear-test-data.ts                       # dry run: shows row counts + target DB
//   npx tsx scripts/clear-test-data.ts --execute --confirm-db=<database name shown by the dry run>
//
// TAKE A BACKUP FIRST (pg_dump) — this cannot be undone. The --confirm-db
// guard exists so it cannot run against the wrong database by accident.
// Uploaded files (signed PDFs, payment proofs, PDI photos) are NOT deleted —
// see docs/go-live/GO-LIVE-RUNBOOK.md.
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), process.env.NODE_ENV === 'production' ? '.env.production' : '.env') });

import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

const dbUrl = buildDatabaseUrl();
process.env.DATABASE_URL = dbUrl;
const prisma = new PrismaClient();

const TARGETS = [
  'Customer', 'CustomerVehicle', 'CustomerFollowUp', 'CustomerNPS', 'CSISurveyResponse',
  'Lead', 'WalkInRegistration', 'ShowroomVisit', 'TestDrive', 'MarketingActivity',
  'Quotation', 'QuotationAssignmentHistory', 'QuotationEscalationHistory', 'TradeInEvaluation',
  'SalesOrder', 'SalesOrderStatusHistory', 'PdiChecklistItem', 'DocumentSignature',
  'VehicleAllocation', 'CommissionHistory', 'FinancingApplication',
  'Warranty', 'WarrantyClaim', 'WarrantyClaimStatusHistory', 'ServiceRecord',
  'ServiceBooking', 'JobCard', 'JobCardStatusHistory', 'JobCardPart',
  'PartRequest', 'PartRequestItem', 'RoadsideAssistanceRequest',
  'ComplaintCase', 'ComplaintNote', 'UpgradeOpportunity', 'SLATimer',
  'LoyaltyAccount', 'LoyaltyTransaction',
  'Message', 'NewsletterSubscriber', 'ChatbotConversation', 'ChatbotMessage', 'CRMSyncLog',
  'NotificationHistory', 'InAppNotification', 'AuditLog', 'Counter',
];

const q = (t: string) => `"${t}"`;

async function existingTables(): Promise<Set<string>> {
  const rows = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  return new Set(rows.map((r) => r.tablename));
}

// Every table that references a target (directly or transitively) would be
// emptied by TRUNCATE ... CASCADE. If that set contains anything not in
// TARGETS it is real data we must not touch — stop and say which.
async function cascadeClosure(targets: string[]): Promise<string[]> {
  // Walks by table OID (not name) so quoting/casing never matters.
  const rows = await prisma.$queryRawUnsafe<{ tbl: string }[]>(`
    WITH RECURSIVE dep(oid) AS (
      SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])
      UNION
      SELECT con.conrelid FROM pg_constraint con JOIN dep d ON con.confrelid = d.oid
      WHERE con.contype = 'f'
    )
    SELECT DISTINCT c.relname AS tbl FROM dep JOIN pg_class c ON c.oid = dep.oid`, targets);
  return rows.map((r) => r.tbl);
}

async function main() {
  const execute = process.argv.includes('--execute');
  const confirmDb = process.argv.find((a) => a.startsWith('--confirm-db='))?.split('=')[1];

  const [{ db }] = await prisma.$queryRawUnsafe<{ db: string }[]>(`SELECT current_database() AS db`);
  const host = new URL(dbUrl).host;
  console.log(`Target database: ${db}  (host ${host})\n`);

  const present = await existingTables();
  const targets = TARGETS.filter((t) => present.has(t));
  const missing = TARGETS.filter((t) => !present.has(t));
  if (missing.length) console.log(`(skipping tables not in this database: ${missing.join(', ')})\n`);

  const closure = await cascadeClosure(targets);
  const unexpected = closure.filter((t) => !targets.includes(t));
  if (unexpected.length) {
    console.error(`ABORT: clearing these tables would also wipe real data in: ${unexpected.join(', ')}.\n` +
      'Nothing was changed. Tell the developer — this list needs reviewing before go-live.');
    process.exit(1);
  }

  console.log('Rows that will be removed:');
  let total = 0;
  for (const t of targets) {
    const [{ n }] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*)::bigint AS n FROM ${q(t)}`);
    total += Number(n);
    if (n > 0n) console.log(`  ${t.padEnd(30)} ${n}`);
  }
  console.log(`  ${'TOTAL'.padEnd(30)} ${total}\n`);

  const stockBack = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*)::bigint AS n FROM "VehicleAllocation" WHERE status <> 'RELEASED'`
  );
  const partsBack = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*)::bigint AS n FROM "JobCardPart" WHERE status = 'ISSUED'`
  );
  console.log(`Stock to put back: ${stockBack[0].n} vehicle unit(s), ${partsBack[0].n} issued spare-part line(s)\n`);

  if (!execute) {
    console.log('DRY RUN — nothing changed. To proceed (after a backup):');
    console.log(`  npx tsx scripts/clear-test-data.ts --execute --confirm-db=${db}`);
    return;
  }
  if (confirmDb !== db) {
    console.error(`Refusing to run: --confirm-db must equal the target database name ("${db}").`);
    process.exit(1);
  }

  await prisma.$transaction(async (tx) => {
    // Give consumed stock back BEFORE the allocation / issued-part rows go.
    await tx.$executeRawUnsafe(`
      UPDATE "Vehicle" v SET stock = v.stock + a.cnt
      FROM (SELECT "vehicleId", COUNT(*)::int AS cnt FROM "VehicleAllocation" WHERE status <> 'RELEASED' GROUP BY "vehicleId") a
      WHERE v.id = a."vehicleId"`);
    await tx.$executeRawUnsafe(`
      UPDATE "SparePart" p SET stock = p.stock + j.qty
      FROM (SELECT "sparePartId", SUM(quantity)::int AS qty FROM "JobCardPart" WHERE status = 'ISSUED' GROUP BY "sparePartId") j
      WHERE p.id = j."sparePartId"`);
    await tx.$executeRawUnsafe(`TRUNCATE TABLE ${targets.map(q).join(', ')} RESTART IDENTITY CASCADE`);
  }, { timeout: 120000 });

  console.log('Done. Test data cleared and stock restored. Re-run the dry run to confirm every count is 0.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
