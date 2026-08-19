import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

/**
 * GET /api/admin/vehicles
 * Get all vehicles with optional filters, search, and pagination
 */
export async function GET(request: Request) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const featured = searchParams.get('featured');

    const where: any = {};
    
    // Search across name, model, and SKU
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }

    if (brand && brand !== 'all') {
      where.OR = [
        ...(where.OR || []),
        { brand: { slug: brand } },
        { brand: { name: brand } },
        { brandId: brand },
      ];
    }
    
    if (featured !== null) {
      where.isFeatured = featured === 'true';
    }

    // Get total count and vehicles
    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              testDrives: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      vehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vehicles
 * Create a new vehicle
 */
export async function POST(request: Request) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    
    // Generate slug from name if not provided
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Calculate final price
    const basePrice = parseFloat(body.pricing?.basePrice || body.basePrice || 0);
    const taxRate = parseFloat(body.pricing?.taxRate || body.taxRate || 15);
    const discountAmount = parseFloat(body.pricing?.discountAmount || body.discountAmount || 0);
    
    const priceBeforeTax = basePrice - discountAmount;
    const taxAmount = (priceBeforeTax * taxRate) / 100;
    const finalPrice = priceBeforeTax + taxAmount;

    const vehicle = await prisma.vehicle.create({
      data: {
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
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
