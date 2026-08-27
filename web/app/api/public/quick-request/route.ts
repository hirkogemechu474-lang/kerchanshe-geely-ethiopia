import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference } from '@/lib/reference';
import { nextSalesRep } from '@/lib/assignSalesRep';

// POST /api/public/quick-request
// The "one tap" alternative to the full quote form — name + phone only, no
// email/consent/financing/timeframe questions. Creates a real Quotation
// (source: 'quick-request') so it shows up in the normal admin pipeline,
// just tagged distinctly. Email is intentionally omitted (Quotation.email
// is nullable), so only the admin notification fires — sendFormEmail skips
// the customer confirmation when there's no address to send it to.
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.leadForm);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const vehicleModel = String(body.vehicleModel || '').trim() || null;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const reference = await generateReference();
    const assignedRep = await nextSalesRep();

    const quotation = await prisma.quotation.create({
      data: {
        customerName: name,
        phoneNumber: phone,
        vehicleModel,
        source: 'quick-request',
        status: 'new',
        reference,
        assignedTo: assignedRep?.name ?? null,
      },
    });

    let notificationSent = false;
    try {
      notificationSent = await sendFormEmail({
        type: 'callback request',
        name,
        phone,
        reference,
        subject: `New callback request${vehicleModel ? ` — ${vehicleModel}` : ''}`,
        details: [
          vehicleModel ? `Vehicle: ${vehicleModel}` : '',
          assignedRep ? `Assigned Sales Consultant: ${assignedRep.name}` : '',
        ].filter(Boolean).join('\n'),
      });
    } catch (error) {
      console.error('[quick-request:email]', error);
    }

    return NextResponse.json({ success: true, reference, notificationSent }, { status: 201 });
  } catch (error) {
    console.error('[quick-request:create]', error);
    return NextResponse.json({ error: 'Unable to submit your request right now.' }, { status: 500 });
  }
}
