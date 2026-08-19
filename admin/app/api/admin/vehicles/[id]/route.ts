import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

/**
 * GET /api/admin/vehicles/[id]
 * Get a single vehicle by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id: id,
      },
      include: {
        brand: true,
        vehicleCategory: true,
        testDrives: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/vehicles/[id]
 * Update a vehicle
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    const body = await request.json();
    
    // Calculate final price if pricing data provided
    let finalPrice: number | undefined;
    if (body.pricing || body.basePrice) {
      const basePrice = parseFloat(body.pricing?.basePrice || body.basePrice || 0);
      const taxRate = parseFloat(body.pricing?.taxRate || body.taxRate || 15);
      const discountAmount = parseFloat(body.pricing?.discountAmount || body.discountAmount || 0);
      
      const priceBeforeTax = basePrice - discountAmount;
      const taxAmount = (priceBeforeTax * taxRate) / 100;
      finalPrice = priceBeforeTax + taxAmount;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (body.name) updateData.name = body.name;
    if (body.slug) updateData.slug = body.slug;
    if (body.model) updateData.model = body.model;
    if (body.year) updateData.year = parseInt(body.year);
    if (body.category) updateData.category = body.category;
    if (body.brandId !== undefined) updateData.brandId = body.brandId || null;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.images) updateData.images = body.images;
    if (body.specifications) updateData.specifications = body.specifications;
    
    if (body.pricing?.basePrice || body.basePrice) {
      updateData.basePrice = parseFloat(body.pricing?.basePrice || body.basePrice);
    }
    if (body.pricing?.discountAmount !== undefined || body.pricing?.discount !== undefined || body.discountAmount !== undefined) {
      updateData.discountAmount = parseFloat(body.pricing?.discountAmount ?? body.pricing?.discount ?? body.discountAmount ?? 0) || null;
    }
    if (body.pricing?.discountType !== undefined || body.discountType !== undefined) {
      updateData.discountType = body.pricing?.discountType ?? body.discountType;
    }
    if (body.badge !== undefined) updateData.badge = body.badge || null;
    if (body.pricing?.taxRate || body.taxRate) {
      updateData.taxRate = parseFloat(body.pricing?.taxRate || body.taxRate);
    }
    if (finalPrice !== undefined) {
      updateData.finalPrice = finalPrice;
    }
    
    if (body.inventory?.stock !== undefined || body.stock !== undefined) {
      updateData.stock = parseInt(body.inventory?.stock || body.stock || 0);
    }
    if (body.inventory?.sku !== undefined || body.sku !== undefined) {
      updateData.sku = body.inventory?.sku ?? body.sku ?? null;
    }
    if (body.inventory?.reorderPoint !== undefined || body.reorderPoint !== undefined) {
      updateData.reorderPoint = parseInt(body.inventory?.reorderPoint ?? body.reorderPoint ?? 0);
    }
    if (body.inventory?.warehouseLocation !== undefined || body.inventory?.warehouse !== undefined || body.warehouse !== undefined) {
      updateData.warehouse = body.inventory?.warehouseLocation ?? body.inventory?.warehouse ?? body.warehouse ?? null;
    }
    if (body.inventory?.location !== undefined || body.location !== undefined) {
      updateData.location = body.inventory?.location ?? body.location ?? null;
    }
    
    if (body.featured !== undefined) updateData.isFeatured = body.featured;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.status) updateData.status = body.status;
    if (body.pricing?.hidePrice !== undefined || body.hidePrice !== undefined) {
      updateData.hidePrice = Boolean(body.pricing?.hidePrice ?? body.hidePrice ?? false);
    }
    if (body.displayOrder !== undefined) updateData.displayOrder = parseInt(body.displayOrder || 0);
    if (body.heroImageUrl !== undefined) updateData.heroImageUrl = body.heroImageUrl || null;
    if (body.heroVideoUrl !== undefined) updateData.heroVideoUrl = body.heroVideoUrl || null;

    const vehicle = await prisma.vehicle.update({
      where: {
        id: id,
      },
      data: updateData,
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/vehicles/[id]
 * Delete a vehicle
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    // Check if vehicle has test drives or quotations
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            testDrives: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // If vehicle has related data, soft delete by marking as inactive
    if (vehicle._count.testDrives > 0) {
      await prisma.vehicle.update({
        where: { id: id },
        data: {
          isActive: false,
          status: 'archived',
        },
      });

      return NextResponse.json({
        message: 'Vehicle archived (has related test drives or quotations)',
        archived: true,
      });
    }

    // Otherwise, hard delete
    await prisma.vehicle.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ 
      message: 'Vehicle deleted successfully',
      deleted: true,
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
