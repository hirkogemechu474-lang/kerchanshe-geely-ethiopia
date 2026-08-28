import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { newsRepository } from '@/repositories/newsRepository';

// GET - List all news articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    const articles = await newsRepository.findMany({ status, category });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new news article
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canManageNews) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const article = await newsRepository.create({
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      imageUrl: data.imageUrl,
      author: session.user.name,
      publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
      status: data.status || 'draft',
      views: 0,
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating news article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
