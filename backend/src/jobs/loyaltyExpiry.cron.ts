import cron from 'node-cron';
import { loyaltyService } from '../services/loyalty/loyalty.service';

// Monthly trigger for loyaltyService.expireInactiveAccounts() — the
// POINTS_EXPIRY_MONTHS constant existed with nothing consuming it. Monthly
// (not daily, like serviceReminders.cron.ts) since 24-month inactivity
// doesn't need daily-granularity scanning.
export function startLoyaltyExpiryCron(): void {
  cron.schedule('0 6 1 * *', async () => {
    try {
      const result = await loyaltyService.expireInactiveAccounts();
      console.log(`[LOYALTY EXPIRY CRON] expired ${result.expiredCount} account(s)`);
    } catch (error: any) {
      console.error('[LOYALTY EXPIRY CRON ERROR]', error.message);
    }
  });
}
