import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { sendFormEmail } from '@/lib/form-email';

// POST - Submit new quotation
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.leadForm);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const customerName = body.customerName || `${body.firstName || ''} ${body.lastName || ''}`.trim();
    const phoneNumber = body.phoneNumber || body.phone;
    const email = body.email;
    const vehicleModel = body.vehicleModel || body.vehicleName || body.vehicleId;
    const preferredDealer = body.preferredDealer;
    const financingInterest = body.financingInterest ?? body.financingNeeded === 'yes';
    const tradeInInterest = body.tradeInInterest ?? body.tradeIn === 'yes';
    const message = body.message;

    if (!customerName || !phoneNumber || !email || !vehicleModel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const quotation = await prisma.quotation.create({
      data: {
        customerName,
        phoneNumber,
        email,
        vehicleModel,
        preferredDealer: preferredDealer || null,
        financingInterest: financingInterest ?? false,
        tradeInInterest: tradeInInterest ?? false,
        message: message || null,
        status: 'new',
      },
    });

    const reference = `GEELY-QUOTE-${quotation.id.slice(0, 8).toUpperCase()}`;
    let notificationSent = false;
    try {
      notificationSent = await sendFormEmail({
        type: 'quotation request',
        name: customerName,
        email,
        phone: phoneNumber,
        reference,
        subject: `New quotation request — ${vehicleModel}`,
        details: [
          `Vehicle: ${vehicleModel}`,
          `Financing requested: ${financingInterest ? 'Yes' : 'No'}`,
          `Trade-in requested: ${tradeInInterest ? 'Yes' : 'No'}`,
          preferredDealer ? `Preferred dealer: ${preferredDealer}` : '',
          message ? `Message:\n${message}` : '',
        ].filter(Boolean).join('\n'),
      });
    } catch (error) {
      console.error('[quotations:email] Failed to send notification:', error);
    }

    return NextResponse.json({
      quotation,
      reference,
      notificationSent,
      message: 'Thank you for your quote request. We will contact you shortly.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to submit quotation' },
      { status: 500 }
    );
  } 
}
