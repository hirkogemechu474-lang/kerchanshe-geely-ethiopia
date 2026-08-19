import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// Data source for the Bay Scheduling Board (BRD Screen 6): every active bay,
// plus the job cards scheduled against it for the given day.
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  const [bays, jobCards] = await Promise.all([
    prisma.serviceBay.findMany({
      where: { isActive: true },
      orderBy: [{ bayType: 'asc' }, { name: 'asc' }],
    }),
    prisma.jobCard.findMany({
      where: {
        status: { notIn: ['CANCELLED'] },
        OR: [
          { scheduledStart: { gte: dayStart, lte: dayEnd } },
          { AND: [{ scheduledStart: null }, { openTs: { gte: dayStart, lte: dayEnd } }] },
        ],
      },
      include: {
        technician: { select: { id: true, name: true } },
        bay: { select: { id: true, name: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    }),
  ]);

  return NextResponse.json({ date, bays, jobCards });
}
