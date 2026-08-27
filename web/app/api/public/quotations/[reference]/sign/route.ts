import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { signQuotation } from '@/lib/services/quotations/quotationService';

// Public — customer e-signs (or attaches a photo of a signed printout of)
// the Sales Quotation PDF, mirroring web/app/api/agreement/[orderId]/sign/route.ts's
// two-mode convention. One-way: an already-signed quotation 409s rather
// than overwriting. On success, status automatically moves to "accepted" —
// distinct from the older, manually-set "approved" — so staff can see at a
// glance that the customer digitally accepted this quotation.
export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.quotationSign);
  if (rateLimitResult) return rateLimitResult;

  const { reference } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type === 'drawn' || body?.type === 'photo' ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: 'Invalid signing type' }, { status: 400 });
  }

  const result = await signQuotation(reference, type, {
    signatureDataUrl: body?.signatureDataUrl,
    photoUrl: body?.photoUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ signedDocumentUrl: result.signedDocumentUrl, signedAt: result.signedAt, status: result.status });
}
