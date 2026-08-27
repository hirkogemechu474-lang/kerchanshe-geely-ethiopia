import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { partRepository } from '@/repositories/partRepository';

// GET - List all spare parts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canViewSpareParts) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const inStock = searchParams.get('inStock');

    const parts = await partRepository.findMany({
      category,
      search,
      inStock: inStock === 'true',
    });

    return NextResponse.json(parts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new spare part
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canManageSpareParts) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const part = await partRepository.create({
      partNumber: data.partNumber,
      name: data.name,
      category: data.category,
      description: data.description,
      compatibleModels: data.compatibleModels,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
      reorderPoint: parseInt(data.reorderPoint || 5),
      supplier: data.supplier,
      warrantyPeriod: data.warrantyPeriod,
      isActive: true,
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Error creating part:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
