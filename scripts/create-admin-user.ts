import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('✅ Connecting to database...');

    const email = 'admin@geelyethiopia.com';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', email);
      console.log('🆔 User ID:', existingAdmin.id);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('Admin@2024!', 12);
    console.log('🔐 Password hashed successfully');

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        name: 'System Administrator',
        passwordHash,
        role: 'admin',
        isActive: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🆔 User ID:', admin.id);
    console.log('🔑 Password: Admin@2024!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();