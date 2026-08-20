import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

// GET - Fetch single benefit page
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const benefit = await prisma.electricPage.findUnique({
      where: { id: params.id },
    });

    if (!benefit) {
      return NextResponse.json({ error: 'Benefit not found' }, { status: 404 });
    }

    return NextResponse.json({ benefit });
  } catch (error) {
    console.error('Error fetching benefit:', error);
    return NextResponse.json({ error: 'Failed to fetch benefit' }, { status: 500 });
  } 
}

// PUT - Update benefit page
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();

    const benefit = await prisma.electricPage.update({
      where: { id: params.id },
      data: {
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        heroImage: body.heroImage,
        content: body.description,
        isPublished: body.isPublished,
        ...(body.metadata !== undefined && { metadata: body.metadata }),
      },
    });

    return NextResponse.json({ benefit });
  } catch (error) {
    console.error('Error updating benefit:', error);
    return NextResponse.json({ error: 'Failed to update benefit' }, { status: 500 });
  } 
}
