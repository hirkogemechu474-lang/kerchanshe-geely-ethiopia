import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { submitCrmLead, type LeadData } from '@/lib/services/crm/leadService';

// NOTE: Removed `export const runtime = 'edge'` — Prisma requires Node.js runtime
// The edge runtime cannot connect to PostgreSQL via Prisma.

/**
 * POST /api/crm/lead
 * Saves a lead locally and sends a notification email.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.leadForm);
  if (rateLimitResult) return rateLimitResult;

  let leadData: LeadData;

  try {
    leadData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  if (!leadData.firstName || !leadData.lastName || !leadData.email || !leadData.phone) {
    return NextResponse.json(
      { error: 'Missing required fields: firstName, lastName, email, phone' },
      { status: 400 }
    );
  }

  if (!leadData.consentGiven) {
    return NextResponse.json(
      { error: 'User consent is required' },
      { status: 400 }
    );
  }

  const result = await submitCrmLead(leadData);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({
    success: true,
    message: 'Lead captured successfully',
    leadId: `local-${Date.now()}`,
    notificationSent: result.notificationSent,
    reference: result.reference,
    testDriveId: result.testDriveId,
  });
}
