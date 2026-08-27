import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

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

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.preferredDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const testDrives = await prisma.testDrive.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            model: true,
            year: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

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

    const testDrive = await prisma.testDrive.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        vehicleId: data.vehicleId,
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
      },
      include: {
        vehicle: true,
      },
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
