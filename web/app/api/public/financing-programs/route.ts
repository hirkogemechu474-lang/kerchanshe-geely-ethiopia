import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/financing-programs
// Query params:
//  ?vehicleId=uuid   — only programs that apply to this vehicle (or all-vehicle programs)
//  ?bankId=uuid      — only from this bank
//  ?categoryId=uuid  — only programs in this vehicle category (or all-vehicle programs)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId') || undefined;
    const bankId = searchParams.get('bankId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const programs = await prisma.financingProgram.findMany({
      where: {
        status: 'PUBLISHED',
        ...(bankId ? { bankId } : {}),
        ...(vehicleId
          ? {
              OR: [
                { appliesToAllVehicles: true },
                { vehicleId },
                ...(categoryId ? [{ vehicleCategoryId: categoryId }] : []),
              ],
            }
          : categoryId
          ? { OR: [{ appliesToAllVehicles: true }, { vehicleCategoryId: categoryId }] }
          : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { interestRate: 'asc' }],
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
            phoneNumber: true,
            email: true,
            branchAddress: true,
          },
        },
        vehicle: { select: { id: true, name: true, slug: true, basePrice: true, finalPrice: true } },
        vehicleCategory: { select: { id: true, name: true, slug: true } },
      },
    });

    const sanitized = programs.map(p => ({
      ...p,
      // Never leak internal admin-only flags; keep CTA URLs (they're public-facing)
      __typename: 'FinancingProgram',
    }));

    return NextResponse.json(sanitized, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[public:financing-programs:get]', error);
    return NextResponse.json([], { status: 500 });
  }
}
