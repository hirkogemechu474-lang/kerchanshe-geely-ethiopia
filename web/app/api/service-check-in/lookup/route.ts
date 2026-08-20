import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Live VIN-scan lookup for the check-in kiosk: a barcode scanner (hardware,
// keyboard-wedge style, or the in-browser camera scanner) fills the VIN
// field and this endpoint answers "do we know this vehicle?" so the kiosk
// can greet a returning customer by name instead of asking them to retype
// everything. Read-only — the actual check-in write still goes through
// POST /api/service-check-in.
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.serviceCheckInLookup);
  if (rateLimitResult) return rateLimitResult;

  const { searchParams } = new URL(request.url);
  const vin = searchParams.get('vin')?.trim();

  if (!vin) {
    return NextResponse.json({ error: 'vin is required' }, { status: 400 });
  }

  const matched = await prisma.customerVehicle.findFirst({
    where: { vin: { equals: vin, mode: 'insensitive' } },
    include: { customer: { select: { fullName: true, phone: true, email: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  if (!matched) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    plateNo: matched.plateNo,
    model: matched.model,
    customerName: matched.customer.fullName,
    customerPhone: matched.customer.phone,
    customerEmail: matched.customer.email,
  });
}
