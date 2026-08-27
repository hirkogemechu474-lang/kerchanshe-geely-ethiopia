import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference } from '@/lib/reference';
import { nextSalesRep } from '@/lib/assignSalesRep';

interface TradeInBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentMake: string;
  currentModel: string;
  currentYear: string;
  currentMileage: string;
  currentCondition: string;
  vin?: string;
  hasAccidents: string;
  hasModifications: string;
  serviceHistory: string;
  interestedModel: string;
  purchaseTimeframe: string;
  financingNeeded: string;
  additionalInfo?: string;
  consentGiven: boolean;
}

// POST /api/public/trade-in
// There is no dedicated TradeIn table — this reuses the same generic
// Message-backed pattern as other lead-capture forms (see
// app/api/crm/lead/route.ts's fallback branch), storing the full
// vehicle-condition questionnaire as JSON in `content` so sales staff see
// every field the customer entered, not just a summary line.
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.leadForm);
  if (rateLimitResult) return rateLimitResult;

  let body: TradeInBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const required: Array<keyof TradeInBody> = [
    'firstName', 'lastName', 'email', 'phone',
    'currentMake', 'currentModel', 'currentYear', 'currentMileage', 'currentCondition',
    'hasAccidents', 'hasModifications', 'serviceHistory',
    'interestedModel', 'purchaseTimeframe', 'financingNeeded',
  ];
  for (const field of required) {
    if (!String(body[field] ?? '').trim()) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }
  if (!body.consentGiven) {
    return NextResponse.json({ error: 'User consent is required' }, { status: 400 });
  }

  const reference = await generateReference();
  const name = `${body.firstName} ${body.lastName}`.trim();
  const currentVehicle = `${body.currentYear} ${body.currentMake} ${body.currentModel}`.trim();

  try {
    const assignedRep = await nextSalesRep();

    await prisma.message.create({
      data: {
        from: name,
        email: body.email,
        subject: `Trade-In Request: ${currentVehicle} → ${body.interestedModel}`,
        category: 'Trade-In',
        priority: 'medium',
        status: 'unread',
        reference,
        content: JSON.stringify({
          phone: body.phone,
          currentVehicle: {
            make: body.currentMake,
            model: body.currentModel,
            year: body.currentYear,
            mileage: body.currentMileage,
            condition: body.currentCondition,
            vin: body.vin || null,
            hasAccidents: body.hasAccidents,
            hasModifications: body.hasModifications,
            serviceHistory: body.serviceHistory,
          },
          interestedModel: body.interestedModel,
          purchaseTimeframe: body.purchaseTimeframe,
          financingNeeded: body.financingNeeded,
          additionalInfo: body.additionalInfo || null,
          assignedSalesConsultant: assignedRep?.name ?? null,
        }),
      },
    });

    let notificationSent = false;
    try {
      notificationSent = await sendFormEmail({
        type: 'trade-in request',
        name,
        email: body.email,
        phone: body.phone,
        reference,
        subject: `New trade-in request — ${currentVehicle} for ${body.interestedModel}`,
        details: [
          `Current vehicle: ${currentVehicle} (${body.currentMileage} km, ${body.currentCondition})`,
          body.vin ? `VIN: ${body.vin}` : '',
          `Accidents: ${body.hasAccidents} · Modifications: ${body.hasModifications} · Service history: ${body.serviceHistory}`,
          `Interested in: ${body.interestedModel}`,
          `Timeframe: ${body.purchaseTimeframe} · Financing needed: ${body.financingNeeded}`,
          body.additionalInfo ? `Notes: ${body.additionalInfo}` : '',
          assignedRep ? `Assigned Sales Consultant: ${assignedRep.name}` : '',
        ].filter(Boolean).join('\n'),
      });
    } catch (error) {
      console.error('[trade-in:email]', error);
    }

    return NextResponse.json({ success: true, reference, notificationSent }, { status: 201 });
  } catch (error) {
    console.error('[trade-in:create]', error);
    return NextResponse.json({ error: 'Could not submit your trade-in request. Please try again.' }, { status: 500 });
  }
}
