import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@geelyethiopia.com';
    const password = 'Admin@2024!';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', email);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

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
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 User ID:', admin.id);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
