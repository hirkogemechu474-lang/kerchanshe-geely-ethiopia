import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - List part requests (supports search + status filter)
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = 25;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    // Status counts ignore the search/status filter itself so the stat
    // tiles always reflect the whole table, not just the current view.
    const [requests, total, statusCounts] = await Promise.all([
      prisma.partRequest.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.partRequest.count({ where }),
      prisma.partRequest.groupBy({ by: ['status'], _count: true }),
    ]);

    const countFor = (s: string) => statusCounts.find((c) => c.status === s)?._count ?? 0;

    return NextResponse.json({
      success: true,
      requests,
      total,
      page,
      pageSize,
      stats: {
        total: statusCounts.reduce((sum, c) => sum + c._count, 0),
        new: countFor('new'),
        quoted: countFor('quoted'),
        closed: countFor('closed'),
      },
    });
  } catch (error) {
    console.error('Error fetching part requests:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch part requests' }, { status: 500 });
  }
}