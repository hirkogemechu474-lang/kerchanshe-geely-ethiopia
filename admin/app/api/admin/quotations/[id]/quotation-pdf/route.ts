import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { generateReference } from '@/lib/reference';
import { buildSalesQuotationPdf, computeQuotationTotals } from '@/lib/sales/salesQuotationPdf';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

/**
 * GET /api/admin/quotations/[id]/quotation-pdf — the quotation PDF. 409 until generated.
 * POST /api/admin/quotations/[id]/quotation-pdf — saves pricing/vehicle
 * details, generates the quotation number on first use (kept stable across
 * later re-sends), and emails the PDF to the customer. Unlike the sales
 * invoice, this is NOT a one-way lock — a quotation can be revised and
 * resent before the deal is finalized.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({ where: { id } });
  if (!quotation) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }
  if (!quotation.quotationNo) {
    return NextResponse.json({ error: 'This quotation has not been generated yet.' }, { status: 409 });
  }

  const pdfBytes = await buildSalesQuotationPdf(quotation);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${quotation.quotationNo}.pdf"`,
    },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }

  const unitPrice = Number(body.unitPrice);
  const quantity = Math.max(1, Number(body.quantity) || 1);
  const discountAmount = Number(body.discountAmount) || 0;
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return NextResponse.json({ error: 'Unit price must be a valid positive number' }, { status: 400 });
  }
  if (!Number.isFinite(discountAmount) || discountAmount < 0) {
    return NextResponse.json({ error: 'Discount must be a valid non-negative number' }, { status: 400 });
  }

  const { vatAmount } = computeQuotationTotals(unitPrice, quantity, discountAmount);
  const quotationNo = existing.quotationNo || (await generateReference());

  let updated;
  try {
    updated = await prisma.quotation.update({
      where: { id },
      data: {
        quotationNo,
        unitPrice,
        quantity,
        discountAmount,
        vatAmount,
        vehicleYear: body.vehicleYear ?? existing.vehicleYear,
        vehicleColor: body.vehicleColor ?? existing.vehicleColor,
        quotationValidUntil: body.quotationValidUntil ? new Date(body.quotationValidUntil) : existing.quotationValidUntil,
        paymentTerms: body.paymentTerms ?? existing.paymentTerms,
        deliveryTerms: body.deliveryTerms ?? existing.deliveryTerms,
        quotationGeneratedAt: new Date(),
      },
    });
  } catch (dbError) {
    console.error('[quotations:quotation-pdf:generate]', dbError);
    return NextResponse.json({ error: 'Failed to generate quotation. Please try again.' }, { status: 500 });
  }

  let notificationSent = false;
  if (updated.email) {
    try {
      const pdfBytes = await buildSalesQuotationPdf(updated);
      const siteUrl = env.app.url.replace(/\/$/, '');
      const alreadySigned = Boolean(updated.signedDocumentUrl);
      const signingUrl = !alreadySigned && updated.reference ? `${siteUrl}/quotation/${encodeURIComponent(updated.reference)}` : undefined;
      notificationSent = await sendStatusEmail({
        to: updated.email,
        name: updated.customerName,
        entityType: 'sales quotation',
        status: 'sent',
        reference: updated.reference || updated.quotationNo || updated.id,
        details: alreadySigned
          ? `Your revised sales quotation ${updated.quotationNo} is attached.`
          : `Your sales quotation ${updated.quotationNo} is attached. Please review, sign, and return it to proceed.`,
        actionUrl: signingUrl,
        actionLabel: 'Review & Sign Quotation',
        attachments: [{ filename: `${updated.quotationNo}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }],
      });
    } catch (emailError) {
      console.error('[quotations:quotation-pdf:email]', emailError);
    }
  }

  return NextResponse.json({ quotation: updated, notificationSent });
}
