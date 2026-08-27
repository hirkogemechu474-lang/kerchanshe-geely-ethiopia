import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Public test-drive summary for the self-service confirm page — same
// id-as-access-token pattern as /api/agreement/[orderId] and
// /api/handover/[orderId] (the row's own random UUID, only ever shared via
// the invite email, is the token).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementView);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const testDrive = await prisma.testDrive.findUnique({
    where: { id },
    include: { vehicle: { select: { name: true } } },
  });
  if (!testDrive) {
    return NextResponse.json({ error: 'Test drive not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: testDrive.id,
    reference: testDrive.reference,
    customerName: testDrive.customerName,
    vehicleName: testDrive.vehicle.name,
    preferredDate: testDrive.preferredDate,
    preferredTime: testDrive.preferredTime,
    location: testDrive.location,
    status: testDrive.status,
  });
}
