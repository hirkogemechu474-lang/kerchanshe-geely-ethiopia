import cron from 'node-cron';
import { warrantyService } from '../services/warranty/warranty.service';

// Daily automated trigger for warranty.service.ts's sendServiceReminders()
// — previously this only ever ran when an admin manually hit
// POST /api/warranty/send-reminders. No scheduler existed anywhere in this
// codebase; node-cron runs in-process since `backend` is a long-running
// Express server, not a serverless function, so no external cron infra
// (Vercel Cron / GitHub Actions) is needed.
export function startServiceReminderCron(): void {
  cron.schedule('0 7 * * *', async () => {
    try {
      const result = await warrantyService.sendServiceReminders();
      console.log(`[SERVICE REMINDER CRON] sent ${result.sentCount} reminder(s)`);
    } catch (error: any) {
      console.error('[SERVICE REMINDER CRON ERROR]', error.message);
    }
  });
}
