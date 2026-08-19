import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - List all service pages
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const pages = await prisma.servicePage.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      pages,
    });
  } catch (error) {
    console.error('Error fetching service pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service pages' },
      { status: 500 }
    );
  }
}

// POST - Create new service page
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();

    const page = await prisma.servicePage.create({
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || null,
        content: body.content || null,
        heroImage: body.heroImage || null,
        heroVideo: body.heroVideo || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        isPublished: body.isPublished === true,
      },
    });

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('Error creating service page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service page' },
      { status: 500 }
    );
  }
}
