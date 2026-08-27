import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Get single FAQ
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const faq = await contentRepository.findFaqById(id);

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
  const { id } = await params;
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const { question, answer, category, displayOrder, isActive, isFeatured } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const faq = await contentRepository.updateFaq(id, {
      question,
      answer,
      category: category || null,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
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
  const { id } = await params;
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    await contentRepository.deleteFaq(id);

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
