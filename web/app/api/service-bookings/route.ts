import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { serviceBookingRepository } from '@/repositories/serviceBookingRepository';

// GET - List all service bookings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canViewServiceBookings) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const serviceType = searchParams.get('serviceType') || '';

    const bookings = await serviceBookingRepository.findMany({ status, serviceType });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching service bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new service booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canManageServiceBookings) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const booking = await serviceBookingRepository.create({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      vehicleModel: data.vehicleModel,
      vehicleYear: parseInt(data.vehicleYear),
      licensePlate: data.licensePlate,
      mileage: parseInt(data.mileage),
      serviceType: data.serviceType,
      scheduledDate: new Date(data.scheduledDate),
      scheduledTime: data.scheduledTime,
      location: data.location,
      serviceAdvisorId: data.serviceAdvisorId,
      status: 'scheduled',
      estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
      estimatedDuration: data.estimatedDuration,
      specialInstructions: data.specialInstructions,
      partsNeeded: data.partsNeeded,
      internalNotes: data.internalNotes,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating service booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
