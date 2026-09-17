import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { startServiceReminderCron } from './jobs/serviceReminders.cron';
import { startLoyaltyExpiryCron } from './jobs/loyaltyExpiry.cron';

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(env.port, '0.0.0.0', () => {
      console.log(`🚀 Backend server running on http://0.0.0.0:${env.port}`);
      console.log(`📊 Environment: ${env.nodeEnv}`);
    });

    startServiceReminderCron();
    startLoyaltyExpiryCron();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
