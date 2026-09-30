// Go-live password check (read-only). Reports every ACTIVE staff account that
// still uses a known default/demo password, plus accounts that have never
// signed in since creation.
//
//   npx tsx scripts/verify-staff-passwords.ts
//   npx tsx scripts/verify-staff-passwords.ts credentials-2026-...csv   # also check the handed-out temporary passwords
//
// Exit code 1 if any active account still has a default or unchanged
// temporary password — use it as the pass/fail for the "passwords changed"
// confirmation. It never prints or stores any password.
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), process.env.NODE_ENV === 'production' ? '.env.production' : '.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();

// The demo passwords that backend/prisma/seed/index.ts gives its sample users.
const KNOWN_DEFAULTS = ['ChangeMe123!', 'TestUser123!'];
const PUBLIC_ROLES = ['customer', 'dealer'];

function readTempPasswords(file: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = fs.readFileSync(file, 'utf-8').trim().split(/\r?\n/).slice(1);
  for (const line of lines) {
    const cells = line.match(/"((?:[^"]|"")*)"/g)?.map((c) => c.slice(1, -1).replace(/""/g, '"')) ?? [];
    if (cells.length >= 4) map.set(cells[1].toLowerCase(), cells[3]);
  }
  return map;
}

async function main() {
  const tempFile = process.argv[2];
  const temps = tempFile ? readTempPasswords(tempFile) : new Map<string, string>();

  const users = await prisma.user.findMany({
    where: { isActive: true, role: { notIn: PUBLIC_ROLES } },
    select: { email: true, name: true, role: true, passwordHash: true, lastLogin: true, mustChangePassword: true, passwordChangedAt: true },
    orderBy: { email: 'asc' },
  });

  const bad: string[] = [];
  const neverSignedIn: string[] = [];
  for (const u of users) {
    const candidates = [...KNOWN_DEFAULTS];
    const temp = temps.get(u.email.toLowerCase());
    if (temp) candidates.push(temp);
    let stillDefault = false;
    for (const c of candidates) {
      if (await bcrypt.compare(c, u.passwordHash)) { stillDefault = true; break; }
    }
    if (stillDefault) bad.push(`${u.email} (${u.role}) — still on a default/temporary password`);
    else if (u.mustChangePassword) bad.push(`${u.email} (${u.role}) — has not yet chosen their own password`);
    if (!u.lastLogin) neverSignedIn.push(`${u.email} (${u.role})`);
  }

  console.log(`Active staff accounts checked: ${users.length}\n`);
  if (bad.length) {
    console.log(`NOT CHANGED (${bad.length}):\n - ${bad.join('\n - ')}\n`);
    console.log('Fix: have the person use "Forgot password" on the login page, or deactivate the account (Manage Users) if it is a demo/test user.');
  } else {
    console.log('PASS — no active staff account uses a known default or handed-out temporary password.');
  }
  if (neverSignedIn.length) {
    console.log(`\nNever signed in (${neverSignedIn.length}) — cannot have changed anything yet:\n - ${neverSignedIn.join('\n - ')}`);
  }
  process.exitCode = bad.length ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
