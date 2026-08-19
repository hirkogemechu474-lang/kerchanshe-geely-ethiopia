const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const ADMIN_DATA_DIR = path.join(process.cwd(), 'admin-data');
const USERS_FILE = path.join(ADMIN_DATA_DIR, 'users.json');

async function initializeAdminUsers() {
  // Create admin-data directory if it doesn't exist
  if (!fs.existsSync(ADMIN_DATA_DIR)) {
    fs.mkdirSync(ADMIN_DATA_DIR, { recursive: true });
    console.log('✅ Created admin-data directory');
  }

  // Default admin users
  const defaultUsers = [
    {
      id: randomUUID(),
      email: 'admin@geelyethiopia.com',
      name: 'Super Administrator',
      role: 'super_admin',
      passwordHash: await bcrypt.hash('Admin@2024!', 10),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      dealerId: null,
    },
    {
      id: randomUUID(),
      email: 'manager@geelyethiopia.com',
      name: 'Operations Manager',
      role: 'manager',
      passwordHash: await bcrypt.hash('Manager@2024!', 10),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      dealerId: null,
    },
    {
      id: randomUUID(),
      email: 'sales@geelyethiopia.com',
      name: 'Sales Representative',
      role: 'sales',
      passwordHash: await bcrypt.hash('Sales@2024!', 10),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      dealerId: null,
    },
    {
      id: randomUUID(),
      email: 'service@geelyethiopia.com',
      name: 'Service Coordinator',
      role: 'service',
      passwordHash: await bcrypt.hash('Service@2024!', 10),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      dealerId: null,
    },
    {
      id: randomUUID(),
      email: 'marketing@geelyethiopia.com',
      name: 'Marketing Manager',
      role: 'marketing',
      passwordHash: await bcrypt.hash('Marketing@2024!', 10),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      dealerId: null,
    },
  ];

  const usersData = {
    users: defaultUsers,
    lastUpdated: new Date().toISOString(),
  };

  fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
  
  console.log('\n✅ Admin users initialized successfully!\n');
  console.log('📧 Default Admin Credentials:\n');
  console.log('Super Admin:');
  console.log('  Email: admin@geelyethiopia.com');
  console.log('  Password: Admin@2024!\n');
  console.log('Manager:');
  console.log('  Email: manager@geelyethiopia.com');
  console.log('  Password: Manager@2024!\n');
  console.log('Sales:');
  console.log('  Email: sales@geelyethiopia.com');
  console.log('  Password: Sales@2024!\n');
  console.log('Service:');
  console.log('  Email: service@geelyethiopia.com');
  console.log('  Password: Service@2024!\n');
  console.log('Marketing:');
  console.log('  Email: marketing@geelyethiopia.com');
  console.log('  Password: Marketing@2024!\n');
  console.log('⚠️  Please change these passwords after first login!\n');
}

initializeAdminUsers().catch(console.error);
