import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/financing-banks
// Returns all ACTIVE banks (partner directory)
export async function GET(_req: NextRequest) {
  try {
    const banks = await prisma.financingBank.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            financingPrograms: { where: { status: 'PUBLISHED' } },
          },
        },
      },
    });
    return NextResponse.json(banks, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=1800' },
    });
  } catch (error) {
    console.error('[public:financing-banks:get]', error);
    return NextResponse.json([], { status: 500 });
  }
}
