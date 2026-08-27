import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { checkIn } from '@/lib/services/serviceCheckIn/serviceCheckInService';

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.serviceCheckIn);
  if (rateLimitResult) return rateLimitResult;

  const body = await request.json().catch(() => null);
  const plateNo = typeof body?.plateNo === 'string' ? body.plateNo.trim() : '';
  const vin = typeof body?.vin === 'string' ? body.vin.trim() : '';
  const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : '';
  const customerPhone = typeof body?.customerPhone === 'string' ? body.customerPhone.trim() : '';
  const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail.trim() : '';

  if (!plateNo || !customerName || !customerPhone) {
    return NextResponse.json({ error: 'Plate number, name, and phone are required' }, { status: 400 });
  }

  const result = await checkIn({ plateNo, vin, customerName, customerPhone, customerEmail });

  return NextResponse.json(result, { status: 201 });
}
