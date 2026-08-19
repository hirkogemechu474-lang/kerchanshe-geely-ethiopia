import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const jobCard = await prisma.jobCard.findUnique({
    where: { id },
    include: {
      technician: true,
      bay: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
      jobCardParts: { include: { sparePart: true }, orderBy: { requestedAt: 'asc' } },
      warrantyClaims: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!jobCard) {
    return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
  }

  return NextResponse.json({ jobCard });
}

// Field-level edits only (complaint/diagnosis/estimate/approval/warranty flag).
// Status transitions go through /status; technician+bay assignment through /assign.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      complaintText,
      diagnosisNotes,
      estimateAmount,
      isWarrantyOrGoodwill,
      approve,
      invoiceAmount,
      warrantyStartDate,
      warrantyEndDate,
    } = body;

    const jobCard = await prisma.jobCard.update({
      where: { id },
      data: {
        ...(complaintText !== undefined && { complaintText }),
        ...(diagnosisNotes !== undefined && { diagnosisNotes }),
        ...(estimateAmount !== undefined && { estimateAmount: estimateAmount === null ? null : Number(estimateAmount) }),
        ...(isWarrantyOrGoodwill !== undefined && { isWarrantyOrGoodwill }),
        ...(approve === true && { customerApprovedAt: new Date() }),
        ...(invoiceAmount !== undefined && { invoiceAmount: invoiceAmount === null ? null : Number(invoiceAmount) }),
        ...(warrantyStartDate !== undefined && { warrantyStartDate: warrantyStartDate ? new Date(warrantyStartDate) : null }),
        ...(warrantyEndDate !== undefined && { warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null }),
      },
    });

    return NextResponse.json({ jobCard });
  } catch (error) {
    console.error('Error updating job card:', error);
    return NextResponse.json({ error: 'Failed to update job card' }, { status: 500 });
  }
}
