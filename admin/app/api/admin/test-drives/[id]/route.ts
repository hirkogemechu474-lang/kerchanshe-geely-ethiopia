import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendStatusEmail } from '@/lib/status-email';
import { requireAdminApiSession } from '@/lib/auth/api';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const testDrive = await prisma.testDrive.findUnique({
    where: { id },
    include: { vehicle: { select: { name: true, slug: true } } },
  });

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

  if (status !== undefined && !['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existing = await prisma.testDrive.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Test drive not found' }, { status: 404 });
  }

  // FR-104 accountability gate: a test drive cannot be marked completed
  // until the customer's ID has been captured — checking against the
  // photo that will exist AFTER this request's own ID fields are applied,
  // so capturing the ID and completing the drive can happen in one PATCH.
  const idPhotoAfterUpdate = idPhotoUrl !== undefined ? idPhotoUrl : existing.idPhotoUrl;
  if (status === 'completed' && !idPhotoAfterUpdate) {
    return NextResponse.json(
      { error: "Capture the customer's ID before marking this test drive complete." },
      { status: 409 }
    );
  }

  const isFirstIdCapture = idPhotoUrl !== undefined && idPhotoUrl && !existing.idPhotoUrl;

  const testDrive = await prisma.testDrive.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(idDocumentType !== undefined && { idDocumentType: idDocumentType || null }),
      ...(idDocumentNumber !== undefined && { idDocumentNumber: idDocumentNumber || null }),
      ...(idPhotoUrl !== undefined && { idPhotoUrl: idPhotoUrl || null }),
      ...(isFirstIdCapture && { idVerifiedAt: new Date(), idVerifiedById: session!.user.id }),
    },
  });

  if (status && ['confirmed', 'cancelled', 'completed'].includes(status)) {
    try {
      await sendStatusEmail({
        to: testDrive.customerEmail,
        name: testDrive.customerName,
        entityType: 'Test Drive Request',
        status,
        reference: testDrive.id,
        details: `Vehicle: ${testDrive.vehicleId}\nPreferred time: ${testDrive.preferredTime}\nLocation: ${testDrive.location}`,
      });
    } catch (error) {
      console.error('[status-email] test-drive', error);
    }
  }

  return NextResponse.json({ testDrive });
}
