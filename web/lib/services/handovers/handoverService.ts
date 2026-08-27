import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { userRepository } from '@/repositories/userRepository';
import { UPLOADS_ROOT, resolveUploadUrl } from '@/lib/upload-utils';
import { buildHandoverPdf, stampHandoverSignatureOnPdf, stampHandoverAgentSignatureText, stampHandoverAgentSignatureImage } from '@/lib/services/sales/handoverPdf';
import { isPdfUrl } from '@/lib/fileType';
import { env } from '@/lib/env';

export type SignHandoverResult =
  | { ok: true; handoverSignedDocumentUrl: string; handoverSignedAt: Date }
  | { ok: false; httpStatus: 400 | 404 | 409; error: string };

// Public — completes the self-service handover sign-off, mirroring
// agreementService.signAgreement exactly (same two modes, same
// one-way-only guard against overwriting an existing signature).
export async function signHandover(
  orderId: string,
  type: 'drawn' | 'photo',
  payload: { signatureDataUrl?: string; photoUrl?: string }
): Promise<SignHandoverResult> {
  const order = await salesOrderRepository.findById(orderId);
  if (!order) {
    return { ok: false, httpStatus: 404, error: 'Handover not found' };
  }
  if (!order.deliveredAt) {
    return { ok: false, httpStatus: 409, error: 'This order has not been marked as delivered yet.' };
  }
  if (order.handoverSignedDocumentUrl) {
    return { ok: false, httpStatus: 409, error: 'This handover has already been signed.' };
  }

  let handoverSignedDocumentUrl: string;
  let signedPdfBytes: Uint8Array | null = null;

  if (type === 'drawn') {
    const signatureDataUrl = payload.signatureDataUrl || '';
    if (!signatureDataUrl.startsWith('data:image/png')) {
      return { ok: false, httpStatus: 400, error: 'A valid drawn signature is required.' };
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
    const photoUrl = payload.photoUrl?.trim() || '';
    if (!photoUrl.startsWith('/uploads/')) {
      return { ok: false, httpStatus: 400, error: 'A valid uploaded photo is required.' };
    }
    handoverSignedDocumentUrl = photoUrl;
  }

  const updated = await salesOrderRepository.updateHandoverSignature(orderId, {
    handoverSignedDocumentUrl,
    handoverSignedAt: new Date(),
  });

  if (updated.customerEmail) {
    try {
      await sendSignedHandoverEmail(updated, orderId, handoverSignedDocumentUrl, signedPdfBytes);
    } catch (emailError) {
      console.error('[handover:sign:email]', emailError);
    }
  }

  return { ok: true, handoverSignedDocumentUrl: updated.handoverSignedDocumentUrl!, handoverSignedAt: updated.handoverSignedAt! };
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

export type StampCountersignedHandoverResult =
  | { stamped: true }
  | { stamped: false; reason: string }
  | { ok: false; httpStatus: 404 | 409 | 500; error: string };

// Called server-to-server by admin/app/api/admin/orders/[id]/handover-countersign
// right after it records handoverCountersignedAt/handoverCountersignedById —
// mirrors agreementService.stampCountersignedAgreement exactly, just for the
// handover confirmation instead of the sales agreement.
export async function stampCountersignedHandover(orderId: string, agentId: string): Promise<StampCountersignedHandoverResult> {
  const [order, agent] = await Promise.all([
    salesOrderRepository.findById(orderId),
    userRepository.findSignatureInfoById(agentId),
  ]);
  if (!order) {
    return { ok: false, httpStatus: 404, error: 'Order not found' };
  }
  if (!agent) {
    return { ok: false, httpStatus: 404, error: 'Countersigning user not found' };
  }
  if (!order.handoverSignedDocumentUrl || !order.handoverCountersignedAt) {
    return { ok: false, httpStatus: 409, error: 'This order has no countersigned handover to stamp.' };
  }
  if (!isPdfUrl(order.handoverSignedDocumentUrl)) {
    return { stamped: false, reason: 'signed document is not a PDF' };
  }

  const filePath = resolveUploadUrl(order.handoverSignedDocumentUrl);
  if (!filePath) {
    return { ok: false, httpStatus: 500, error: 'Could not resolve the signed document on disk.' };
  }

  try {
    const bytes = await readFile(filePath);
    let stamped: Uint8Array;
    if (agent.signatureUrl) {
      const signaturePath = resolveUploadUrl(agent.signatureUrl);
      const signatureBytes = signaturePath ? await readFile(signaturePath) : null;
      stamped = signatureBytes
        ? await stampHandoverAgentSignatureImage(bytes, signatureBytes, order.handoverCountersignedAt)
        : await stampHandoverAgentSignatureText(bytes, agent.name, order.handoverCountersignedAt);
    } else {
      stamped = await stampHandoverAgentSignatureText(bytes, agent.name, order.handoverCountersignedAt);
    }
    await writeFile(filePath, Buffer.from(stamped));
  } catch (error) {
    console.error('[handover:countersign-stamp]', error);
    return { ok: false, httpStatus: 500, error: 'Failed to stamp the handover confirmation.' };
  }

  return { stamped: true };
}
