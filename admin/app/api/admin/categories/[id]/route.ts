import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const category = await contentRepository.findCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const body = await request.json();

    const category = await contentRepository.updateCategory(id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      imageUrl: body.imageUrl,
      iconUrl: body.iconUrl,
      heroImageUrl: body.heroImageUrl,
      heroVideoUrl: body.heroVideoUrl,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      brand: body.brandId ? { connect: { id: body.brandId } } : { disconnect: true },
      isActive: body.isActive !== false,
      displayOrder: body.displayOrder || 0,
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    // Check if category has vehicles
    const category = await contentRepository.findCategoryVehicleCount(id);

    if (category && category._count.vehicles > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${category._count.vehicles} vehicles. Please reassign or delete vehicles first.`
        },
        { status: 400 }
      );
    }

    await contentRepository.deleteCategory(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
