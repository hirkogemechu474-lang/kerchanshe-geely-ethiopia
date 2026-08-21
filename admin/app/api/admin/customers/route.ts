import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// Browse screen for the Customer/CustomerVehicle records introduced in
// SWMS Phase 6 — until now the data only surfaced through the job-card
// write-up "look up vehicle" flow, with no standalone way to browse or
// fix a record (e.g. a mistyped plate) outside an active visit.
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  const where = q
    ? {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
          { vehicles: { some: { vin: { contains: q, mode: 'insensitive' as const } } } },
          { vehicles: { some: { plateNo: { contains: q, mode: 'insensitive' as const } } } },
        ],
      }
    : undefined;

  const [customers, totalCustomers, totalVehicles, underWarranty] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        vehicles: {
          select: { id: true, plateNo: true, vin: true, model: true, warrantyEndDate: true },
        },
      },
    }),
    prisma.customer.count(),
    prisma.customerVehicle.count(),
    prisma.customerVehicle.count({ where: { warrantyEndDate: { gte: new Date() } } }),
  ]);

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,
      vehicles: c.vehicles,
    })),
    stats: { totalCustomers, totalVehicles, underWarranty },
  });
}
