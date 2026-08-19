import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - Get single FAQ
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const faq = await prisma.fAQ.findUnique({
      where: { id: id },
    });

    if (!faq) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      faq,
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQ' },
      { status: 500 }
    );
  }
}

// PUT - Update FAQ
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question, answer, category, displayOrder, isActive, isFeatured } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const faq = await prisma.fAQ.update({
      where: { id: id },
      data: {
        question,
        answer,
        category: category || null,
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
      },
    });

    return NextResponse.json({
      success: true,
      faq,
      message: 'FAQ updated successfully',
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

// DELETE - Delete FAQ
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.fAQ.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}