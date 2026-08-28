import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { customerRepository } from '@/repositories/customerRepository';

// Browse screen for the Customer/CustomerVehicle records introduced in
// SWMS Phase 6 — until now the data only surfaced through the job-card
// write-up "look up vehicle" flow, with no standalone way to browse or
// fix a record (e.g. a mistyped plate) outside an active visit.
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  const [customers, totalCustomers, totalVehicles, underWarranty] = await Promise.all([
    customerRepository.search(q),
    customerRepository.countCustomers(),
    customerRepository.countVehicles(),
    customerRepository.countVehiclesUnderWarranty(),
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
