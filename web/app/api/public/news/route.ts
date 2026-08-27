import { NextResponse } from 'next/server';
import { newsRepository } from '@/repositories/newsRepository';

// GET - Fetch published news articles for public website
export async function GET() {
  try {
    const articles = await newsRepository.findPublished(6);
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching public news:', error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}
