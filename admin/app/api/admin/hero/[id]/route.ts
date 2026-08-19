import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - Fetch single hero section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const heroSection = await prisma.heroSection.findUnique({
      where: { id },
    });

    if (!heroSection) {
      return NextResponse.json({ error: 'Hero section not found' }, { status: 404 });
    }

    return NextResponse.json({ heroSection });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    return NextResponse.json({ error: 'Failed to fetch hero section' }, { status: 500 });
  } 
}

// PUT - Update hero section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      title,
      subtitle,
      description,
      mediaType,
      imageUrl,
      videoUrl,
      posterUrl,
      buttonText,
      buttonLink,
      sortOrder,
      isActive,
      status,
    } = body;

    const heroSection = await prisma.heroSection.update({
      where: { id },
      data: {
        title,
        subtitle,
        description,
        mediaType,
        imageUrl,
        videoUrl,
        posterUrl,
        buttonText,
        buttonLink,
        sortOrder,
        isActive,
        status,
      },
    });

    return NextResponse.json({ heroSection });
  } catch (error) {
    console.error('Error updating hero section:', error);
    return NextResponse.json({ error: 'Failed to update hero section' }, { status: 500 });
  } 
}

// DELETE - Delete hero section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.heroSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Hero section deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero section:', error);
    return NextResponse.json({ error: 'Failed to delete hero section' }, { status: 500 });
  } 
}
