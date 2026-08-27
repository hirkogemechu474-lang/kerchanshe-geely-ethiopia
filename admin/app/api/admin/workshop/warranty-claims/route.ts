import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { nextClaimNo } from '@/lib/services/workshop/jobCardNumber';
import type { WarrantyClaimStatus } from '@prisma/client';

// UC-09: list warranty claims, optionally filtered by status.
export async function GET(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get('status') as WarrantyClaimStatus | null;

  const claims = await prisma.warrantyClaim.findMany({
    where: status ? { status } : undefined,
    include: { jobCard: { select: { jobCardNo: true, plateNo: true, customerName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ claims });
}

// UC-09: draft a new warranty claim from a job card (FR-501/502).
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { jobCardId, defectCode, component, diagnosticCodes, description, photoUrls } = body as {
    jobCardId: string;
    defectCode?: string;
    component?: string;
    diagnosticCodes?: string;
    description?: string;
    photoUrls?: string[];
  };

  if (!jobCardId) {
    return NextResponse.json({ error: 'jobCardId is required' }, { status: 400 });
  }

  const jobCard = await prisma.jobCard.findUnique({ where: { id: jobCardId } });
  if (!jobCard) {
    return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
  }

  try {
    const claimNo = await nextClaimNo();
    const claim = await prisma.warrantyClaim.create({
      data: {
        claimNo,
        jobCardId,
        defectCode: defectCode || '',
        component: component || null,
        diagnosticCodes: diagnosticCodes || null,
        description: description || null,
        photoUrls: photoUrls && photoUrls.length ? photoUrls : [],
      },
    });
    return NextResponse.json({ claim }, { status: 201 });
  } catch (error) {
    console.error('Error creating warranty claim:', error);
    return NextResponse.json({ error: 'Failed to create warranty claim' }, { status: 500 });
  }
}
