import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Get single vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // NOTE: deliberately NOT including testDrives/quotations. Those relations
    // contain customer PII (names, phones, emails) and this is an
    // unauthenticated public endpoint. Include only the vehicle payload.
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        _count: {
          select: { testDrives: true },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Parse JSON strings back to objects
    const vehicleData = {
      ...vehicle,
      images: typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images,
      specifications: typeof vehicle.specifications === 'string' ? JSON.parse(vehicle.specifications) : vehicle.specifications,
    };

    return NextResponse.json(vehicleData);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.permissions?.canManageVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.model) updateData.model = data.model;
    if (data.year) updateData.year = parseInt(data.year);
    if (data.category) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.images) updateData.images = JSON.stringify(data.images);
    if (data.specifications) updateData.specifications = JSON.stringify(data.specifications);
    if (data.basePrice) updateData.basePrice = parseFloat(data.basePrice);
    if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount ? parseFloat(data.discountAmount) : null;
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.taxRate) updateData.taxRate = parseFloat(data.taxRate);
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.reorderPoint !== undefined) updateData.reorderPoint = data.reorderPoint ? parseInt(data.reorderPoint) : null;
    if (data.warehouse !== undefined) updateData.warehouse = data.warehouse;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete vehicle (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.permissions?.canManageVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.vehicle.update({
      where: { id: id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
