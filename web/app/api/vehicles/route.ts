import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { vehicleRepository } from '@/repositories/vehicleRepository';

// GET - List all vehicles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canViewVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const skip = (page - 1) * limit;

    const [vehicles, total] = await vehicleRepository.findAdminList({ search, category, skip, limit });

    return NextResponse.json({
      vehicles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canManageVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const vehicle = await vehicleRepository.create({
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      model: data.model,
      year: parseInt(data.year),
      category: data.category,
      brandId: data.brandId || null,
      categoryId: data.categoryId || null,
      description: data.description,
      images: JSON.stringify(data.images || []),
      specifications: JSON.stringify(data.specifications || {}),
      basePrice: parseFloat(data.basePrice),
      discountAmount: data.discountAmount ? parseFloat(data.discountAmount) : null,
      discountType: data.discountType,
      taxRate: data.taxRate ? parseFloat(data.taxRate) : 15,
      stock: parseInt(data.stock || 0),
      sku: data.sku,
      reorderPoint: data.reorderPoint ? parseInt(data.reorderPoint) : null,
      warehouse: data.warehouse,
      isFeatured: data.isFeatured || false,
      isActive: true,
      badge: data.badge || null,
      displayOrder: Number(data.displayOrder || 0),
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
