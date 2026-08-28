import { NextRequest, NextResponse } from 'next/server';
import { getPolicies, updatePolicies } from '@/lib/services/settings/policiesService';

// GET all policies
export async function GET() {
  try {
    const policiesObject = await getPolicies();
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
  try {
    const body = await request.json();
    await updatePolicies(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating policies:', error);
    return NextResponse.json(
      { error: 'Failed to update policies' },
      { status: 500 }
    );
  }
}
