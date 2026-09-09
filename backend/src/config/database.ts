import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from './buildDatabaseUrl';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: buildDatabaseUrl(),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
