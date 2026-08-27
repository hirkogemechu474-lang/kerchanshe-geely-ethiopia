import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { submitQuoteFormQuotation } from '@/lib/services/quotations/quotationService';

// POST - Create new quotation from public quote form
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.leadForm);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      vehicleId,
      vehicleName,
      purchaseTimeframe,
      financingNeeded,
      tradeIn,
      tradeInDetails,
      message,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !vehicleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await submitQuoteFormQuotation({
      firstName,
      lastName,
      email,
      phone,
      vehicleId,
      vehicleName,
      purchaseTimeframe,
      financingNeeded,
      tradeIn,
      tradeInDetails,
      message,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json(
      {
        success: true,
        quotation: result.quotation,
        reference: result.reference,
        message: 'Quote request submitted successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    );
  }
}
