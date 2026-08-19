/**
 * Lead Retry Queue
 *
 * When Zoho CRM is unreachable or returns a server error, leads are
 * stored in the PendingLead table and can be retried via a background
 * job or manual admin action.
 *
 * This ensures zero lead loss during CRM downtime.
 */

import { prisma } from '@/lib/prisma';

interface LeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leadSource: string;
  leadType: string;
  modelInterest?: string;
  trimInterest?: string;
  message?: string;
  preferredDealer?: string;
  preferredDate?: string;
  preferredTime?: string;
  financingInterest?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  pageUrl?: string;
  consentGiven: boolean;
}

/**
 * Enqueue a lead for retry after a CRM failure.
 * Returns the queued record ID.
 */
export async function enqueueLead(
  payload: LeadPayload,
  errorMessage: string
): Promise<string> {
  try {
    const record = await prisma.pendingLead.create({
      data: {
        payload: payload as any,
        leadType: payload.leadType,
        email: payload.email,
        phone: payload.phone,
        lastError: errorMessage,
        status: 'pending',
        attemptCount: 1,
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // retry in 5 minutes
      },
    });
    console.log(`[lead-queue] Enqueued lead ${record.id} for retry. Error: ${errorMessage}`);
    return record.id;
  } catch (dbError) {
    console.error('[lead-queue] Failed to enqueue lead to DB:', dbError);
    throw dbError;
  }
}

/**
 * Fetch pending leads that are due for retry.
 */
export async function getPendingLeads(limit = 50) {
  return prisma.pendingLead.findMany({
    where: {
      status: { in: ['pending', 'retrying'] },
      attemptCount: { lt: 5 }, // Max 5 attempts
      nextRetryAt: { lte: new Date() },
    },
    orderBy: { nextRetryAt: 'asc' },
    take: limit,
  });
}

/**
 * Mark a queued lead as successfully submitted.
 */
export async function markLeadSucceeded(id: string, zohoLeadId?: string): Promise<void> {
  await prisma.pendingLead.update({
    where: { id },
    data: {
      status: 'succeeded',
      lastError: zohoLeadId ? `Synced as Zoho Lead: ${zohoLeadId}` : 'Synced successfully',
    },
  });
}

/**
 * Mark a retry attempt as failed and schedule next retry with exponential backoff.
 */
export async function markLeadRetryFailed(id: string, error: string, attemptCount: number): Promise<void> {
  const backoffMinutes = Math.pow(2, attemptCount) * 5; // 5, 10, 20, 40, 80 minutes
  const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);
  const newStatus = attemptCount >= 4 ? 'failed' : 'pending';

  await prisma.pendingLead.update({
    where: { id },
    data: {
      status: newStatus,
      lastError: error,
      attemptCount: { increment: 1 },
      nextRetryAt: nextRetry,
    },
  });

  if (newStatus === 'failed') {
    console.error(`[lead-queue] Lead ${id} permanently failed after ${attemptCount + 1} attempts: ${error}`);
  }
}
