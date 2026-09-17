import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

// Flat conversion: 1 point per 1,000 ETB spent, on either a vehicle
// purchase (SalesOrder reaching DELIVERED) or a paid workshop visit
// (JobCard reaching RELEASED) — see order.service.ts / workshop.routes.ts.
const POINTS_PER_ETB = 1 / 1000;

// Referral bonus: 500 points for referring a new customer who completes a purchase.
const REFERRAL_BONUS_POINTS = 500;

// Points expiry: points expire after 24 months of inactivity.
const POINTS_EXPIRY_MONTHS = 24;

const TIER_THRESHOLDS: Array<{ tier: 'VIP' | 'GOLD' | 'SILVER' | 'BRONZE'; min: number }> = [
  { tier: 'VIP', min: 7000 },
  { tier: 'GOLD', min: 3000 },
  { tier: 'SILVER', min: 1000 },
  { tier: 'BRONZE', min: 0 },
];

// Tier-based benefits configuration
export const TIER_BENEFITS: Record<string, { label: string; description: string }[]> = {
  BRONZE: [
    { label: 'Welcome Bonus', description: '500 points on first service' },
    { label: 'Service Reminders', description: 'Automatic maintenance alerts' },
  ],
  SILVER: [
    { label: 'Welcome Bonus', description: '500 points on first service' },
    { label: 'Service Reminders', description: 'Automatic maintenance alerts' },
    { label: 'Free Inspection', description: '1 free multi-point inspection per year' },
    { label: 'Parts Discount', description: '3% off genuine parts' },
  ],
  GOLD: [
    { label: 'Welcome Bonus', description: '500 points on first service' },
    { label: 'Service Reminders', description: 'Automatic maintenance alerts' },
    { label: 'Free Inspection', description: '2 free multi-point inspections per year' },
    { label: 'Parts Discount', description: '5% off genuine parts' },
    { label: 'Priority Booking', description: 'Priority service scheduling' },
    { label: 'Free Tire Rotation', description: '1 free tire rotation per year' },
  ],
  VIP: [
    { label: 'Welcome Bonus', description: '500 points on first service' },
    { label: 'Service Reminders', description: 'Automatic maintenance alerts' },
    { label: 'Free Inspection', description: 'Unlimited free multi-point inspections' },
    { label: 'Parts Discount', description: '10% off genuine parts' },
    { label: 'Priority Booking', description: 'Priority service scheduling' },
    { label: 'Free Tire Rotation', description: '2 free tire rotations per year' },
    { label: 'Free Oil Change', description: '1 free oil change per year' },
    { label: 'Dedicated Advisor', description: 'Dedicated customer service advisor' },
    { label: 'Loaner Vehicle', description: 'Free loaner vehicle during service' },
  ],
};

function tierForPoints(points: number): 'VIP' | 'GOLD' | 'SILVER' | 'BRONZE' {
  return TIER_THRESHOLDS.find((t) => points >= t.min)?.tier ?? 'BRONZE';
}

export const loyaltyService = {
  /**
   * Award points to the customer matching this phone number, creating the
   * Customer/LoyaltyAccount records on first use — same phone-based
   * find-or-create dedupe convention used throughout this codebase (no
   * customerId FK exists on SalesOrder/JobCard to look up directly).
   * Non-blocking by design: callers should catch/log, never let a loyalty
   * write fail the delivery/release transition it's attached to.
   */
  async earnPoints(params: {
    customerPhone: string;
    customerName: string;
    amount: number;
    reason: string;
    sourceType: 'SALES_ORDER' | 'JOB_CARD' | 'REFERRAL' | 'MANUAL';
    sourceId: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const points = Math.max(0, Math.round(params.amount * POINTS_PER_ETB));
      if (points === 0) return { ok: true, data: null };

      const customer =
        (await prisma.customer.findFirst({ where: { phone: params.customerPhone } })) ??
        (await prisma.customer.create({ data: { fullName: params.customerName, phone: params.customerPhone } }));

      const account = await prisma.loyaltyAccount.upsert({
        where: { customerId: customer.id },
        update: {},
        create: { customerId: customer.id },
      });

      const newPoints = account.points + points;
      const newTier = tierForPoints(newPoints);
      const previousTier = account.tier;
      const updated = await prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: newPoints, tier: newTier },
      });

      await prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points,
          reason: params.reason,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
        },
      });

      // Notify customer of points earned
      if (customer.email) {
        await dispatchNotification({
          type: 'order_status',
          to: [customer.email],
          subject: 'Loyalty Points Earned',
          data: {
            message: `You earned ${points} loyalty points for ${params.reason}. Total: ${newPoints} points (${newTier} tier).`,
            customerName: customer.fullName,
          },
        }).catch(() => {});
      }

      // Notify on tier upgrade
      if (newTier !== previousTier) {
        if (customer.email) {
          await dispatchNotification({
            type: 'order_status',
            to: [customer.email],
            subject: `Tier Upgrade — You're now ${newTier}!`,
            data: {
              message: `Congratulations! You've been upgraded to ${newTier} tier. Enjoy your new benefits.`,
              customerName: customer.fullName,
            },
          }).catch(() => {});
        }
      }

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[LOYALTY EARN POINTS ERROR]', error.message);
      return { ok: false, error: 'Failed to award loyalty points.' };
    }
  },

  /**
   * Award referral bonus points to the referrer when a referred customer
   * completes a purchase.
   */
  async awardReferralBonus(params: {
    referrerPhone: string;
    referrerName: string;
    referredCustomerName: string;
    referredOrderId: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    return this.earnPoints({
      customerPhone: params.referrerPhone,
      customerName: params.referrerName,
      amount: REFERRAL_BONUS_POINTS, // Direct points, not amount-based
      reason: `Referral bonus for referring ${params.referredCustomerName}`,
      sourceType: 'REFERRAL',
      sourceId: params.referredOrderId,
    });
  },

  /**
   * Redeem points from a customer's loyalty account.
   * Points are deducted and a negative-point transaction is recorded.
   */
  async redeemPoints(params: {
    customerId: string;
    points: number;
    reason: string;
    sourceType?: string;
    sourceId?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      if (params.points <= 0) {
        return { ok: false, error: 'Redemption points must be positive.' };
      }

      const account = await prisma.loyaltyAccount.findUnique({
        where: { customerId: params.customerId },
      });

      if (!account) {
        return { ok: false, error: 'Loyalty account not found.' };
      }

      if (account.points < params.points) {
        return { ok: false, error: `Insufficient points. You have ${account.points} points but tried to redeem ${params.points}.` };
      }

      const newPoints = account.points - params.points;
      const newTier = tierForPoints(newPoints);
      const previousTier = account.tier;

      const updated = await prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: newPoints, tier: newTier },
      });

      await prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points: -params.points,
          reason: params.reason,
          sourceType: params.sourceType || 'MANUAL',
          sourceId: params.sourceId || null,
        },
      });

      // Notify on tier downgrade
      if (newTier !== previousTier) {
        const customer = await prisma.customer.findUnique({ where: { id: params.customerId } });
        if (customer?.email) {
          await dispatchNotification({
            type: 'order_status',
            to: [customer.email],
            subject: 'Loyalty Tier Update',
            data: {
              message: `Your loyalty tier has been updated to ${newTier} after point redemption.`,
              customerName: customer.fullName,
            },
          }).catch(() => {});
        }
      }

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[LOYALTY REDEEM POINTS ERROR]', error.message);
      return { ok: false, error: 'Failed to redeem loyalty points.' };
    }
  },

  /**
   * Manually adjust points for a customer (admin bonus, correction, etc.).
   */
  async adjustPoints(params: {
    customerId: string;
    points: number; // positive = add, negative = deduct
    reason: string;
    adjustedById: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const account = await prisma.loyaltyAccount.findUnique({
        where: { customerId: params.customerId },
      });

      if (!account) {
        return { ok: false, error: 'Loyalty account not found.' };
      }

      const newPoints = Math.max(0, account.points + params.points);
      const newTier = tierForPoints(newPoints);

      const updated = await prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: newPoints, tier: newTier },
      });

      await prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points: params.points,
          reason: params.reason,
          sourceType: 'MANUAL',
          sourceId: params.adjustedById,
        },
      });

      return { ok: true, data: updated };
    } catch (error: any) {
      console.error('[LOYALTY ADJUST POINTS ERROR]', error.message);
      return { ok: false, error: 'Failed to adjust loyalty points.' };
    }
  },

  /**
   * Get loyalty account for a customer by ID.
   */
  async getByCustomerId(customerId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const account = await prisma.loyaltyAccount.findUnique({
        where: { customerId },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
          customer: { select: { fullName: true, phone: true, email: true } },
        },
      });
      return { ok: true, data: account };
    } catch (error: any) {
      console.error('[LOYALTY GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch loyalty account.' };
    }
  },

  /**
   * Get loyalty account by phone number (for customer-facing portal).
   */
  async getByPhone(phone: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const customer = await prisma.customer.findFirst({ where: { phone } });
      if (!customer) return { ok: true, data: null };

      const account = await prisma.loyaltyAccount.findUnique({
        where: { customerId: customer.id },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
          customer: { select: { fullName: true, phone: true, email: true } },
        },
      });
      return { ok: true, data: account };
    } catch (error: any) {
      console.error('[LOYALTY GET BY PHONE ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch loyalty account.' };
    }
  },

  /**
   * Get all loyalty accounts (admin listing).
   */
  async listAll(params?: { tier?: string; search?: string; page?: number; pageSize?: number }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const where: any = {};

      if (params?.tier && params.tier !== 'ALL') {
        where.tier = params.tier;
      }

      if (params?.search) {
        where.customer = {
          OR: [
            { fullName: { contains: params.search, mode: 'insensitive' } },
            { phone: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        };
      }

      const [accounts, total] = await Promise.all([
        prisma.loyaltyAccount.findMany({
          where,
          include: {
            customer: { select: { id: true, fullName: true, phone: true, email: true } },
            transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { points: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.loyaltyAccount.count({ where }),
      ]);

      return {
        ok: true,
        data: {
          accounts,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error: any) {
      console.error('[LOYALTY LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch loyalty accounts.' };
    }
  },

  /**
   * Get loyalty analytics (admin dashboard).
   */
  async getAnalytics(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const [totalAccounts, tierCounts, totalPointsIssued, recentTransactions] = await Promise.all([
        prisma.loyaltyAccount.count(),
        prisma.loyaltyAccount.groupBy({ by: ['tier'], _count: true, _sum: { points: true } }),
        prisma.loyaltyTransaction.aggregate({ where: { points: { gt: 0 } }, _sum: { points: true } }),
        prisma.loyaltyTransaction.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            account: {
              include: { customer: { select: { fullName: true, phone: true } } },
            },
          },
        }),
      ]);

      const tierDistribution = tierCounts.reduce((acc, t) => {
        acc[t.tier] = { count: t._count, totalPoints: t._sum.points || 0 };
        return acc;
      }, {} as Record<string, { count: number; totalPoints: number }>);

      return {
        ok: true,
        data: {
          totalAccounts,
          totalPointsIssued: totalPointsIssued._sum.points || 0,
          tierDistribution,
          recentTransactions,
        },
      };
    } catch (error: any) {
      console.error('[LOYALTY ANALYTICS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch loyalty analytics.' };
    }
  },

  /**
   * Get tier benefits configuration.
   */
  getTierBenefits() {
    return TIER_BENEFITS;
  },

  /**
   * Expire points for accounts inactive for POINTS_EXPIRY_MONTHS — driven by
   * the cron in jobs/loyaltyExpiry.cron.ts. LoyaltyAccount.updatedAt already
   * bumps on every earn/redeem/adjust, so it doubles as "last activity" with
   * no separate tracking needed.
   */
  async expireInactiveAccounts(): Promise<{ ok: boolean; expiredCount: number }> {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - POINTS_EXPIRY_MONTHS);

      const accounts = await prisma.loyaltyAccount.findMany({
        where: { points: { gt: 0 }, updatedAt: { lte: cutoff } },
        include: { customer: { select: { id: true, fullName: true, email: true } } },
      });

      let expiredCount = 0;
      for (const account of accounts) {
        const result = await this.adjustPoints({
          customerId: account.customerId,
          points: -account.points,
          reason: `Points expired after ${POINTS_EXPIRY_MONTHS} months of inactivity`,
          adjustedById: 'system',
        });
        if (!result.ok) continue;
        expiredCount++;

        if (account.customer.email) {
          await dispatchNotification({
            type: 'order_status',
            to: [account.customer.email],
            subject: 'Loyalty Points Expired',
            data: {
              message: `Your ${account.points} loyalty points have expired after ${POINTS_EXPIRY_MONTHS} months of inactivity. Earn new points on your next purchase or service visit.`,
              customerName: account.customer.fullName,
            },
          }).catch(() => {});
        }
      }

      return { ok: true, expiredCount };
    } catch (error: any) {
      console.error('[LOYALTY EXPIRE INACTIVE ACCOUNTS ERROR]', error.message);
      return { ok: false, expiredCount: 0 };
    }
  },
};
