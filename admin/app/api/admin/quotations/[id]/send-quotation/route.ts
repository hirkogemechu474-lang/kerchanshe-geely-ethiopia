import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendQuotationToCustomer } from '@/lib/services/quotations/quotationPdfService';

// Emails the manager-approved quotation to the customer. 409s until
// .../approve-quotation has run. See sendQuotationToCustomer for the
// staff-notification and commission-attribution side effects.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const result = await sendQuotationToCustomer(id, session!.user.name);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ quotation: result.quotation, notificationSent: result.notificationSent });
}
