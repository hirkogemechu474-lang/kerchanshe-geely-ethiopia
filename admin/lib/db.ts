// Database utility with fallback for missing Prisma client
let prisma: any = null;

try {
  const { PrismaClient } = require('@prisma/client');
  
  const globalForPrisma = global as unknown as { prisma: any };

  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
} catch (error) {
  console.warn('⚠️ Prisma client not installed. Database features will be disabled.');
  console.warn('To enable database: npm install @prisma/client --legacy-peer-deps');
  
  // Create a mock Prisma client that returns empty results
  prisma = new Proxy({}, {
    get: () => new Proxy({}, {
      get: () => async () => {
        console.warn('Database operation skipped - Prisma client not installed');
        return [];
      }
    })
  });
}

export { prisma };
export default prisma;
