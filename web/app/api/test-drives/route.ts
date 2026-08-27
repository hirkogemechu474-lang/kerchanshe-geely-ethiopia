import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { testDriveRepository } from '@/repositories/testDriveRepository';

// GET - List all test drives
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canViewTestDrives) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const testDrives = await testDriveRepository.findMany({ status, startDate, endDate });

    return NextResponse.json(testDrives);
  } catch (error) {
    console.error('Error fetching test drives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new test drive booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canManageTestDrives) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const testDrive = await testDriveRepository.create({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      vehicle: { connect: { id: data.vehicleId } },
      preferredDate: new Date(data.preferredDate),
      preferredTime: data.preferredTime,
      alternativeDate: data.alternativeDate ? new Date(data.alternativeDate) : null,
      alternativeTime: data.alternativeTime,
      location: data.location,
      salesRepId: data.salesRepId,
      status: 'pending',
      specialRequests: data.specialRequests,
      internalNotes: data.internalNotes,
      emailConfirm: data.emailConfirm !== false,
      smsReminder: data.smsReminder !== false,
    });

    // TODO: Send email confirmation if emailConfirm is true
    // TODO: Schedule SMS reminder if smsReminder is true

    return NextResponse.json(testDrive, { status: 201 });
  } catch (error) {
    console.error('Error creating test drive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
