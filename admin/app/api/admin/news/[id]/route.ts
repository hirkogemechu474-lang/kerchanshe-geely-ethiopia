import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - Fetch single news article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const article = await prisma.newsArticle.findUnique({
      where: { id: id },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching news article:', error);
    return NextResponse.json({ error: 'Failed to fetch news article' }, { status: 500 });
  }
}

// PUT - Update news article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, content, author, imageUrl, excerpt, status, publishDate } = body;

    // Validation
    if (!title || !category || !content || !author) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if article exists
    const existingArticle = await prisma.newsArticle.findUnique({
      where: { id: id },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Update article
    const article = await prisma.newsArticle.update({
      where: { id: id },
      data: {
        title,
        category,
        author,
        content,
        imageUrl: imageUrl || null,
        excerpt: excerpt || content.substring(0, 150),
        status: status || 'draft',
        publishDate: publishDate ? new Date(publishDate) : (status === 'published' ? new Date() : null),
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error updating news article:', error);
    return NextResponse.json({ error: 'Failed to update news article' }, { status: 500 });
  }
}

// DELETE - Delete news article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if article exists
    const existingArticle = await prisma.newsArticle.findUnique({
      where: { id: id },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Delete article
    await prisma.newsArticle.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'News article deleted successfully' });
  } catch (error) {
    console.error('Error deleting news article:', error);
    return NextResponse.json({ error: 'Failed to delete news article' }, { status: 500 });
  }
}