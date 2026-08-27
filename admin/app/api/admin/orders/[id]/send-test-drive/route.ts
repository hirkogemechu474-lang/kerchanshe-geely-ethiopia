import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendStatusEmail } from '@/lib/status-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { env } from '@/lib/env';

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

  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.customerEmail) {
    return NextResponse.json({ error: 'This order has no customer email on file — add one before sending a test-drive invite.' }, { status: 409 });
  }

  // Best-effort match, same convention as web/app/api/agreement/[orderId]/route.ts
  // — SalesOrder.vehicleModel is a plain string, not an FK.
  const vehicle = await prisma.vehicle.findFirst({
    where: { name: order.vehicleModel, isActive: true, status: 'published' },
    select: { id: true },
  });
  if (!vehicle) {
    return NextResponse.json(
      { error: `Could not find "${order.vehicleModel}" in the published vehicle catalog to link the test drive to.` },
      { status: 409 }
    );
  }

  const reference = await generateReference(REFERENCE_CATEGORY.TEST_DRIVE);
  const testDrive = await prisma.testDrive.create({
    data: {
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      vehicleId: vehicle.id,
      preferredDate: parsedDate,
      preferredTime,
      location,
      salesOrderId: order.id,
      salesRepId: order.salesAgentId,
      status: 'pending',
      reference,
    },
  });

  let notificationSent = false;
  try {
    const siteUrl = env.app.url.replace(/\/$/, '');
    notificationSent = await sendStatusEmail({
      to: order.customerEmail,
      name: order.customerName,
      entityType: 'test drive',
      status: 'requested',
      reference,
      details: `Your sales consultant has arranged a test drive for your ${order.vehicleModel} on ${preferredDate} at ${preferredTime}, at ${location}. Please bring a valid driver's license.`,
      actionUrl: `${siteUrl}/test-drive/confirm/${testDrive.id}`,
      actionLabel: 'Confirm Test Drive',
    });
  } catch (emailError) {
    console.error('[orders:send-test-drive:email]', emailError);
  }

  return NextResponse.json({ testDrive, notificationSent }, { status: 201 });
}
