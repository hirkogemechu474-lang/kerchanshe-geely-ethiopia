import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Get all FAQs for admin
export async function GET() {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const faqs = await contentRepository.findAllFaqs();

    return NextResponse.json({
      success: true,
      faqs,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

// POST - Create new FAQ
export async function POST(request: NextRequest) {
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

    const faq = await contentRepository.createFaq({
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
      message: 'FAQ created successfully',
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}
