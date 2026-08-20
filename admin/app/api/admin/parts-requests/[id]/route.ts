import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendStatusEmail } from '@/lib/status-email';

const VALID_STATUSES = ['new', 'contacted', 'in_progress', 'quoted', 'closed'];

// GET - Fetch a single part request with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const partRequest = await prisma.partRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!partRequest) {
      return NextResponse.json({ success: false, error: 'Part request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: partRequest });
  } catch (error) {
    console.error('Error fetching part request:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch part request' }, { status: 500 });
  }
}

// PATCH - Update request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const data: any = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      data.status = body.status;
    }

    if (body.notes !== undefined) data.notes = body.notes;

    const partRequest = await prisma.partRequest.update({
      where: { id },
      data,
      include: { items: true },
    });

    if (body.status && ['quoted', 'closed'].includes(body.status)) {
      try {
        await sendStatusEmail({
          to: partRequest.email,
          name: partRequest.name,
          entityType: 'Parts Request',
          status: body.status,
          reference: partRequest.id,
        });
      } catch (error) {
        console.error('[status-email] part request', error);
      }
    }

    return NextResponse.json({ success: true, request: partRequest });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Part request not found' }, { status: 404 });
    }
    console.error('Error updating part request:', error);
    return NextResponse.json({ success: false, error: 'Failed to update part request' }, { status: 500 });
  }
}

// DELETE - Remove a request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    await prisma.partRequest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Part request not found' }, { status: 404 });
    }
    console.error('Error deleting part request:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete part request' }, { status: 500 });
  }
}
