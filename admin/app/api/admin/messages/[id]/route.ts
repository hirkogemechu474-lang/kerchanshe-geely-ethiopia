import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { messageRepository } from '@/repositories/messageRepository';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;
  if (!session!.user.permissions.canViewMessages) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const message = await messageRepository.update(id, { status: body.status, priority: body.priority, response: body.response });
  return NextResponse.json({ message });
}
