import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { convertBookingToJobCard } from '@/lib/services/serviceBookings/convertToJobCardService';

// Converts an existing web-submitted ServiceBooking lead into a workshop
// JobCard, preserving the original booking record and linking the two.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const result = await convertBookingToJobCard(id, session!.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ jobCard: result.jobCard }, { status: 201 });
}
