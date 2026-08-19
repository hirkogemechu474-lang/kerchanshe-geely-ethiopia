import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch published news articles for public website
export async function GET(request: NextRequest) {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: {
        status: 'published',
      },
      orderBy: [
        { publishDate: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 6,
      select: {
        id: true,
        title: true,
        category: true,
        publishDate: true,
        createdAt: true,
        imageUrl: true,
        excerpt: true,
      },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching public news:', error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}
