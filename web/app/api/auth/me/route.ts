import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth/customer';

export async function GET() {
  const user = await getCustomerSession();
  return user ? NextResponse.json({ user }) : NextResponse.json({ user: null }, { status: 401 });
}
