// Deactivates every ACTIVE staff account that still uses a published demo
// password (the sample users from backend/prisma/seed/index.ts), so nobody can
// sign in to a live system with a password that is written down in the repo.
//
//   npx tsx scripts/deactivate-demo-accounts.ts                          # dry run (default)
//   npx tsx scripts/deactivate-demo-accounts.ts --execute
//   npx tsx scripts/deactivate-demo-accounts.ts --execute --keep=a@x.com,b@y.com
//
// Accounts are deactivated, not deleted (other records point at them), and can
// be re-enabled in Manage Users. Refuses to run if it would leave the system
// with no active Super Admin/Admin on a real password, and reports the ones
// it kept. Use NODE_ENV=production to target .env.production.
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), process.env.NODE_ENV === 'production' ? '.env.production' : '.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

const dbUrl = buildDatabaseUrl();
process.env.DATABASE_URL = dbUrl;
const prisma = new PrismaClient();

const KNOWN_DEFAULTS = ['ChangeMe123!', 'TestUser123!'];
const PUBLIC_ROLES = ['customer', 'dealer'];
const ADMIN_TIER = ['super_admin', 'admin'];

async function main() {
  const execute = process.argv.includes('--execute');
  const keep = new Set(
    (process.argv.find((a) => a.startsWith('--keep='))?.split('=')[1] ?? '')
      .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  );

  const [{ db }] = await prisma.$queryRawUnsafe<{ db: string }[]>(`SELECT current_database() AS db`);
  console.log(`Target database: ${db}  (host ${new URL(dbUrl).host})\n`);

  const users = await prisma.user.findMany({
    where: { isActive: true, role: { notIn: PUBLIC_ROLES } },
    select: { id: true, email: true, role: true, passwordHash: true },
    orderBy: { email: 'asc' },
  });

  const demo: typeof users = [];
  const real: typeof users = [];
  for (const u of users) {
    let isDefault = false;
    for (const d of KNOWN_DEFAULTS) {
      if (await bcrypt.compare(d, u.passwordHash)) { isDefault = true; break; }
    }
    (isDefault && !keep.has(u.email.toLowerCase()) ? demo : real).push(u);
  }

  console.log(`Active staff: ${users.length}`);
  console.log(`On a demo password (will be deactivated): ${demo.length}`);
  for (const u of demo) console.log(`  - ${u.email} (${u.role})`);
  const kept = users.filter((u) => !demo.includes(u));
  console.log(`Staying active: ${kept.length}`);
  for (const u of kept) console.log(`  - ${u.email} (${u.role})`);

  const adminsLeft = kept.filter((u) => ADMIN_TIER.includes(u.role));
  if (demo.length > 0 && adminsLeft.length === 0) {
    console.error('\nABORT: this would leave no active Super Admin/Admin. Create a real admin first (provision-uat-users / Manage Users) or pass --keep=<email>.');
    process.exit(1);
  }

  if (!execute) {
    console.log('\nDRY RUN: nothing changed. Re-run with --execute to apply.');
    return;
  }
  if (demo.length === 0) { console.log('\nNothing to do.'); return; }

  const res = await prisma.user.updateMany({
    where: { id: { in: demo.map((u) => u.id) } },
    // sessionsRevokedAt also kills any session they already have open.
    data: { isActive: false, sessionsRevokedAt: new Date() },
  });
  console.log(`\nDeactivated ${res.count} account(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
