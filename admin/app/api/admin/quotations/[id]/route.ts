import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendStatusEmail } from '@/lib/status-email';
import { requireAdminApiSession } from '@/lib/auth/api';

interface Params {
  id: string;
}

// GET - Fetch single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
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

    const body = await request.json();
    const { status, internalNotes, assignedTo } = body;

    const quotation = await prisma.quotation.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    });

    if (status && ['approved', 'converted', 'closed'].includes(status) && quotation.email) {
      try {
        const vehicle = quotation.vehicleModel
          ? await prisma.vehicle.findFirst({ where: { name: quotation.vehicleModel }, select: { id: true } })
          : null;
        const publicWebUrl = process.env.NEXT_PUBLIC_WEB_URL || process.env.WEB_URL || 'http://localhost:3002';
        const paymentUrl = status === 'approved' || status === 'converted'
          ? `${publicWebUrl.replace(/\/$/, '')}/financing/apply?quote=${encodeURIComponent(quotation.id)}${vehicle ? `&vehicle=${encodeURIComponent(vehicle.id)}` : ''}`
          : undefined;
        await sendStatusEmail({
          to: quotation.email,
          name: quotation.customerName,
          entityType: 'Quote Request',
          status,
          reference: quotation.id,
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

    await prisma.quotation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  } 
}
