import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendStatusEmail } from '@/lib/status-email';
import { requireAdminApiSession } from '@/lib/auth/api';
import { env } from '@/lib/env';
import { notifyAssignedRep } from '@/lib/services/quotations/leadNotifications';

type Params = Promise<{ id: string }>;

// GET - Fetch single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  } 
}

// PUT - Update quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    if (!session!.user.permissions.canManageQuotations) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, internalNotes, assignedTo, assignedToId } = body;

    const before = assignedTo !== undefined
      ? await prisma.quotation.findUnique({ where: { id }, select: { assignedTo: true } })
      : null;

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    });

    if (assignedTo !== undefined && quotation.assignedTo !== before?.assignedTo) {
      let repId: string | null = assignedToId || null;
      if (!repId && quotation.assignedTo) {
        // Defensive fallback for a caller that doesn't supply assignedToId —
        // name isn't unique, so this is best-effort, not the primary path.
        const rep = await prisma.user.findFirst({
          where: {
            name: quotation.assignedTo,
            role: { in: ['sales', 'sales_representative', 'sales_manager'] },
            isActive: true,
          },
          select: { id: true },
        });
        repId = rep?.id ?? null;
      }
      await notifyAssignedRep(quotation, repId);
    }

    if (status && ['approved', 'converted', 'closed'].includes(status) && quotation.email) {
      try {
        const vehicle = quotation.vehicleModel
          ? await prisma.vehicle.findFirst({ where: { name: quotation.vehicleModel }, select: { id: true } })
          : null;
        const publicWebUrl = env.app.url.replace(/\/$/, '');
        const paymentUrl = status === 'approved' || status === 'converted'
          ? `${publicWebUrl}/financing/apply?quote=${encodeURIComponent(quotation.id)}${vehicle ? `&vehicle=${encodeURIComponent(vehicle.id)}` : ''}`
          : undefined;
        await sendStatusEmail({
          to: quotation.email,
          name: quotation.customerName,
          entityType: 'Quote Request',
          status,
          reference: quotation.reference || quotation.id,
          details: `Vehicle: ${quotation.vehicleModel || 'General enquiry'}`,
          actionUrl: paymentUrl,
          actionLabel: 'Proceed with direct vehicle payment',
        });
      } catch (error) {
        console.error('[status-email] quotation', error);
      }
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  } 
}

// DELETE - Delete quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  } 
}
