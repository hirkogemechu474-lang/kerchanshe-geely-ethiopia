import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || Math.random().toString(36).slice(2, 10);
}

// GET /api/financing/banks
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const banks = await prisma.financingBank.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { financingPrograms: true } },
      },
    });
    return NextResponse.json(banks);
  } catch (error) {
    console.error('[financing-banks:get]', error);
    return NextResponse.json(
      { error: 'Failed to load financing banks', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/financing/banks — Create new bank
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    const {
      name,
      slug,
      logoUrl,
      websiteUrl,
      phoneNumber,
      email,
      branchAddress,
      shortDescription,
      isActive = true,
      displayOrder = 0,
    } = body ?? {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Bank name is required (min 2 chars)' }, { status: 400 });
    }

    const data = {
      name: name.trim(),
      slug: slug?.trim() || slugify(name.trim()),
      logoUrl: logoUrl || null,
      websiteUrl: websiteUrl || null,
      phoneNumber: phoneNumber || null,
      email: email || null,
      branchAddress: branchAddress || null,
      shortDescription: shortDescription || null,
      isActive: !!isActive,
      displayOrder: Number(displayOrder) || 0,
    };

    const existing = await prisma.financingBank.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json(
        { error: `A bank with slug "${data.slug}" already exists — choose a different name or slug.` },
        { status: 409 }
      );
    }

    const bank = await prisma.financingBank.create({ data });
    return NextResponse.json({ success: true, data: bank });
  } catch (error) {
    console.error('[financing-banks:post]', error);
    return NextResponse.json(
      { error: 'Failed to create financing bank', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH /api/financing/banks/[id]
// PUT /api/financing/banks/[id]
// DELETE /api/financing/banks/[id]
