const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateUsers() {
  try {
    const usersFile = path.join(process.cwd(), 'admin-data', 'users.json');
    
    if (!fs.existsSync(usersFile)) {
      console.log('❌ Users file not found at:', usersFile);
      return;
    }

    const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

    console.log('🚀 Starting user migration to database...\n');

    for (const user of usersData.users) {
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            passwordHash: user.passwordHash,
            role: user.role,
            isActive: user.isActive,
            dealerId: user.dealerId,
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            passwordHash: user.passwordHash,
            role: user.role,
            isActive: user.isActive,
            dealerId: user.dealerId,
            createdAt: new Date(user.createdAt),
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          },
        });
        console.log(`✅ Migrated user: ${user.email} (${user.role})`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${user.email}:`, error.message);
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`📊 Total users migrated: ${usersData.users.length}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsers();
