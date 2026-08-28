import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { customerRepository } from '@/repositories/customerRepository';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const customer = await customerRepository.findById(id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

// Field-level edits to the customer's own contact details. Vehicle-level
// edits (plate, warranty dates, etc.) go through /api/admin/customer-vehicles/[id].
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { fullName, phone, email, address } = body;

  if (fullName !== undefined && !fullName.trim()) {
    return NextResponse.json({ error: 'fullName cannot be empty' }, { status: 400 });
  }
  if (phone !== undefined && !phone.trim()) {
    return NextResponse.json({ error: 'phone cannot be empty' }, { status: 400 });
  }

  const customer = await customerRepository.update(id, {
    ...(fullName !== undefined && { fullName }),
    ...(phone !== undefined && { phone }),
    ...(email !== undefined && { email: email || null }),
    ...(address !== undefined && { address: address || null }),
  });

  return NextResponse.json({ customer });
}
