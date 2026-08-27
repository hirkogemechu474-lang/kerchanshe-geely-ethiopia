import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';

interface ServiceRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleModel: string;
  vehicleYear: string;
  mileage: string;
  vin?: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  description?: string;
  consent: boolean;
}

async function sendNotification(details: ServiceRequest, bookingId: string) {
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  const text = [
    'New service appointment request',
    `Booking ID: ${bookingId}`,
    `Customer: ${details.firstName} ${details.lastName}`,
    `Email: ${details.email}`,
    `Phone: ${details.phone}`,
    `Vehicle: ${details.vehicleModel} (${details.vehicleYear})`,
    `Mileage: ${details.mileage}`,
    `VIN: ${details.vin || 'Not provided'}`,
    `Service: ${details.serviceType}`,
    `Preferred date: ${details.preferredDate}`,
    `Preferred time: ${details.preferredTime}`,
    `Service center: ${details.location}`,
    `Description: ${details.description || 'Not provided'}`,
  ].join('\n');

  await transporter.sendMail({ from, to: process.env.ADMIN_EMAIL, replyTo: details.email, subject: `New service request — ${details.vehicleModel}`, text });
  await transporter.sendMail({ from, to: details.email, subject: 'Geely Ethiopia service request received', text: `Thank you, ${details.firstName}. We received your service request for ${details.vehicleModel} on ${details.preferredDate}. Our team will contact you to confirm the appointment.\n\nReference: ${bookingId}` });
  return true;
}

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

    const reference = await generateReference(REFERENCE_CATEGORY.SERVICE_BOOKING);
    const booking = await prisma.serviceBooking.create({
      data: {
        customerName: `${body.firstName.trim()} ${body.lastName.trim()}`,
        customerPhone: body.phone.trim(),
        customerEmail: body.email.trim().toLowerCase(),
        vehicleInfo: `${body.vehicleModel.trim()} (${body.vehicleYear.trim()}), mileage ${body.mileage.trim()}${body.vin?.trim() ? `, VIN ${body.vin.trim()}` : ''}`,
        serviceType: body.serviceType.trim(),
        date,
        status: 'scheduled',
        notes: [`Preferred time: ${body.preferredTime}`, `Service center: ${body.location}`, body.description?.trim() ? `Details: ${body.description.trim()}` : ''].filter(Boolean).join('\n'),
        reference,
      },
    });

    let notificationSent = false;
    try {
      notificationSent = await sendFormEmail({
        type: 'service appointment',
        name: `${body.firstName} ${body.lastName}`.trim(),
        email: body.email,
        phone: body.phone,
        subject: `New service appointment — ${body.vehicleModel}`,
        reference,
        details: [
          `Vehicle: ${body.vehicleModel} (${body.vehicleYear})`,
          `Mileage: ${body.mileage}`,
          `VIN: ${body.vin || 'Not provided'}`,
          `Service: ${body.serviceType}`,
          `Preferred date: ${body.preferredDate}`,
          `Preferred time: ${body.preferredTime}`,
          `Service center: ${body.location}`,
          `Description: ${body.description || 'Not provided'}`,
        ].join('\n'),
      });
    } catch (emailError) {
      console.error('[service-booking:email]', emailError);
    }

    return NextResponse.json({ success: true, bookingId: booking.id, reference, notificationSent, message: notificationSent ? 'Appointment saved and confirmation email sent.' : 'Appointment saved. Email notification is not configured or could not be delivered.' }, { status: 201 });
  } catch (error) {
    console.error('[service-booking:create]', error);
    return NextResponse.json({ error: 'Unable to submit the service request right now.' }, { status: 500 });
  }
}
