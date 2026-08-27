import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { UPLOADS_ROOT, resolveUploadUrl } from '@/lib/upload-utils';
import { buildHandoverPdf, stampHandoverSignatureOnPdf } from '@/lib/sales/handoverPdf';
import { env } from '@/lib/env';

// Public — completes the self-service handover sign-off, mirroring
// web/app/api/agreement/[orderId]/sign/route.ts exactly (same two modes,
// same one-way-only guard against overwriting an existing signature).
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.handoverSign);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type === 'drawn' || body?.type === 'photo' ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: 'Invalid signing type' }, { status: 400 });
  }

  const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Handover not found' }, { status: 404 });
  }
  if (!order.deliveredAt) {
    return NextResponse.json({ error: 'This order has not been marked as delivered yet.' }, { status: 409 });
  }
  if (order.handoverSignedDocumentUrl) {
    return NextResponse.json({ error: 'This handover has already been signed.' }, { status: 409 });
  }

  let handoverSignedDocumentUrl: string;
  let signedPdfBytes: Uint8Array | null = null;

  if (type === 'drawn') {
    const signatureDataUrl = typeof body?.signatureDataUrl === 'string' ? body.signatureDataUrl : '';
    if (!signatureDataUrl.startsWith('data:image/png')) {
      return NextResponse.json({ error: 'A valid drawn signature is required.' }, { status: 400 });
    }
    const basePdf = await buildHandoverPdf(order);
    const signedPdf = await stampHandoverSignatureOnPdf(basePdf, signatureDataUrl);

    const uploadDir = path.join(UPLOADS_ROOT, 'signed-handovers');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filename = `${order.orderNo}-${Date.now()}.pdf`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(signedPdf));
    handoverSignedDocumentUrl = `/uploads/signed-handovers/${filename}`;
    signedPdfBytes = signedPdf;
  } else {
    const photoUrl = typeof body?.photoUrl === 'string' ? body.photoUrl.trim() : '';
    if (!photoUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'A valid uploaded photo is required.' }, { status: 400 });
    }
    handoverSignedDocumentUrl = photoUrl;
  }

  const updated = await prisma.salesOrder.update({
    where: { id: orderId },
    data: { handoverSignedDocumentUrl, handoverSignedAt: new Date() },
  });

  if (updated.customerEmail) {
    try {
      await sendSignedHandoverEmail(updated, orderId, handoverSignedDocumentUrl, signedPdfBytes);
    } catch (emailError) {
      console.error('[handover:sign:email]', emailError);
    }
  }

  return NextResponse.json({
    handoverSignedDocumentUrl: updated.handoverSignedDocumentUrl,
    handoverSignedAt: updated.handoverSignedAt,
  });
}

async function sendSignedHandoverEmail(
  order: { orderNo: string; customerName: string; customerEmail: string | null },
  orderId: string,
  handoverSignedDocumentUrl: string,
  signedPdfBytes: Uint8Array | null
) {
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS || !order.customerEmail) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  const siteUrl = env.app.url.replace(/\/$/, '');
  const documentUrl = `${siteUrl}${handoverSignedDocumentUrl}`;
  const handoverPageUrl = `${siteUrl}/handover/${encodeURIComponent(orderId)}`;

  let attachment: { filename: string; content: Buffer; contentType?: string } | null = null;
  if (signedPdfBytes) {
    attachment = { filename: `${order.orderNo}-handover-confirmation.pdf`, content: Buffer.from(signedPdfBytes), contentType: 'application/pdf' };
  } else {
    const filePath = resolveUploadUrl(handoverSignedDocumentUrl);
    if (filePath) {
      try {
        const fileBytes = await readFile(filePath);
        attachment = { filename: path.basename(filePath), content: fileBytes };
      } catch {
        // File unreadable — email still goes out with just the link.
      }
    }
  }

  const logoBytes = await readFile(path.join(process.cwd(), 'public', 'assets', 'logos', 'geely-logo.png')).catch(() => null);
  const logoHtml = `<div style="text-align:center;padding:24px 0;"><img src="cid:geely-logo" alt="Geely" style="height:56px;" /></div>`;
  const text = `Dear ${order.customerName},\n\nThank you. We received your handover confirmation for order ${order.orderNo}.\n\nView your signed confirmation: ${documentUrl}\nOrder status: ${handoverPageUrl}\n\nWelcome to the Geely family — congratulations on your new vehicle!`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2b4c;">${logoHtml}<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;"><h2 style="margin-top:0;">Dear ${order.customerName},</h2><p>Thank you. We received your handover confirmation for order <strong>${order.orderNo}</strong>.</p><div style="text-align:center;margin:28px 0;"><a href="${documentUrl}" style="background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px;display:inline-block;">View Signed Confirmation</a></div><p>Welcome to the Geely family — congratulations on your new vehicle!</p></div></div>`;

  const attachments = [
    ...(logoBytes ? [{ filename: 'geely-logo.png', content: logoBytes, cid: 'geely-logo' }] : []),
    ...(attachment ? [attachment] : []),
  ];

  await transporter.sendMail({
    from,
    to: order.customerEmail,
    subject: `Geely Ethiopia — Vehicle Handover Confirmed (${order.orderNo})`,
    text,
    html,
    attachments,
  });
}
