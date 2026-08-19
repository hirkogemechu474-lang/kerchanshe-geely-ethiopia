import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || Math.random().toString(36).slice(2, 10);
}

function toDecimal(v: unknown, d: number): string {
  if (v === undefined || v === null || v === '') return d.toString();
  return Number(v).toFixed(d.constructor === Number ? d : 2);
}

// GET programs (admin sees all statuses) — ?bankId=X&vehicleId=Y&status=Z
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get('bankId') || undefined;
    const vehicleId = searchParams.get('vehicleId') || undefined;
    const status = (searchParams.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null) || undefined;

    const programs = await prisma.financingProgram.findMany({
      where: {
        ...(bankId ? { bankId } : {}),
        ...(vehicleId ? { OR: [{ vehicleId }, { appliesToAllVehicles: true }] } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { interestRate: 'asc' }],
      include: {
        bank: { select: { id: true, name: true, slug: true, logoUrl: true, websiteUrl: true, phoneNumber: true } },
        vehicle: { select: { id: true, name: true, slug: true } },
        vehicleCategory: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json(programs);
  } catch (error) {
    console.error('[financing-programs:get]', error);
    return NextResponse.json(
      { error: 'Failed to load financing programs', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create program
export async function POST(request: NextRequest) {
  try {
    const b = await request.json();

    if (!b.bankId) return NextResponse.json({ error: 'Bank is required' }, { status: 400 });
    if (!b.name || String(b.name).trim().length < 2) {
      return NextResponse.json({ error: 'Program name is required (min 2 chars)' }, { status: 400 });
    }
    if (!(Number(b.tenureMonths) > 0)) {
      return NextResponse.json({ error: 'Tenure (months) must be greater than 0' }, { status: 400 });
    }

    const status = b.status === 'PUBLISHED' || b.status === 'ARCHIVED' ? b.status : 'DRAFT';

    const data = {
      name: String(b.name).trim(),
      slug: b.slug?.trim() || slugify(String(b.name).trim()),
      bankId: String(b.bankId),
      interestRate: toDecimal(b.interestRate, 3),
      downPaymentPercent: toDecimal(b.downPaymentPercent, 2),
      minDownPaymentPercent: toDecimal(b.minDownPaymentPercent ?? 10, 2),
      maxDownPaymentPercent: toDecimal(b.maxDownPaymentPercent ?? 70, 2),
      tenureMonths: Number(b.tenureMonths),
      minTenureMonths: Number(b.minTenureMonths ?? 12),
      maxTenureMonths: Number(b.maxTenureMonths ?? 84),
      processingFeePercent: toDecimal(b.processingFeePercent ?? 2.5, 2),
      processingFeeMin: b.processingFeeMin ? toDecimal(b.processingFeeMin, 2) : null,
      processingFeeMax: b.processingFeeMax ? toDecimal(b.processingFeeMax, 2) : null,
      insurancePercent: toDecimal(b.insurancePercent ?? 5, 2),
      vehicleId: b.vehicleId || null,
      vehicleCategoryId: b.vehicleCategoryId || null,
      appliesToAllVehicles: b.appliesToAllVehicles !== undefined ? !!b.appliesToAllVehicles : true,
      applyEnabled: b.applyEnabled !== undefined ? !!b.applyEnabled : true,
      applyUrl: b.applyUrl || null,
      applyLabel: b.applyLabel || null,
      directPayEnabled: !!b.directPayEnabled,
      directPayUrl: b.directPayUrl || null,
      directPayLabel: b.directPayLabel || null,
      visitShowroomEnabled: b.visitShowroomEnabled !== undefined ? !!b.visitShowroomEnabled : true,
      visitShowroomUrl: b.visitShowroomUrl || null,
      visitShowroomLabel: b.visitShowroomLabel || null,
      scheduleEnabled: b.scheduleEnabled !== undefined ? !!b.scheduleEnabled : true,
      scheduleUrl: b.scheduleUrl || null,
      badgeText: b.badgeText || null,
      highlightBadge: !!b.highlightBadge,
      finePrint: b.finePrint || null,
      eligibilityNote: b.eligibilityNote || null,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      displayOrder: Number(b.displayOrder) || 0,
    };

    const existing = await prisma.financingProgram.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json(
        { error: `Program slug "${data.slug}" already exists` },
        { status: 409 }
      );
    }

    const program = await prisma.financingProgram.create({
      data,
      include: {
        bank: { select: { id: true, name: true, slug: true } },
        vehicle: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json({ success: true, data: program });
  } catch (error) {
    console.error('[financing-programs:post]', error);
    return NextResponse.json(
      { error: 'Failed to create financing program', details: (error as Error).message },
      { status: 500 }
    );
  }
}
