import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { confirmTestDrive } from '@/lib/services/testDrives/testDriveService';

// Public — the customer's side of a sales-agent-initiated test-drive
// invite (see admin/app/api/admin/orders/[id]/send-test-drive/route.ts).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.testDriveConfirm);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const result = await confirmTestDrive(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ status: result.status });
}
