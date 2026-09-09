import dotenv from 'dotenv';
dotenv.config();

import { spawnSync } from 'child_process';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

process.env.DATABASE_URL = buildDatabaseUrl();

const result = spawnSync('npx', ['prisma', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
