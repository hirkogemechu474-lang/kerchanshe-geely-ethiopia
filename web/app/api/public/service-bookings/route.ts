import { NextRequest, NextResponse } from 'next/server';
import { submitServiceBooking, type ServiceRequest } from '@/lib/services/serviceBookings/serviceBookingService';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ServiceRequest;
    const required = ['firstName', 'lastName', 'email', 'phone', 'vehicleModel', 'vehicleYear', 'mileage', 'serviceType', 'preferredDate', 'preferredTime', 'location'];
    if (required.some((key) => !String(body[key as keyof ServiceRequest] || '').trim()) || body.consent !== true) {
      return NextResponse.json({ error: 'Please complete all required fields and accept the consent notice.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const date = new Date(`${body.preferredDate}T09:00:00`);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Please provide a valid preferred date.' }, { status: 400 });
    }

    const { booking, reference, notificationSent } = await submitServiceBooking(body);

    return NextResponse.json({ success: true, bookingId: booking.id, reference, notificationSent, message: notificationSent ? 'Appointment saved and confirmation email sent.' : 'Appointment saved. Email notification is not configured or could not be delivered.' }, { status: 201 });
  } catch (error) {
    console.error('[service-booking:create]', error);
    return NextResponse.json({ error: 'Unable to submit the service request right now.' }, { status: 500 });
  }
}
