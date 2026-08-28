import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { newsRepository } from '@/repositories/newsRepository';

// GET - Fetch all news articles
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const articles = await newsRepository.findAll();

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching news articles:', error);
    return NextResponse.json({ error: 'Failed to fetch news articles' }, { status: 500 });
  }
}

// POST - Create new news article
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const { title, slug, category, content, author, image, excerpt, status, publishDate } = body;

    // Validation
    if (!title || !category || !content || !author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate slug if not provided
    const articleSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create article
    const article = await newsRepository.create({
      title,
      category,
      author,
      content,
      imageUrl: image || null,  // Save the uploaded image URL
      excerpt: excerpt || content.substring(0, 150), // Auto-generate excerpt if not provided
      status: status || 'draft',
      publishDate: publishDate ? new Date(publishDate) : (status === 'published' ? new Date() : null),
      views: 0,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Error creating news article:', error);
    return NextResponse.json({ error: 'Failed to create news article' }, { status: 500 });
  }
}

// PUT - Update news article
export async function PUT(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const { id, title, category, content, author, image, status, publishDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const article = await newsRepository.update(id, {
      ...(title && { title }),
      ...(category && { category }),
      ...(content && { content }),
      ...(author && { author }),
      ...(image !== undefined && { imageUrl: image || null }),
      ...(status && { status }),
      ...(publishDate !== undefined && {
        publishDate: publishDate ? new Date(publishDate) : null
      }),
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error updating news article:', error);
    return NextResponse.json({ error: 'Failed to update news article' }, { status: 500 });
  }
}

// DELETE - Delete news article
export async function DELETE(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    await newsRepository.delete(id);

    return NextResponse.json({ message: 'News article deleted successfully' });
  } catch (error) {
    console.error('Error deleting news article:', error);
    return NextResponse.json({ error: 'Failed to delete news article' }, { status: 500 });
  }
}
