import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { nextOrderNo } from '@/lib/services/sales/orderNumber';
import { PDI_CHECKLIST_TEMPLATE } from '@/lib/services/sales/pdiChecklistTemplate';

// UC-12 Book Order & PDI (BRD §6.1): converts an accepted quotation into a
// bookable sales order and seeds its default PDI checklist. A quotation can
// be converted at most once — SalesOrder.quotationId is unique.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({ where: { id }, include: { salesOrder: true } });
  if (!quotation) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }

  if (quotation.salesOrder) {
    return NextResponse.json(
      { error: 'This quotation already has an order', orderId: quotation.salesOrder.id },
      { status: 409 }
    );
  }

  const orderNo = await nextOrderNo();

  const order = await prisma.salesOrder.create({
    data: {
      orderNo,
      quotationId: quotation.id,
      customerName: quotation.customerName,
      customerPhone: quotation.phoneNumber,
      customerEmail: quotation.email || null,
      vehicleModel: quotation.vehicleModel || 'General enquiry',
      configurationJson: quotation.configurationJson ?? undefined,
      financingStatus: quotation.financingInterest ? 'PENDING' : 'NOT_APPLICABLE',
      // Inherit the rep already working this lead (see web/lib/assignSalesRep.ts)
      // instead of starting the order unassigned.
      salesAgentId: quotation.assignedTo ?? null,
      commissionStatus: quotation.assignedTo ? 'PENDING' : 'NOT_APPLICABLE',
      status: 'BOOKED',
      statusHistory: {
        create: { fromStatus: null, toStatus: 'BOOKED', changedById: session!.user.id },
      },
      pdiItems: {
        create: PDI_CHECKLIST_TEMPLATE.map((label) => ({ label })),
      },
    },
  });

  if (quotation.status !== 'converted') {
    await prisma.quotation.update({ where: { id: quotation.id }, data: { status: 'converted' } });
  }

  return NextResponse.json({ order }, { status: 201 });
}
