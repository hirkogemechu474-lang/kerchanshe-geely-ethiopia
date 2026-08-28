import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { messageRepository } from '@/repositories/messageRepository';

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const purchases = await messageRepository.findManyByCategory('Vehicle Purchase');
  return NextResponse.json({ purchases });
}
