const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'geely_ethiopia',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Hash password
    const passwordHash = await bcrypt.hash('Admin@2024!', 12);

    // Insert admin user
    const result = await client.query(`
      INSERT INTO "User" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'admin@geelyethiopia.com', 'System Administrator', $1, 'admin', true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, name, role
    `, [passwordHash]);

    if (result.rows.length > 0) {
      console.log('✅ Admin user created:', result.rows[0]);
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

createAdmin();