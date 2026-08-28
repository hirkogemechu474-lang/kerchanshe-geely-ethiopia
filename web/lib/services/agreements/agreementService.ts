import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { userRepository } from '@/repositories/userRepository';
import { UPLOADS_ROOT, resolveUploadUrl } from '@/lib/upload-utils';
import { buildSalesAgreementPdf, stampSignatureOnPdf, stampAgentSignatureText, stampAgentSignatureImage } from '@/lib/services/sales/salesAgreementPdf';
import { isPdfUrl } from '@/lib/fileType';
import { env } from '@/lib/env';
import { notifyManagersOfSignedAgreement } from '@/lib/services/agreements/agreementNotifications';

export type SignAgreementResult =
  | { ok: true; signedDocumentUrl: string; signedAt: Date }
  | { ok: false; httpStatus: 400 | 404 | 409; error: string };

// Public — completes the self-service "e-sign or attach" step. Two ways in,
// both one-way (an already-signed order 409s rather than overwriting):
// - `type: 'drawn'` — a PNG data URL from the signing page's canvas is
//   stamped onto the base PDF and saved as the customer's signed copy.
// - `type: 'photo'` — the customer already uploaded a photo of a signed
//   printout via the existing public POST /api/upload/image, and this
//   just records that URL against the order.
export async function signAgreement(
  orderId: string,
  type: 'drawn' | 'photo',
  payload: { signatureDataUrl?: string; photoUrl?: string }
): Promise<SignAgreementResult> {
  const order = await salesOrderRepository.findById(orderId);
  if (!order) {
    return { ok: false, httpStatus: 404, error: 'Agreement not found' };
  }
  if (!order.approvedAt) {
    return { ok: false, httpStatus: 409, error: 'This order has not been approved yet.' };
  }
  if (order.signedDocumentUrl) {
    return { ok: false, httpStatus: 409, error: 'This agreement has already been signed.' };
  }

  let signedDocumentUrl: string;
  // Kept only when we already have PDF bytes in hand (the 'drawn' case) so
  // the confirmation email can attach the exact signed document without a
  // redundant disk read.
  let signedPdfBytes: Uint8Array | null = null;

  if (type === 'drawn') {
    const signatureDataUrl = payload.signatureDataUrl || '';
    if (!signatureDataUrl.startsWith('data:image/png')) {
      return { ok: false, httpStatus: 400, error: 'A valid drawn signature is required.' };
    }
    const basePdf = await buildSalesAgreementPdf(order);
    const signedPdf = await stampSignatureOnPdf(basePdf, signatureDataUrl);

    const uploadDir = path.join(UPLOADS_ROOT, 'signed-agreements');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filename = `${order.orderNo}-${Date.now()}.pdf`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(signedPdf));
    signedDocumentUrl = `/uploads/signed-agreements/${filename}`;
    signedPdfBytes = signedPdf;
  } else {
    const photoUrl = payload.photoUrl?.trim() || '';
    if (!photoUrl.startsWith('/uploads/')) {
      return { ok: false, httpStatus: 400, error: 'A valid uploaded photo is required.' };
    }
    signedDocumentUrl = photoUrl;
  }

  const updated = await salesOrderRepository.updateSignature(orderId, {
    signedDocumentUrl,
    signedAt: new Date(),
  });

  if (updated.customerEmail) {
    try {
      await sendSignedAgreementEmail(updated, orderId, signedDocumentUrl, signedPdfBytes);
    } catch (emailError) {
      console.error('[agreement:sign:email]', emailError);
    }
  }

  await notifyManagersOfSignedAgreement(updated);

  return { ok: true, signedDocumentUrl: updated.signedDocumentUrl!, signedAt: updated.signedAt! };
}

async function sendSignedAgreementEmail(
  order: { orderNo: string; customerName: string; customerEmail: string | null },
  orderId: string,
  signedDocumentUrl: string,
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
  const documentUrl = `${siteUrl}${signedDocumentUrl}`;
  const agreementPageUrl = `${siteUrl}/agreement/${encodeURIComponent(orderId)}`;

  // Attach the exact bytes we just wrote when we have them (the 'drawn'
  // case). A 'photo' upload has no PDF to attach — read back whatever file
  // the customer uploaded instead, so the email always carries a copy of
  // what's now on file rather than only a link.
  let attachment: { filename: string; content: Buffer; contentType?: string } | null = null;
  if (signedPdfBytes) {
    attachment = { filename: `${order.orderNo}-signed-agreement.pdf`, content: Buffer.from(signedPdfBytes), contentType: 'application/pdf' };
  } else {
    const filePath = resolveUploadUrl(signedDocumentUrl);
    if (filePath) {
      try {
        const fileBytes = await readFile(filePath);
        attachment = { filename: path.basename(filePath), content: fileBytes };
      } catch {
        // File unreadable — email still goes out with just the link.
      }
    }
  }

  // Most mail clients (Gmail included) won't fetch an <img src> pointing at
  // http://localhost, and many block remote images by default even when the
  // URL is public — so the logo is attached inline via cid instead of linked.
  const logoBytes = await readFile(path.join(process.cwd(), 'public', 'assets', 'logos', 'geely-logo.png')).catch(() => null);
  const logoHtml = `<div style="text-align:center;padding:24px 0;"><img src="cid:geely-logo" alt="Geely" style="height:56px;" /></div>`;
  const text = `Dear ${order.customerName},\n\nThank you. We received your signed sales agreement for order ${order.orderNo}.\n\nView your signed agreement: ${documentUrl}\nOrder status: ${agreementPageUrl}\n\nOur sales team will be in touch with next steps.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2b4c;">${logoHtml}<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;"><h2 style="margin-top:0;">Dear ${order.customerName},</h2><p>Thank you. We received your signed sales agreement for order <strong>${order.orderNo}</strong>.</p><div style="text-align:center;margin:28px 0;"><a href="${documentUrl}" style="background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px;display:inline-block;">View Signed Agreement</a></div><p>Our sales team will be in touch with next steps.</p></div></div>`;

  const attachments = [
    ...(logoBytes ? [{ filename: 'geely-logo.png', content: logoBytes, cid: 'geely-logo' }] : []),
    ...(attachment ? [attachment] : []),
  ];

  await transporter.sendMail({
    from,
    to: order.customerEmail,
    subject: `Geely Ethiopia — Sales Agreement Signed (${order.orderNo})`,
    text,
    html,
    attachments,
  });
}

export type StampCountersignResult =
  | { stamped: true }
  | { stamped: false; reason: string }
  | { ok: false; httpStatus: 404 | 409 | 500; error: string };

// Called server-to-server by admin/app/api/admin/orders/[id]/countersign
// right after it records countersignedAt/countersignedById — the signed
// agreement file only exists on web's disk (web/public/uploads), so admin
// can't stamp it directly. Uses the countersigning user's own on-file
// signature image when they have one, falling back to their typed name.
// A no-op (not an error) when the signed document is a photo upload rather
// than the drawn-signature PDF — there's no live PDF to stamp onto.
export async function stampCountersignedAgreement(orderId: string, agentId: string): Promise<StampCountersignResult> {
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
  if (!order.signedDocumentUrl || !order.countersignedAt) {
    return { ok: false, httpStatus: 409, error: 'This order has no countersigned agreement to stamp.' };
  }
  if (!isPdfUrl(order.signedDocumentUrl)) {
    return { stamped: false, reason: 'signed document is not a PDF' };
  }

  const filePath = resolveUploadUrl(order.signedDocumentUrl);
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
        ? await stampAgentSignatureImage(bytes, signatureBytes, order.countersignedAt)
        : await stampAgentSignatureText(bytes, agent.name, order.countersignedAt);
    } else {
      stamped = await stampAgentSignatureText(bytes, agent.name, order.countersignedAt);
    }
    await writeFile(filePath, Buffer.from(stamped));
  } catch (error) {
    console.error('[agreement:countersign-stamp]', error);
    return { ok: false, httpStatus: 500, error: 'Failed to stamp the agreement.' };
  }

  return { stamped: true };
}
