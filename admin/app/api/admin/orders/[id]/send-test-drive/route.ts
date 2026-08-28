import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendTestDriveInvite } from '@/lib/services/sales/orderOpsService';

/**
 * POST /api/admin/orders/[id]/send-test-drive
 *
 * Sales-agent-initiated test drive tied to a specific order — distinct from
 * the standalone public /test-drive booking flow. Lets an agent invite the
 * customer to take the vehicle for a spin at any point in the pipeline
 * (typically after the order is booked, before or after payment), without
 * asking them to re-enter their own details on the public form.
 *
 * Creates a real TestDrive row (salesOrderId set) with its own reference —
 * trackable the same way as any other request via GET
 * /api/public/status?ref=... — and emails the customer a link to
 * web/app/test-drive/confirm/[id], where they confirm they'll be there.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const preferredDate = typeof body?.preferredDate === 'string' ? body.preferredDate.trim() : '';
  const preferredTime = typeof body?.preferredTime === 'string' ? body.preferredTime.trim() : '';
  const location = typeof body?.location === 'string' ? body.location.trim() : '';

  if (!preferredDate || !preferredTime || !location) {
    return NextResponse.json({ error: 'preferredDate, preferredTime and location are required' }, { status: 400 });
  }
  const parsedDate = new Date(`${preferredDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid preferredDate' }, { status: 400 });
  }

  const result = await sendTestDriveInvite(id, { preferredDate, preferredTime, location });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ testDrive: result.testDrive, notificationSent: result.notificationSent }, { status: 201 });
}
