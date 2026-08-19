-- Create Admin User for Geely Ethiopia
-- Run this in PostgreSQL (pgAdmin or psql)

-- Hash: Admin@2024!
-- The hash below is: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5uyYGosQtYAkW

-- Insert admin user (will not overwrite if exists)
INSERT INTO "User" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@geelyethiopia.com',
  'System Administrator',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5uyYGosQtYAkW',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify admin user was created
SELECT id, email, name, role, "isActive", "createdAt"
FROM "User"
WHERE email = 'admin@geelyethiopia.com';