import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listClaims, createClaim } from '@/lib/services/workshop/warrantyClaimService';
import type { WarrantyClaimStatus } from '@prisma/client';

// UC-09: list warranty claims, optionally filtered by status.
export async function GET(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get('status') as WarrantyClaimStatus | null;

  const claims = await listClaims(status);

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
  const result = await createClaim(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ claim: result.claim }, { status: 201 });
}
