import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// One demo user per admin role so every permission preset in
// admin/lib/auth/types.ts (ROLE_PERMISSIONS) can be logged in and seen live —
// see /admin/users/roles for what each role can do. Mirrors the existing
// scripts/create-admin.ts pattern (bcrypt hash, skip if the email exists).
const DEMO_PASSWORD = 'Demo@2024!';

const users = [
  { email: 'super.admin@geelyethiopia.com', name: 'Demo Super Admin', role: 'super_admin' },
  { email: 'admin@geelyethiopia.com', name: 'Demo Admin', role: 'admin' },
  { email: 'manager@geelyethiopia.com', name: 'Demo Manager', role: 'manager' },
  { email: 'sales@geelyethiopia.com', name: 'Demo Sales', role: 'sales' },
  { email: 'service@geelyethiopia.com', name: 'Demo Service', role: 'service' },
  { email: 'marketing@geelyethiopia.com', name: 'Demo Marketing', role: 'marketing' },
  { email: 'service.advisor@geelyethiopia.com', name: 'Demo Service Advisor', role: 'service_advisor' },
  { email: 'service.manager@geelyethiopia.com', name: 'Demo Service Manager', role: 'service_manager' },
  { email: 'gm.geely@geelyethiopia.com', name: 'Demo GM-Geely', role: 'gm_geely' },
  { email: 'sales.manager@geelyethiopia.com', name: 'Demo Sales Manager', role: 'sales_manager' },
  { email: 'after.sales.manager@geelyethiopia.com', name: 'Demo After Sales Manager', role: 'after_sales_manager' },
  { email: 'sales.representative@geelyethiopia.com', name: 'Demo Sales Representative', role: 'sales_representative' },
  { email: 'workshop.manager@geelyethiopia.com', name: 'Demo Workshop Manager', role: 'workshop_manager' },
];

async function main() {
  console.log('🌱 Seeding demo users (one per role)...\n');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  let created = 0;
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`⏭️  ${u.email} already exists — skipping`);
      continue;
    }
    await prisma.user.create({
      data: { email: u.email, name: u.name, passwordHash, role: u.role, isActive: true },
    });
    console.log(`✅ ${u.role.padEnd(16)} ${u.email}`);
    created++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ ${created} user(s) created (${users.length - created} already existed)`);
  console.log(`🔑 Shared demo password: ${DEMO_PASSWORD}`);
  console.log(`═══════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
