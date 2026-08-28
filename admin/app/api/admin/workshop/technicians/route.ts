import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listTechnicians, createTechnician } from '@/lib/services/workshop/technicianService';

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const technicians = await listTechnicians();

  return NextResponse.json({ technicians });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageTechnicians) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await createTechnician(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({ technician: result.technician }, { status: 201 });
  } catch (error) {
    console.error('Error creating technician:', error);
    return NextResponse.json({ error: 'Failed to create technician' }, { status: 500 });
  }
}
