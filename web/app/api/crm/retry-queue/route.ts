import { NextRequest, NextResponse } from 'next/server';
import { getPendingLeads, markLeadSucceeded, markLeadRetryFailed } from '@/lib/lead-queue';
import { getZohoAccessToken, invalidateZohoToken } from '@/lib/zoho-oauth';

/**
 * POST /api/crm/retry-queue
 * Processes all pending leads in the retry queue.
 *
 * Intended to be called by:
 *   - A cron job (e.g. every 5 minutes via Vercel Cron or external scheduler)
 *   - Admin manual trigger
 *
 * Secured with CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  // Verify secret to prevent abuse
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const zohoApiUrl =
    process.env.ZOHO_CRM_API_URL || 'https://www.zohoapis.com/crm/v3/Leads';

  const pending = await getPendingLeads(20); // Process up to 20 at a time

  if (pending.length === 0) {
    return NextResponse.json({ message: 'No pending leads', processed: 0 });
  }

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  let accessToken: string;
  try {
    accessToken = await getZohoAccessToken();
  } catch (err) {
    return NextResponse.json(
      { error: 'Cannot get Zoho token', details: String(err) },
      { status: 503 }
    );
  }

  for (const lead of pending) {
    try {
      const payload = lead.payload as Record<string, unknown>;

      const zohoPayload = {
        data: [
          {
            Last_Name: payload.lastName,
            First_Name: payload.firstName,
            Email: payload.email,
            Phone: payload.phone,
            Lead_Source: payload.leadSource || 'Website',
            Lead_Status: 'New Lead',
            Company: 'Geely Ethiopia - Individual Customer',
            Description: payload.message || `Queued lead (attempt ${lead.attemptCount + 1})`,
            Model_of_Interest: payload.modelInterest,
            Lead_Type: payload.leadType,
          },
        ],
      };

      let response = await fetch(zohoApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(zohoPayload),
      });

      // Token expired — refresh and retry once
      if (response.status === 401) {
        invalidateZohoToken();
        accessToken = await getZohoAccessToken();
        response = await fetch(zohoApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(zohoPayload),
        });
      }

      if (response.ok) {
        const data = await response.json();
        const zohoId = data?.data?.[0]?.details?.id;
        await markLeadSucceeded(lead.id, zohoId);
        succeeded++;
      } else {
        const errText = await response.text();
        await markLeadRetryFailed(lead.id, `HTTP ${response.status}: ${errText}`, lead.attemptCount);
        failed++;
        errors.push(`Lead ${lead.id}: HTTP ${response.status}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await markLeadRetryFailed(lead.id, errMsg, lead.attemptCount);
      failed++;
      errors.push(`Lead ${lead.id}: ${errMsg}`);
    }
  }

  return NextResponse.json({
    message: 'Retry queue processed',
    total: pending.length,
    succeeded,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * GET /api/crm/retry-queue
 * Returns the current queue status.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pending = await getPendingLeads(100);

  return NextResponse.json({
    pendingCount: pending.length,
    leads: pending.map((l: typeof pending[number]) => ({
      id: l.id,
      status: l.status,
      attemptCount: l.attemptCount,
      lastError: l.lastError,
      nextRetryAt: l.nextRetryAt,
      leadType: l.leadType,
      email: l.email,
    })),
  });
}
