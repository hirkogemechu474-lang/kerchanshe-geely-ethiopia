import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
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

const STATUS_MAP: Record<string, string> = {
  'test-drive': 'Test Drive Scheduled',
  'quote': 'Quote Requested',
  'contact': 'Contact Requested',
  'service': 'Service Inquiry',
};

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

  return NextResponse.json({
    success: true,
    message: 'Lead captured successfully',
    leadId: `local-${Date.now()}`,
    notificationSent,
    reference,
  });
}
