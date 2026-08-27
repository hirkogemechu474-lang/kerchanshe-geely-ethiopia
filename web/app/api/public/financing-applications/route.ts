import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { generateReference } from '@/lib/reference';

async function sendApplicationNotifications(details: {
  applicationId: string;
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleName: string;
  bankName: string;
  programName: string;
  city: string;
  employmentStatus: string;
  monthlyIncome: number;
  downPaymentPercent: number;
  desiredTenureMonths: number;
  message: string;
}) {
  if (process.env.SMTP_ENABLED !== 'true') return;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!smtpUser || !smtpPass || !adminEmail) {
    console.warn('[financing-application:email] SMTP or ADMIN_EMAIL is not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });

  const applicantName = `${details.firstName} ${details.lastName}`;
  const summary = [
    `Applicant: ${applicantName}`,
    `Email: ${details.email}`,
    `Phone: ${details.phone}`,
    `Vehicle: ${details.vehicleName || 'Not specified'}`,
    `Bank: ${details.bankName || 'Not specified'}`,
    `Program: ${details.programName}`,
    `City: ${details.city || 'Not specified'}`,
    `Employment: ${details.employmentStatus || 'Not specified'}`,
    `Monthly income: ${details.monthlyIncome ? `ETB ${details.monthlyIncome.toLocaleString('en-US')}` : 'Not specified'}`,
    `Down payment: ${details.downPaymentPercent || 'Program default'}%`,
    `Desired term: ${details.desiredTenureMonths || 'Program default'} months`,
    `Message: ${details.message || 'None'}`,
    `Application ID: ${details.applicationId}`,
    `Reference: ${details.reference}`,
  ].join('\n');

  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || smtpUser}>`;

  try {
    await transporter.sendMail({
      from,
      to: adminEmail,
      replyTo: details.email,
      subject: `New Financing Application - ${applicantName}`,
      text: `A new financing application was submitted.\n\n${summary}`,
    });

    await transporter.sendMail({
      from,
      to: details.email,
      subject: 'Geely Ethiopia Financing Application Received',
      text: `Dear ${details.firstName},\n\nWe received your financing application for ${details.vehicleName || 'your selected vehicle'} through ${details.bankName || 'our financing team'}. Our team will contact you within 24-48 hours.\n\nReference: ${details.reference}\n\nThank you,\nGeely Ethiopia`,
    });
  } catch (error) {
    // The application is already saved; mail delivery must not make the form fail.
    console.error('[financing-application:email] Notification failed:', error);
  }
}

// POST /api/public/financing-applications
// Public financing application lead submission from the /financing/apply page.
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.contactForm);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();

    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const programId = String(body.programId || '').trim();
    const bankName = String(body.bankName || '').trim();
    const programName = String(body.programName || '').trim();
    const vehicleId = String(body.vehicleId || '').trim();
    const vehicleName = String(body.vehicleName || '').trim();
    const city = String(body.city || '').trim();
    const employmentStatus = String(body.employmentStatus || '').trim();
    const monthlyIncome = Number(body.monthlyIncome) || 0;
    const downPaymentPercent = Number(body.downPaymentPercent) || 0;
    const desiredTenureMonths = Number(body.desiredTenureMonths) || 0;
    const message = String(body.message || '').trim();
    const consent = body.consent === true;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!programId) {
      return NextResponse.json({ error: 'Program selection is required' }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    }

    const details = [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Program: ${programName || programId}`,
      bankName ? `Bank: ${bankName}` : '',
      vehicleName ? `Vehicle: ${vehicleName}${vehicleId ? ` (${vehicleId})` : ''}` : '',
      city ? `City: ${city}` : '',
      employmentStatus ? `Employment: ${employmentStatus}` : '',
      monthlyIncome ? `Monthly Income: ETB ${monthlyIncome.toLocaleString('en-US')}` : '',
      downPaymentPercent ? `Desired Down Payment: ${downPaymentPercent}%` : '',
      desiredTenureMonths ? `Desired Term: ${desiredTenureMonths} months` : '',
      message ? `Message: ${message}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const reference = await generateReference();
    const record = await prisma.message.create({
      data: {
        from: `${firstName} ${lastName}`,
        email,
        subject: `Financing Application - ${programName || programId}`,
        category: 'Financing',
        priority: 'normal',
        status: 'new',
        content: details,
        reference,
      },
    });

    await sendApplicationNotifications({
      applicationId: record.id,
      reference,
      firstName,
      lastName,
      email,
      phone,
      vehicleName,
      bankName,
      programName: programName || programId,
      city,
      employmentStatus,
      monthlyIncome,
      downPaymentPercent,
      desiredTenureMonths,
      message,
    });

    return NextResponse.json({ success: true, applicationId: record.id, reference }, { status: 201 });
  } catch (error) {
    console.error('[public:financing-applications:post]', error);
    return NextResponse.json({ error: 'Failed to submit financing application' }, { status: 500 });
  }
}
