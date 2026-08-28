import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listPages, createPage } from '@/lib/services/services/servicesCmsService';

// GET - List all service pages
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const pages = await listPages();

    return NextResponse.json({
      success: true,
      pages,
    });
  } catch (error) {
    console.error('Error fetching service pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service pages' },
      { status: 500 }
    );
  }
}

// POST - Create new service page
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    const page = await createPage(body);

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('Error creating service page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service page' },
      { status: 500 }
    );
  }
}
