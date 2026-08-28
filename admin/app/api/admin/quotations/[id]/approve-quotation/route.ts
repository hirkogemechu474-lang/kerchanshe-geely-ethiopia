import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { approveQuotation } from '@/lib/services/quotations/quotationPdfService';

// Manager sign-off gate on a generated quotation — gated on
// canCountersignAgreements (the same permission that gates the Sales
// Order's manager countersign step), so "manager approval" means one
// consistent thing across the pipeline rather than a per-page mechanism.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canCountersignAgreements) {
    return NextResponse.json({ error: 'You do not have permission to approve quotations.' }, { status: 403 });
  }

  const { id } = await params;
  const result = await approveQuotation(id, session!.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ quotation: result.quotation });
}
