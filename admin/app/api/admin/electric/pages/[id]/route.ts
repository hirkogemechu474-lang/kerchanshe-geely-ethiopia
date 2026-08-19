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
    const page = await prisma.electricMenuPage.findUnique({
      where: { id: id },
      include: {
        item: {
          include: {
            section: true,
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
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
    const {
      title,
      slug,
      excerpt,
      content,
      heroImage,
      heroVideo,
      metaTitle,
      metaDescription,
      isPublished,
    } = body;

    // Update the item's URL if slug changed
    const existingPage = await prisma.electricMenuPage.findUnique({
      where: { id: id },
    });

    if (existingPage && slug !== existingPage.slug) {
      await prisma.electricItem.update({
        where: { id: existingPage.itemId },
        data: { url: `/electric/${slug}` },
      });
    }

    const page = await prisma.electricMenuPage.update({
      where: { id: id },
      data: {
        title,
        slug,
        excerpt,
        content,
        heroImage,
        heroVideo,
        metaTitle,
        metaDescription,
        isPublished,
      },
    });

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
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
    // Clear the item's pageId before deleting
    const page = await prisma.electricMenuPage.findUnique({
      where: { id: id },
    });

    if (page) {
      await prisma.electricItem.update({
        where: { id: page.itemId },
        data: { pageId: null, url: null },
      });
    }

    await prisma.electricMenuPage.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
