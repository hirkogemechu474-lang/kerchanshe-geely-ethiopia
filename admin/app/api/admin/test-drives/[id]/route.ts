import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { sendStatusEmail } from '@/lib/status-email';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissions?.canViewTestDrives) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { status } = await request.json();
  if (!['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  const testDrive = await prisma.testDrive.update({ where: { id }, data: { status } });
  if (['confirmed', 'cancelled', 'completed'].includes(status)) {
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
