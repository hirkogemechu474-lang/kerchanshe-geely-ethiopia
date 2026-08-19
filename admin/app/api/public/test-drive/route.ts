import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCorsHandler, corsPreflight } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/**
 * POST /api/public/test-drive
 * Submit test drive request from Web frontend
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
      preferredDate,
      preferredTime,
      message,
    } = body;

    if (!firstName || !lastName || !email || !phone || !vehicleInterest) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const testDrive = await prisma.message.create({
      data: {
        from: `${firstName} ${lastName}`.trim(),
        email,
        subject: `Test drive request: ${vehicleInterest}`,
        category: 'Test Drive',
        priority: 'medium',
        status: 'unread',
        content: JSON.stringify({
          phone,
          vehicleInterest,
          dealerPreference,
          preferredDate,
          preferredTime,
          message,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: testDrive,
      message: 'Test drive request submitted successfully',
    });
  } catch (error) {
    console.error('Error creating test drive request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit test drive request' },
      { status: 500 }
    );
  }
});
