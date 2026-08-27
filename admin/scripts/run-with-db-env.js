'use strict';
// Composes DATABASE_URL from DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD in
// .env.production (never DATABASE_URL directly), then runs `npm run <script>`
// with that plus NODE_ENV=production injected.
//
// Usage: node scripts/run-with-db-env.js <npm-script-name>
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const npmScript = process.argv[2];
if (!npmScript) {
  console.error('Usage: node scripts/run-with-db-env.js <npm-script-name>');
  process.exit(1);
}

const envPath = path.resolve(__dirname, '..', '.env.production');
if (!fs.existsSync(envPath)) {
  console.error(`[run-with-db-env] Missing ${envPath}`);
  process.exit(1);
}

for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

process.env.NODE_ENV = 'production';

const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[run-with-db-env] Missing required vars in .env.production: ${missing.join(', ')}`);
  process.exit(1);
}
const user = encodeURIComponent(process.env.DB_USER);
const pass = encodeURIComponent(process.env.DB_PASSWORD);
const { DB_HOST, DB_PORT, DB_NAME } = process.env;
process.env.DATABASE_URL = `postgresql://${user}:${pass}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;

console.log(`[run-with-db-env] db=${DB_HOST}:${DB_PORT}/${DB_NAME} script=${npmScript}`);

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmBin, ['run', npmScript], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.resolve(__dirname, '..'),
  shell: process.platform === 'win32',
});
if (result.error) {
  console.error('[run-with-db-env] Failed to spawn npm:', result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
