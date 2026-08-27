import { NextRequest, NextResponse } from 'next/server';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Get active FAQs for frontend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const [faqs, categories] = await Promise.all([
      contentRepository.findActiveFaqs({
        category,
        featuredOnly: featured === 'true',
        limit: limit ? parseInt(limit) : undefined,
      }),
      contentRepository.findActiveFaqCategories(),
    ]);

    return NextResponse.json({
      success: true,
      faqs,
      categories,
      total: faqs.length,
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}
