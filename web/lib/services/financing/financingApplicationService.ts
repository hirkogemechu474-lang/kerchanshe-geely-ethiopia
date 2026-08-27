import nodemailer from 'nodemailer';
import { messageRepository } from '@/repositories/messageRepository';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';

export interface FinancingApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  programId: string;
  bankName: string;
  programName: string;
  vehicleId: string;
  vehicleName: string;
  city: string;
  employmentStatus: string;
  monthlyIncome: number;
  downPaymentPercent: number;
  desiredTenureMonths: number;
  message: string;
}

export async function submitFinancingApplication(input: FinancingApplicationInput) {
  const details = [
    `Name: ${input.firstName} ${input.lastName}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Program: ${input.programName || input.programId}`,
    input.bankName ? `Bank: ${input.bankName}` : '',
    input.vehicleName ? `Vehicle: ${input.vehicleName}${input.vehicleId ? ` (${input.vehicleId})` : ''}` : '',
    input.city ? `City: ${input.city}` : '',
    input.employmentStatus ? `Employment: ${input.employmentStatus}` : '',
    input.monthlyIncome ? `Monthly Income: ETB ${input.monthlyIncome.toLocaleString('en-US')}` : '',
    input.downPaymentPercent ? `Desired Down Payment: ${input.downPaymentPercent}%` : '',
    input.desiredTenureMonths ? `Desired Term: ${input.desiredTenureMonths} months` : '',
    input.message ? `Message: ${input.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const reference = await generateReference(REFERENCE_CATEGORY.FINANCING);
  const record = await messageRepository.create({
    from: `${input.firstName} ${input.lastName}`,
    email: input.email,
    subject: `Financing Application - ${input.programName || input.programId}`,
    category: 'Financing',
    priority: 'normal',
    status: 'new',
    content: details,
    reference,
  });

  await sendApplicationNotifications({
    applicationId: record.id,
    reference,
    ...input,
  });

  return { applicationId: record.id, reference };
}

async function sendApplicationNotifications(details: FinancingApplicationInput & { applicationId: string; reference: string }) {
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
