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

  // Kerchanshe SSO (OIDC). Off unless SSO_ENABLED=true — the password
  // login keeps working either way. The issuer is browser-facing (the
  // authorize/logout redirects and the `iss` claim); the internal URL is
  // what this backend calls server-to-server for /token and /jwks.
  sso: {
    enabled: process.env.SSO_ENABLED === 'true',
    issuer: (process.env.AUTH_ISSUER || '').replace(/\/+$/, ''),
    internalUrl: (process.env.AUTH_INTERNAL_URL || process.env.AUTH_ISSUER || '').replace(/\/+$/, ''),
    jwksUri: process.env.AUTH_JWKS_URI || '',
    clientId: process.env.OIDC_CLIENT_ID || 'geely',
    clientSecret: process.env.OIDC_CLIENT_SECRET || '',
    redirectUri: process.env.OIDC_REDIRECT_URI || '',
    scopes: process.env.OIDC_SCOPES || 'openid profile email',
    postLogoutRedirectUri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI || '',
    // Where the browser lands after a successful SSO callback, and the
    // login page failures are sent back to (with ?error=sso_...).
    adminHomeUrl: process.env.SSO_ADMIN_HOME_URL || '',
    adminLoginUrl: process.env.SSO_ADMIN_LOGIN_URL || '',
  },

  cors: {
    originWeb: process.env.CORS_ORIGIN_WEB || 'http://localhost:7501',
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
    site: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://geelyethiopia.com',
    admin: process.env.ADMIN_URL || process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.geelyethiopia.com',
  },

  commission: {
    defaultRate: parseFloat(process.env.DEFAULT_COMMISSION_RATE || '5'),
  },
};
