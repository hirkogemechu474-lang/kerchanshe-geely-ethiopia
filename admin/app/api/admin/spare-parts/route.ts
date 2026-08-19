import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - Fetch all spare parts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spareParts = await prisma.sparePart.findMany({
      orderBy: { createdAt: 'desc' },
      include: { partCategory: true },
    });

    return NextResponse.json({ spareParts });
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    return NextResponse.json({ error: 'Failed to fetch spare parts' }, { status: 500 });
  }
}

// POST - Create new spare part
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, sku, category, partCategoryId, description, imageUrl, brand, stock, reorderPoint, price, supplier, isFeatured, displayOrder, isActive } = body;

    // Validation
    if (!name || !sku || !category || stock === undefined || !price || !supplier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if SKU already exists
    const existingSku = await prisma.sparePart.findUnique({
      where: { sku },
    });

    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    // Create spare part
    const sparePart = await prisma.sparePart.create({
      data: {
        name,
        sku,
        category,
        partCategoryId: partCategoryId || null,
        description: description || null,
        imageUrl: imageUrl || null,
        brand: brand || null,
        stock: parseInt(stock) || 0,
        reorderPoint: parseInt(reorderPoint) || 10,
        price: parseFloat(price),
        supplier,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        displayOrder: parseInt(displayOrder) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: { partCategory: true },
    });

    return NextResponse.json({ sparePart }, { status: 201 });
  } catch (error) {
    console.error('Error creating spare part:', error);
    return NextResponse.json({ error: 'Failed to create spare part' }, { status: 500 });
  }
}

// PUT - Update spare part
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, sku, category, partCategoryId, description, imageUrl, brand, stock, reorderPoint, price, supplier, isFeatured, displayOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Spare part ID required' }, { status: 400 });
    }

    // If SKU is being updated, check it's not already taken
    if (sku) {
      const existingSku = await prisma.sparePart.findFirst({
        where: {
          sku,
          NOT: { id },
        },
      });

      if (existingSku) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
      }
    }

    const sparePart = await prisma.sparePart.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(category && { category }),
        ...(partCategoryId !== undefined && { partCategoryId }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(brand !== undefined && { brand }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(reorderPoint !== undefined && { reorderPoint: parseInt(reorderPoint) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(supplier && { supplier }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { partCategory: true },
    });

    return NextResponse.json({ sparePart });
  } catch (error) {
    console.error('Error updating spare part:', error);
    return NextResponse.json({ error: 'Failed to update spare part' }, { status: 500 });
  }
}

// DELETE - Delete spare part
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Spare part ID required' }, { status: 400 });
    }

    await prisma.sparePart.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Spare part deleted successfully' });
  } catch (error) {
    console.error('Error deleting spare part:', error);
    return NextResponse.json({ error: 'Failed to delete spare part' }, { status: 500 });
  }
}
