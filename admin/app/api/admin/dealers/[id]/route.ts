import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { dealerRepository } from '@/repositories/dealerRepository';
import { updateDealer } from '@/lib/services/dealers/dealerService';

// GET - Get single dealer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const dealer = await dealerRepository.findById(id);
    if (!dealer) {
      return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dealer' }, { status: 500 });
  }
}

// PUT - Update dealer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const result = await updateDealer(id, body);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({ success: true, dealer: result.dealer });
  } catch (error) {
    console.error('Error updating dealer:', error);
    return NextResponse.json({ success: false, error: 'Failed to update dealer' }, { status: 500 });
  }
}

// DELETE - Delete dealer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    await dealerRepository.delete(id);
    return NextResponse.json({ success: true, message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Error deleting dealer:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete dealer' }, { status: 500 });
  }
}
