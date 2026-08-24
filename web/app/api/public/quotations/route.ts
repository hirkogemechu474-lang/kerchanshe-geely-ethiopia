import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { generateReference } from '@/lib/reference';

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

    const reference = generateReference();

    // Build customer name
    const customerName = `${firstName} ${lastName}`;

    // Build notes with all details
    const notes = `
Purchase Timeframe: ${purchaseTimeframe || 'Not specified'}
Financing Needed: ${financingNeeded || 'Not specified'}
Trade-In: ${tradeIn || 'No'}
${tradeInDetails ? `Trade-In Details: ${tradeInDetails}` : ''}
${message ? `Additional Message: ${message}` : ''}
    `.trim();

    // Fetch vehicle details to get price
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { 
        id: true, 
        name: true,
        finalPrice: true,
        basePrice: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const amount = vehicle.finalPrice || vehicle.basePrice;

    // Create quotation
    const quotation = await prisma.quotation.create({
      data: {
        customerName,
        email,
        phoneNumber: phone,
        vehicleModel: vehicleName || vehicle.name,
        message: notes,
        financingInterest: Boolean(financingNeeded),
        tradeInInterest: Boolean(tradeIn),
        status: 'new',
        reference,
      },
    });

    return NextResponse.json(
      {
        success: true,
        quotation,
        reference,
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
