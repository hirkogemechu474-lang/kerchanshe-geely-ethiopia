import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { settingRepository } from '@/repositories/settingRepository';

// GET all policies
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const policies = await settingRepository.findManyByType('policy');

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
      updates.push(settingRepository.upsert('privacy_policy', privacy, 'policy'));
    }

    if (terms !== undefined) {
      updates.push(settingRepository.upsert('terms_of_service', terms, 'policy'));
    }

    if (cookies !== undefined) {
      updates.push(settingRepository.upsert('cookie_policy', cookies, 'policy'));
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
