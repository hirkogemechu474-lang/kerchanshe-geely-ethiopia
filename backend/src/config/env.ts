import dotenv from 'dotenv';
import path from 'path';

// Load .env.production when NODE_ENV=production, otherwise .env
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'geely_ethiopia',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  auth: {
    nextAuthSecret: requireEnv('NEXTAUTH_SECRET'),
    jwtSecret: process.env.JWT_SECRET || requireEnv('NEXTAUTH_SECRET'),
  },

  cors: {
    originWeb: process.env.CORS_ORIGIN_WEB || 'https://www.geelyauto.co.za',
    originAdmin: process.env.CORS_ORIGIN_ADMIN || 'http://localhost:7500',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@geelyethiopia.com',
    fromName: process.env.SMTP_FROM_NAME || 'Geely Ethiopia',
    enabled: process.env.SMTP_ENABLED === 'true',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  },

  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
  },

  urls: {
    site: process.env.NEXT_PUBLIC_SITE_URL || 'https://geely.com.et',
    admin: process.env.ADMIN_URL || 'http://localhost:7500',
  },

  commission: {
    defaultRate: parseFloat(process.env.DEFAULT_COMMISSION_RATE || '5'),
  },
};
