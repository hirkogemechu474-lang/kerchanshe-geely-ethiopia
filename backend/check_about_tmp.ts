import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from './src/config/buildDatabaseUrl';
process.env.DATABASE_URL = buildDatabaseUrl();
const prisma = new PrismaClient();
prisma.setting.findUnique({ where: { key: 'about_page' } }).then((s) => {
  if (!s) { console.log('NO about_page setting found'); return; }
  console.log('about_page exists, value length:', s.value.length, 'updatedAt:', s.updatedAt);
  const parsed = JSON.parse(s.value);
  console.log('keys:', Object.keys(parsed));
}).finally(() => prisma.$disconnect());
