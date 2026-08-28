import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { testDriveRepository } from '@/repositories/testDriveRepository';
import { updateTestDrive } from '@/lib/services/testDrives/testDriveService';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const testDrive = await testDriveRepository.findByIdWithVehicle(id);

  if (!testDrive) {
    return NextResponse.json({ error: 'Test drive not found' }, { status: 404 });
  }

  return NextResponse.json({ testDrive });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;
  if (!session!.user.permissions.canViewTestDrives) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, idDocumentType, idDocumentNumber, idPhotoUrl } = body as {
    status?: string;
    idDocumentType?: string;
    idDocumentNumber?: string;
    idPhotoUrl?: string;
  };

  const result = await updateTestDrive(id, { status, idDocumentType, idDocumentNumber, idPhotoUrl }, session!.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ testDrive: result.testDrive });
}
