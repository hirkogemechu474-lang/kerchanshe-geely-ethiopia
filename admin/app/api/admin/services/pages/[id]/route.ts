import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - Get single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    const page = await prisma.servicePage.findUnique({
      where: { id: id },
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PUT - Update page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    const body = await request.json();

    const page = await prisma.servicePage.update({
      where: { id: id },
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt || null,
        content: body.content || '',
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
    console.error('Error updating page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    await prisma.servicePage.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
