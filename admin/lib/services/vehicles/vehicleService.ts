import { vehicleRepository } from '@/repositories/vehicleRepository';

export interface AdminVehicleListParams {
  page: number;
  limit: number;
  search?: string | null;
  status?: string | null;
  category?: string | null;
  brand?: string | null;
  featured?: string | null;
}

export async function listVehiclesForAdmin(params: AdminVehicleListParams) {
  const skip = (params.page - 1) * params.limit;

  const where: any = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { model: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.status && params.status !== 'all') {
    where.status = params.status;
  }

  if (params.category && params.category !== 'all') {
    where.category = params.category;
  }

  if (params.brand && params.brand !== 'all') {
    where.OR = [
      ...(where.OR || []),
      { brand: { slug: params.brand } },
      { brand: { name: params.brand } },
      { brandId: params.brand },
    ];
  }

  if (params.featured !== null && params.featured !== undefined) {
    where.isFeatured = params.featured === 'true';
  }

  const [total, vehicles] = await vehicleRepository.findManyForAdmin(where, skip, params.limit);

  return {
    vehicles,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}

function calculateFinalPrice(basePrice: number, taxRate: number, discountAmount: number) {
  const priceBeforeTax = basePrice - discountAmount;
  const taxAmount = (priceBeforeTax * taxRate) / 100;
  return priceBeforeTax + taxAmount;
}

export async function createVehicle(body: any) {
  // Generate slug from name if not provided
  const slug = body.slug || body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Calculate final price
  const basePrice = parseFloat(body.pricing?.basePrice || body.basePrice || 0);
  const taxRate = parseFloat(body.pricing?.taxRate || body.taxRate || 15);
  const discountAmount = parseFloat(body.pricing?.discountAmount || body.discountAmount || 0);
  const finalPrice = calculateFinalPrice(basePrice, taxRate, discountAmount);

  return vehicleRepository.createVehicle({
    name: body.name,
    slug,
    model: body.model,
    year: parseInt(body.year),
    category: body.category,
    brandId: body.brandId || null,
    categoryId: body.categoryId || null,
    description: body.description || null,
    images: body.images || [],
    specifications: body.specifications || {},
    basePrice,
    discountAmount: discountAmount || null,
    discountType: body.pricing?.discountType || body.discountType || null,
    badge: body.badge || null,
    taxRate,
    finalPrice,
    hidePrice: Boolean(body.pricing?.hidePrice ?? body.hidePrice ?? false),
    stock: parseInt(body.inventory?.stock || body.stock || 0),
    sku: body.inventory?.sku || body.sku || null,
    reorderPoint: parseInt(body.inventory?.reorderPoint || body.reorderPoint || 5),
    warehouse: body.inventory?.warehouse || body.warehouse || null,
    location: body.inventory?.location || body.location || null,
    isFeatured: body.featured || false,
    isActive: true,
    status: body.status || 'draft',
    displayOrder: Number(body.displayOrder || 0),
    heroImageUrl: body.heroImageUrl || null,
    heroVideoUrl: body.heroVideoUrl || null,
  });
}

export async function updateVehicle(id: string, body: any) {
  // Calculate final price if pricing data provided
  let finalPrice: number | undefined;
  if (body.pricing || body.basePrice) {
    const basePrice = parseFloat(body.pricing?.basePrice || body.basePrice || 0);
    const taxRate = parseFloat(body.pricing?.taxRate || body.taxRate || 15);
    const discountAmount = parseFloat(body.pricing?.discountAmount || body.discountAmount || 0);
    finalPrice = calculateFinalPrice(basePrice, taxRate, discountAmount);
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

  return vehicleRepository.updateVehicle(id, updateData);
}

export type DeleteVehicleResult =
  | { ok: true; archived: true; message: string }
  | { ok: true; deleted: true; message: string }
  | { ok: false; httpStatus: 404; error: string };

export async function deleteVehicle(id: string): Promise<DeleteVehicleResult> {
  // Check if vehicle has test drives or quotations
  const vehicle = await vehicleRepository.findByIdWithTestDriveCount(id);

  if (!vehicle) {
    return { ok: false, httpStatus: 404, error: 'Vehicle not found' };
  }

  // If vehicle has related data, soft delete by marking as inactive
  if (vehicle._count.testDrives > 0) {
    await vehicleRepository.archive(id);

    return { ok: true, archived: true, message: 'Vehicle archived (has related test drives or quotations)' };
  }

  // Otherwise, hard delete
  await vehicleRepository.delete(id);

  return { ok: true, deleted: true, message: 'Vehicle deleted successfully' };
}
