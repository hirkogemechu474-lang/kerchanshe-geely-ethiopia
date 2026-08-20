import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

// GET - Fetch all part categories
export async function GET() {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const categories = await prisma.partCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { parts: true } } },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST – Create a part category
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const { name, description, imageUrl, displayOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = (body.slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await prisma.partCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }

    const category = await prisma.partCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        displayOrder: parseInt(displayOrder) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}