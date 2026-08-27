import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { promotionRepository } from '@/repositories/promotionRepository';

// GET - List all promotions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const promotions = await promotionRepository.findMany(status);

    return NextResponse.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new promotion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canManagePromotions) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const promotion = await promotionRepository.create({
      title: data.title,
      description: data.description,
      type: data.type,
      discountValue: parseFloat(data.discountValue),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      applicableModels: data.applicableModels,
      termsConditions: data.termsConditions,
      bannerImage: data.bannerImage,
      priority: parseInt(data.priority || 0),
      maxRedemptions: data.maxRedemptions ? parseInt(data.maxRedemptions) : null,
      currentRedemptions: 0,
      isActive: true,
    });

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
