import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - List all categories
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const categories = await contentRepository.findAllCategories();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();

    const category = await contentRepository.createCategory({
      name: body.name,
      slug: body.slug,
      description: body.description,
      imageUrl: body.imageUrl,
      iconUrl: body.iconUrl,
      heroImageUrl: body.heroImageUrl,
      heroVideoUrl: body.heroVideoUrl,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      brand: body.brandId ? { connect: { id: body.brandId } } : undefined,
      isActive: body.isActive !== false,
      displayOrder: body.displayOrder || 0,
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
