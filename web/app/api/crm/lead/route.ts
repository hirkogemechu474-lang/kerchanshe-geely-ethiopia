import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { getZohoAccessToken, invalidateZohoToken } from '@/lib/zoho-oauth';
import { enqueueLead } from '@/lib/lead-queue';
import { prisma } from '@/lib/prisma';
import { sendFormEmail } from '@/lib/form-email';

// NOTE: Removed `export const runtime = 'edge'` — Prisma requires Node.js runtime
// The edge runtime cannot connect to PostgreSQL via Prisma.

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leadSource: string;
  leadType: 'test-drive' | 'quote' | 'contact' | 'service';
  modelInterest?: string;
  vehicleId?: string;
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

async function saveLocalLead(leadData: LeadData) {
  if (leadData.leadType === 'test-drive') {
    const vehicle = await prisma.vehicle.findFirst({
      where: leadData.vehicleId
        ? { id: leadData.vehicleId }
        : { OR: [{ name: leadData.modelInterest || '' }, { slug: leadData.modelInterest || '' }] },
      select: { id: true, name: true },
    });
    if (vehicle && leadData.preferredDate && leadData.preferredTime) {
      const preferredDate = new Date(`${leadData.preferredDate}T00:00:00`);
      await prisma.testDrive.create({
        data: {
          customerName: `${leadData.firstName} ${leadData.lastName}`.trim(),
          customerEmail: leadData.email,
          customerPhone: leadData.phone,
          vehicleId: vehicle.id,
          preferredDate,
          preferredTime: leadData.preferredTime,
          location: leadData.preferredDealer || 'To be confirmed',
          specialRequests: leadData.message || null,
          status: 'pending',
        },
      });
      return;
    }
  }
  await prisma.message.create({
    data: {
      from: `${leadData.firstName} ${leadData.lastName}`.trim(),
      email: leadData.email,
      subject: `${STATUS_MAP[leadData.leadType] || 'Website'}: ${leadData.modelInterest || 'Customer enquiry'}`,
      category: leadData.leadType === 'test-drive' ? 'Test Drive' : leadData.leadType,
      priority: 'medium',
      status: 'unread',
      content: JSON.stringify({ phone: leadData.phone, modelInterest: leadData.modelInterest, preferredDealer: leadData.preferredDealer, preferredDate: leadData.preferredDate, preferredTime: leadData.preferredTime, message: leadData.message }),
    },
  });
}

interface ZohoLeadPayload {
  data: Array<{
    Last_Name: string;
    First_Name: string;
    Email: string;
    Phone: string;
    Lead_Source: string;
    Lead_Status: string;
    Description?: string;
    Company: string;
    Model_of_Interest?: string;
    Trim_Level?: string;
    Preferred_Dealer?: string;
    Test_Drive_Date?: string;
    Test_Drive_Time?: string;
    Financing_Interest?: boolean;
    Lead_Type?: string;
    UTM_Source?: string;
    UTM_Medium?: string;
    UTM_Campaign?: string;
    Website_URL?: string;
  }>;
}

const STATUS_MAP: Record<string, string> = {
  'test-drive': 'Test Drive Scheduled',
  'quote': 'Quote Requested',
  'contact': 'Contact Requested',
  'service': 'Service Inquiry',
};

async function submitToZoho(
  leadData: LeadData,
  accessToken: string
): Promise<Response> {
  const zohoApiUrl =
    process.env.ZOHO_CRM_API_URL || 'https://www.zohoapis.com/crm/v3/Leads';

  const zohoPayload: ZohoLeadPayload = {
    data: [
      {
        Last_Name: leadData.lastName,
        First_Name: leadData.firstName,
        Email: leadData.email,
        Phone: leadData.phone,
        Lead_Source: leadData.leadSource || 'Website',
        Lead_Status: STATUS_MAP[leadData.leadType] || 'New Lead',
        Company: 'Geely Ethiopia - Individual Customer',
        Description: leadData.message || '',
        Model_of_Interest: leadData.modelInterest,
        Trim_Level: leadData.trimInterest,
        Preferred_Dealer: leadData.preferredDealer,
        Test_Drive_Date: leadData.preferredDate,
        Test_Drive_Time: leadData.preferredTime,
        Financing_Interest: leadData.financingInterest,
        Lead_Type: leadData.leadType,
        UTM_Source: leadData.utm_source,
        UTM_Medium: leadData.utm_medium,
        UTM_Campaign: leadData.utm_campaign,
        Website_URL: leadData.pageUrl,
      },
    ],
  };

  return fetch(zohoApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(zohoPayload),
  });
}

/**
 * POST /api/crm/lead
 * Creates a new lead in Zoho CRM with OAuth refresh + retry queue fallback.
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

  try {
    await saveLocalLead(leadData);
  } catch (error) {
    console.error('[crm/lead] Failed to save local lead:', error);
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 });
  }
  let notificationSent = false;
  const reference = `GEELY-${Date.now().toString(36).toUpperCase()}`;
  try {
    notificationSent = await sendFormEmail({
      type: leadData.leadType,
      name: `${leadData.firstName} ${leadData.lastName}`.trim(),
      email: leadData.email,
      phone: leadData.phone,
      reference,
      subject: `${STATUS_MAP[leadData.leadType] || 'Website enquiry'}${leadData.modelInterest ? ` — ${leadData.modelInterest}` : ''}`,
      details: JSON.stringify({ model: leadData.modelInterest, dealer: leadData.preferredDealer, date: leadData.preferredDate, time: leadData.preferredTime, message: leadData.message }, null, 2),
    });
  } catch (error) {
    console.error('[crm/lead:email]', error);
  }

  // ── Dev mode shortcut ───────────────────────────────────────────────────────
  const hasZohoCredentials =
    process.env.ZOHO_CRM_REFRESH_TOKEN || process.env.ZOHO_CRM_ACCESS_TOKEN;

  if (!hasZohoCredentials) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[crm/lead] Zoho CRM is not configured; lead was saved locally');
      return NextResponse.json(
        {
          success: true,
          message: 'Lead captured locally; CRM integration is not configured',
          leadId: `local-${Date.now()}`,
          queued: false,
          notificationSent,
          reference,
        },
        { status: 202 }
      );
    }
    console.log('[crm/lead] DEV MODE — Lead data:', leadData);
    return NextResponse.json({
      success: true,
      message: 'Lead captured (dev mode)',
      leadId: `dev-${Date.now()}`,
      data: leadData,
      notificationSent,
      reference,
    });
  }

  // ── Get valid access token (auto-refreshes if needed) ──────────────────────
  let accessToken: string;
  try {
    accessToken = await getZohoAccessToken();
  } catch (tokenError) {
    const errMsg = tokenError instanceof Error ? tokenError.message : 'Token error';
    console.error('[crm/lead] Failed to get access token:', errMsg);
    // Enqueue for retry
    try {
      const queueId = await enqueueLead(leadData, errMsg);
      return NextResponse.json(
        {
          success: true,
          message: 'Lead queued for processing',
          queued: true,
          queueId,
          notificationSent,
        },
        { status: 202 }
      );
    } catch {
      return NextResponse.json({ error: 'CRM unavailable' }, { status: 503 });
    }
  }

  // ── First attempt ───────────────────────────────────────────────────────────
  let zohoResponse = await submitToZoho(leadData, accessToken);

  // ── If 401 (token expired mid-flight), invalidate cache and retry once ─────
  if (zohoResponse.status === 401) {
    console.warn('[crm/lead] Got 401 — invalidating token and retrying once');
    invalidateZohoToken();
    try {
      accessToken = await getZohoAccessToken();
      zohoResponse = await submitToZoho(leadData, accessToken);
    } catch (refreshError) {
      const errMsg = refreshError instanceof Error ? refreshError.message : 'Refresh failed';
      const queueId = await enqueueLead(leadData, errMsg).catch(() => null);
      return NextResponse.json(
        { success: true, message: 'Lead queued for processing', queued: true, queueId, notificationSent, reference },
        { status: 202 }
      );
    }
  }

  // ── Zoho server errors → enqueue for retry ─────────────────────────────────
  if (zohoResponse.status >= 500) {
    const errMsg = `Zoho returned HTTP ${zohoResponse.status}`;
    console.error('[crm/lead]', errMsg);
    const queueId = await enqueueLead(leadData, errMsg).catch(() => null);
      return NextResponse.json(
      { success: true, message: 'Lead queued for processing', queued: true, queueId, notificationSent, reference },
      { status: 202 }
    );
  }

  // ── Parse Zoho response ─────────────────────────────────────────────────────
  let zohoData: any;
  try {
    zohoData = await zohoResponse.json();
  } catch {
    return NextResponse.json({ error: 'Invalid CRM response' }, { status: 502 });
  }

  if (!zohoResponse.ok) {
    console.error('[crm/lead] Zoho error:', zohoData);
    return NextResponse.json(
      { error: 'Failed to create lead in CRM', details: zohoData },
      { status: zohoResponse.status }
    );
  }

  // Duplicate detection
  if (zohoData.data?.[0]?.status === 'error') {
    const errorDetails = zohoData.data[0];
    if (errorDetails.code === 'DUPLICATE_DATA') {
      return NextResponse.json({
        success: true,
        message: 'Lead already exists, updated with new information',
        leadId: errorDetails.details?.id,
        duplicate: true,
        notificationSent,
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Lead created successfully',
    leadId: zohoData.data?.[0]?.details?.id,
    data: zohoData.data?.[0],
    notificationSent,
  });
}

/**
 * GET /api/crm/lead?email=xxx
 * Check if lead exists in Zoho (for client-side duplicate detection).
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone parameter required' },
        { status: 400 }
      );
    }

    const hasCredentials =
      process.env.ZOHO_CRM_REFRESH_TOKEN || process.env.ZOHO_CRM_ACCESS_TOKEN;

    if (!hasCredentials) {
      return NextResponse.json({ exists: false, message: 'CRM check not available in dev mode' });
    }

    const accessToken = await getZohoAccessToken();
    const baseUrl = process.env.ZOHO_CRM_API_URL || 'https://www.zohoapis.com/crm/v3/Leads';
    const searchQuery = email
      ? `(Email:equals:${email})`
      : `(Phone:equals:${phone})`;
    const searchUrl = `${baseUrl}/search?criteria=${encodeURIComponent(searchQuery)}`;

    const zohoResponse = await fetch(searchUrl, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });

    const zohoData = await zohoResponse.json();

    if (zohoResponse.ok && zohoData.data?.length > 0) {
      return NextResponse.json({
        exists: true,
        leadId: zohoData.data[0].id,
        lead: zohoData.data[0],
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('[crm/lead GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
