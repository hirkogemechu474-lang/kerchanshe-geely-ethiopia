import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    const p = await prisma.financingProgram.findUnique({
      where: { id },
      include: {
        bank: { select: { id: true, name: true, slug: true, logoUrl: true } },
        vehicle: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!p) return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load program', details: (error as Error).message },
      { status: 500 }
    );
  }
}

const DECIMAL_FIELDS = [
  'interestRate',
  'downPaymentPercent',
  'minDownPaymentPercent',
  'maxDownPaymentPercent',
  'processingFeePercent',
  'processingFeeMin',
  'processingFeeMax',
  'insurancePercent',
] as const;

function toDec(v: unknown, digits: number) {
  if (v === undefined || v === null || v === '') return undefined;
  return Number(v).toFixed(digits);
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    const b = await request.json();
    const data: Record<string, unknown> = {};

    const stringFields = [
      'name', 'slug', 'bankId', 'vehicleId', 'vehicleCategoryId',
      'applyUrl', 'applyLabel', 'directPayUrl', 'directPayLabel',
      'visitShowroomUrl', 'visitShowroomLabel', 'scheduleUrl',
      'badgeText', 'finePrint', 'eligibilityNote',
    ];
    stringFields.forEach(f => {
      if (b[f] !== undefined) data[f] = b[f] === '' ? null : String(b[f]);
    });

    const intFields = ['tenureMonths', 'minTenureMonths', 'maxTenureMonths', 'displayOrder'];
    intFields.forEach(f => {
      if (b[f] !== undefined && b[f] !== null && b[f] !== '') {
        data[f] = Number(b[f]);
      }
    });

    const boolFields = [
      'appliesToAllVehicles',
      'applyEnabled',
      'directPayEnabled',
      'visitShowroomEnabled',
      'scheduleEnabled',
      'highlightBadge',
    ];
    boolFields.forEach(f => {
      if (b[f] !== undefined) data[f] = !!b[f];
    });

    if (b.status !== undefined) {
      const allowed = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
      if (allowed.includes(b.status)) {
        data.status = b.status;
        data.publishedAt = b.status === 'PUBLISHED' ? new Date() : null;
      }
    }

    DECIMAL_FIELDS.forEach(f => {
      if (b[f] !== undefined) {
        if (f === 'interestRate') data[f] = Number(b[f]).toFixed(3);
        else if (f.endsWith('Min') || f.endsWith('Max')) {
          if (b[f] === null || b[f] === '') data[f] = null;
          else data[f] = Number(b[f]).toFixed(2);
        } else data[f] = Number(b[f]).toFixed(2);
      }
    });

    const updated = await prisma.financingProgram.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[financing-program:update]', error);
    return NextResponse.json(
      { error: 'Failed to update program', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Params }) {
  return PUT(req, ctx);
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    await prisma.financingProgram.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete program', details: (error as Error).message },
      { status: 500 }
    );
  }
}
