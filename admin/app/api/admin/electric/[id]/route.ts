import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

// GET - Fetch single electric page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;

    const page = await prisma.electricPage.findUnique({
      where: { id },
      include: {
        chargingStations: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error fetching electric page:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  } 
}

// PUT - Update electric page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    const body = await request.json();

    const {
      title,
      slug,
      pageType,
      heroTitle,
      heroSubtitle,
      heroImage,
      content,
      sections,
      metadata,
      isPublished,
      displayOrder,
    } = body;

    // If slug is changing, check it's not already taken
    if (slug) {
      const existingPage = await prisma.electricPage.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existingPage) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const page = await prisma.electricPage.update({
      where: { id },
      data: {
        title,
        slug,
        pageType,
        heroTitle,
        heroSubtitle,
        heroImage,
        content,
        sections,
        metadata,
        isPublished,
        displayOrder,
      },
      include: {
        chargingStations: true,
      },
    });

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error updating electric page:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  } 
}

// DELETE - Delete electric page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;

    await prisma.electricPage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting electric page:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  } 
}
