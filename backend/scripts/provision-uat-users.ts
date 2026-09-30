// Creates the UAT / go-live staff accounts (sales agents, customer attendants,
// GM) from a JSON file, each with a random one-time password.
//
//   npx tsx scripts/provision-uat-users.ts users.json            # dry run (default)
//   npx tsx scripts/provision-uat-users.ts users.json --execute  # create for real
//
// users.json: [{ "name": "Abebe Kebede", "email": "abebe@kerchanshe.net",
//                "team": "sales" | "attendance" | "gm", "title": "optional" }]
//
// Team -> role (matches the real permission sets in
// backend/src/middleware/rolePermissions.ts):
//   sales      -> sales         (quotations, orders, agreements, PDI)
//   attendance -> reception    (walk-in registration, customers, test drives, showroom visits)
//   gm         -> gm_geely      (approve/countersign, payment verify, dashboards)
//
// Safe to re-run: an email that already exists is skipped, never overwritten.
// Passwords are written ONLY to the credentials CSV next to the input file
// (credentials-<timestamp>.csv) — hand that file over securely, then delete it.
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), process.env.NODE_ENV === 'production' ? '.env.production' : '.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

const TEAMS: Record<string, { role: string; defaultTitle: string }> = {
  sales: { role: 'sales', defaultTitle: 'Sales Executive' },
  attendance: { role: 'reception', defaultTitle: 'Customer Attendant' },
  gm: { role: 'gm_geely', defaultTitle: 'General Manager' },
};

interface InputUser { name: string; email: string; team: string; title?: string }

// 14 chars, no look-alike characters, always has upper/lower/digit/symbol so
// it satisfies any reasonable policy.
function randomPassword(): string {
  const pick = (chars: string) => chars[crypto.randomInt(chars.length)];
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
  const all = sets.join('');
  const chars = sets.map(pick);
  while (chars.length < 14) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

async function main() {
  const file = process.argv[2];
  const execute = process.argv.includes('--execute');
  if (!file || file.startsWith('--')) {
    console.error('Usage: npx tsx scripts/provision-uat-users.ts <users.json> [--execute]');
    process.exit(1);
  }
  const input: InputUser[] = JSON.parse(fs.readFileSync(file, 'utf-8'));

  const problems: string[] = [];
  const seen = new Set<string>();
  for (const u of input) {
    const email = (u.email || '').trim().toLowerCase();
    if (!u.name?.trim()) problems.push(`Missing name for ${email || '(no email)'}`);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push(`Invalid email: ${u.email}`);
    if (!TEAMS[u.team]) problems.push(`${email}: team must be one of ${Object.keys(TEAMS).join(', ')} (got "${u.team}")`);
    if (seen.has(email)) problems.push(`Duplicate email in file: ${email}`);
    seen.add(email);
  }
  if (problems.length) {
    console.error('Fix these first:\n - ' + problems.join('\n - '));
    process.exit(1);
  }

  console.log(execute ? 'EXECUTE — creating accounts\n' : 'DRY RUN — nothing will be written (add --execute to create)\n');
  const rows: string[] = ['name,email,role,temporary_password'];
  let created = 0;
  let skipped = 0;

  for (const u of input) {
    const email = u.email.trim().toLowerCase();
    const { role, defaultTitle } = TEAMS[u.team];
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (existing) {
      console.log(`SKIP    ${email} — already exists (role ${existing.role}); password NOT changed`);
      skipped++;
      continue;
    }
    if (!execute) {
      console.log(`CREATE  ${email}  ${role}  "${u.title?.trim() || defaultTitle}"`);
      continue;
    }
    const password = randomPassword();
    await prisma.user.create({
      data: {
        name: u.name.trim(),
        email,
        role,
        title: u.title?.trim() || defaultTitle,
        passwordHash: await bcrypt.hash(password, 12),
        isActive: true,
        // The portal makes them pick their own password before anything else.
        mustChangePassword: true,
      },
    });
    rows.push([u.name.trim(), email, role, password].map((v) => `"${v.replace(/"/g, '""')}"`).join(','));
    console.log(`CREATED ${email}  ${role}`);
    created++;
  }

  if (execute && created > 0) {
    const out = path.join(path.dirname(path.resolve(file)), `credentials-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
    fs.writeFileSync(out, rows.join('\n') + '\n', { mode: 0o600 });
    console.log(`\nTemporary passwords written to: ${out}`);
    console.log('Send each person ONLY their own row, then delete this file. The portal forces each person to choose their own password at first login.');
  }
  console.log(`\nDone. created=${created} skipped=${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
