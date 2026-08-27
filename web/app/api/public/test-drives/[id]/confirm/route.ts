import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Public — the customer's side of a sales-agent-initiated test-drive
// invite (see admin/app/api/admin/orders/[id]/send-test-drive/route.ts).
// One-way: only a 'pending' test drive can be confirmed, matching the
// agreement/handover sign routes' "already done" 409 guard.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.testDriveConfirm);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const testDrive = await prisma.testDrive.findUnique({ where: { id } });
  if (!testDrive) {
    return NextResponse.json({ error: 'Test drive not found' }, { status: 404 });
  }
  if (testDrive.status !== 'pending') {
    return NextResponse.json({ error: `This test drive is already ${testDrive.status}.` }, { status: 409 });
  }

  const updated = await prisma.testDrive.update({
    where: { id },
    data: { status: 'confirmed' },
  });

  return NextResponse.json({ status: updated.status });
}
