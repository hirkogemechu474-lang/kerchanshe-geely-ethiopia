import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';
import type { Prisma, LoyaltyTier } from '@prisma/client';

// Rule-based targeting against real, already-tracked customer attributes —
// no free-text query language, no scheduling/automation. Each key is one
// AND'd condition; an unset key is simply not applied.
export interface SegmentCriteria {
  /** Customer.loyaltyAccount.tier is one of these. */
  loyaltyTiers?: LoyaltyTier[];
  /** Customer owns (CustomerVehicle) at least one vehicle of one of these models. */
  vehicleModels?: string[];
  /** Customer owns at least one vehicle with year <= this (targets older-vehicle owners, same "upgrade candidate" idea as repeatPurchaseService.detectOpportunities()). */
  vehicleYearBefore?: number;
  /** Customer owns at least one vehicle whose lastServiceDate is this many months stale (or was never serviced). */
  noServiceInMonths?: number;
  /** Case-insensitive substring match against Customer.address — best-effort
   * city/region filter, since there's no structured city field on Customer. */
  addressContains?: string;
}

function buildCustomerWhere(criteria: SegmentCriteria): Prisma.CustomerWhereInput {
  const AND: Prisma.CustomerWhereInput[] = [];

  if (criteria.loyaltyTiers?.length) {
    AND.push({ loyaltyAccount: { tier: { in: criteria.loyaltyTiers } } });
  }
  if (criteria.vehicleModels?.length) {
    AND.push({ vehicles: { some: { model: { in: criteria.vehicleModels } } } });
  }
  if (criteria.vehicleYearBefore) {
    AND.push({ vehicles: { some: { year: { lte: criteria.vehicleYearBefore } } } });
  }
  if (criteria.noServiceInMonths) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - criteria.noServiceInMonths);
    AND.push({
      vehicles: { some: { OR: [{ lastServiceDate: null }, { lastServiceDate: { lte: cutoff } }] } },
    });
  }
  if (criteria.addressContains?.trim()) {
    AND.push({ address: { contains: criteria.addressContains.trim(), mode: 'insensitive' } });
  }

  return AND.length ? { AND } : {};
}

const CUSTOMER_SELECT = { id: true, fullName: true, phone: true, email: true } as const;

export const segmentationService = {
  // Distinct vehicle models actually owned by a customer (CustomerVehicle),
  // for the "vehicle model" criteria picker — not the full Vehicle sales
  // catalog, since targeting is about what customers already drive.
  async listOwnedVehicleModels(): Promise<{ ok: boolean; data?: string[]; error?: string }> {
    try {
      const rows = await prisma.customerVehicle.findMany({
        where: { model: { not: null } },
        select: { model: true },
        distinct: ['model'],
        orderBy: { model: 'asc' },
      });
      return { ok: true, data: rows.map((r) => r.model!).filter(Boolean) };
    } catch (error: any) {
      console.error('[SEGMENT VEHICLE MODELS ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch vehicle models.' };
    }
  },

  async list(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const segments = await prisma.customerSegment.findMany({ orderBy: { createdAt: 'desc' } });
      return { ok: true, data: segments };
    } catch (error: any) {
      console.error('[SEGMENT LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch segments.' };
    }
  },

  async getById(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const segment = await prisma.customerSegment.findUnique({ where: { id } });
      if (!segment) return { ok: false, error: 'Segment not found.' };
      return { ok: true, data: segment };
    } catch (error: any) {
      console.error('[SEGMENT GET ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch segment.' };
    }
  },

  async create(data: { name: string; description?: string; criteria: SegmentCriteria }, createdById?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      if (!data.name?.trim()) return { ok: false, error: 'Segment name is required.' };
      const segment = await prisma.customerSegment.create({
        data: {
          name: data.name.trim(),
          description: data.description || null,
          criteria: data.criteria as Prisma.InputJsonValue,
          createdById: createdById || null,
        },
      });
      return { ok: true, data: segment };
    } catch (error: any) {
      console.error('[SEGMENT CREATE ERROR]', error.message);
      return { ok: false, error: 'Failed to create segment.' };
    }
  },

  async update(id: string, data: { name?: string; description?: string; criteria?: SegmentCriteria }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const segment = await prisma.customerSegment.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.criteria !== undefined && { criteria: data.criteria as Prisma.InputJsonValue }),
        },
      });
      return { ok: true, data: segment };
    } catch (error: any) {
      console.error('[SEGMENT UPDATE ERROR]', error.message);
      return { ok: false, error: 'Failed to update segment.' };
    }
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await prisma.customerSegment.delete({ where: { id } });
      return { ok: true };
    } catch (error: any) {
      console.error('[SEGMENT DELETE ERROR]', error.message);
      return { ok: false, error: 'Failed to delete segment.' };
    }
  },

  async resolveCustomers(criteria: SegmentCriteria) {
    return prisma.customer.findMany({
      where: buildCustomerWhere(criteria),
      select: CUSTOMER_SELECT,
      orderBy: { fullName: 'asc' },
    });
  },

  async preview(criteria: SegmentCriteria, sampleSize = 20): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const where = buildCustomerWhere(criteria);
      const [total, emailable, sample] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.count({ where: { ...where, email: { not: null } } }),
        prisma.customer.findMany({ where, select: CUSTOMER_SELECT, take: sampleSize, orderBy: { fullName: 'asc' } }),
      ]);
      return { ok: true, data: { total, emailable, sample } };
    } catch (error: any) {
      console.error('[SEGMENT PREVIEW ERROR]', error.message);
      return { ok: false, error: 'Failed to preview segment.' };
    }
  },

  // Manual send only — no scheduling/automation. Loops recipients (rather
  // than one dispatchNotification call with all emails in `to`, which joins
  // every recipient into a single comma-separated To: header) so customers
  // never see each other's email addresses, and each gets a personalized
  // greeting.
  async sendCampaign(params: {
    criteria: SegmentCriteria;
    subject: string;
    message: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }): Promise<{ ok: boolean; data?: { totalMatched: number; emailable: number; sentCount: number; failedCount: number }; error?: string }> {
    try {
      if (!params.subject?.trim() || !params.message?.trim()) {
        return { ok: false, error: 'Subject and message are required.' };
      }
      const customers = await this.resolveCustomers(params.criteria);
      const emailable = customers.filter((c) => c.email);

      let sentCount = 0;
      let failedCount = 0;
      for (const customer of emailable) {
        const result = await dispatchNotification({
          type: 'campaign',
          to: [customer.email!],
          subject: params.subject,
          data: { message: params.message },
          greetingName: customer.fullName,
          ...(params.ctaLabel && params.ctaUrl ? { ctas: [{ label: params.ctaLabel, url: params.ctaUrl }] } : {}),
        });
        if (result.ok) sentCount++;
        else failedCount++;
      }

      return {
        ok: true,
        data: { totalMatched: customers.length, emailable: emailable.length, sentCount, failedCount },
      };
    } catch (error: any) {
      console.error('[SEGMENT SEND CAMPAIGN ERROR]', error.message);
      return { ok: false, error: 'Failed to send campaign.' };
    }
  },
};
