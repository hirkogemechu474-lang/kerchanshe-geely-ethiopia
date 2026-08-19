import { PrismaClient } from '@prisma/client';

function buildDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const desired = new Map<string, string>([
      ['connection_limit', '6'],
      ['pool_timeout', '5'],
      ['connect_timeout', '10'],
      ['statement_timeout', '30'],
    ]);
    for (const [k, v] of desired) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: buildDatasourceUrl(),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
