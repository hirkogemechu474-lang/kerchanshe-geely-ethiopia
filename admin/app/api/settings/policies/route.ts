import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET all policies
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const policies = await prisma.setting.findMany({
      where: { type: 'policy' }
    });

    // Convert to object format
    const policiesObject: Record<string, any> = {};
    policies.forEach(policy => {
      policiesObject[policy.key] = {
        id: policy.id,
        content: policy.value,
        updatedAt: policy.updatedAt
      };
    });

    return NextResponse.json(policiesObject);
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

// POST - Update policies
export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageSettings) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { privacy, terms, cookies } = body;

    const updates = [];

    if (privacy !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'privacy_policy' },
          update: { value: privacy, type: 'policy' },
          create: { key: 'privacy_policy', value: privacy, type: 'policy' }
        })
      );
    }

    if (terms !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'terms_of_service' },
          update: { value: terms, type: 'policy' },
          create: { key: 'terms_of_service', value: terms, type: 'policy' }
        })
      );
    }

    if (cookies !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'cookie_policy' },
          update: { value: cookies, type: 'policy' },
          create: { key: 'cookie_policy', value: cookies, type: 'policy' }
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating policies:', error);
    return NextResponse.json(
      { error: 'Failed to update policies' },
      { status: 500 }
    );
  }
}
