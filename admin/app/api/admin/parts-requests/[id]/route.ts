import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getPartRequest, updatePartRequest, deletePartRequest } from '@/lib/services/parts/partRequestService';

// GET - Fetch a single part request with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const partRequest = await getPartRequest(id);

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
  const { id } = await params;
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const result = await updatePartRequest(id, body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error('Error updating part request:', error);
    return NextResponse.json({ success: false, error: 'Failed to update part request' }, { status: 500 });
  }
}

// DELETE - Remove a request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    const result = await deletePartRequest(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting part request:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete part request' }, { status: 500 });
  }
}
