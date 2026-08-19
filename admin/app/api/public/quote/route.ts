import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCorsHandler, corsPreflight } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/**
 * POST /api/public/quote
 * Submit quote request from Web frontend
 */
export const POST = withCorsHandler(async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      vehicleInterest,
      dealerPreference,
      financingType,
      tradeInVehicle,
      tradeInYear,
      tradeInMake,
      tradeInModel,
      message,
    } = body;

    if (!firstName || !lastName || !email || !phone || !vehicleInterest) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const quote = await prisma.quotation.create({
      data: {
        customerName: `${firstName} ${lastName}`.trim(),
        email,
        phoneNumber: phone,
        vehicleModel: vehicleInterest,
        preferredDealer: dealerPreference || null,
        financingInterest: Boolean(financingType),
        tradeInInterest: Boolean(tradeInVehicle),
        message: [message, financingType, tradeInYear, tradeInMake, tradeInModel]
          .filter(Boolean)
          .join(' | ') || null,
        status: 'new',
      },
    });

    return NextResponse.json({
      success: true,
      data: quote,
      message: 'Quote request submitted successfully',
    });
  } catch (error) {
    console.error('Error creating quote request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit quote request' },
      { status: 500 }
    );
  }
});
