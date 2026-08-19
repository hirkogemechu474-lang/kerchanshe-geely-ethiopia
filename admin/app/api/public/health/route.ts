import { NextResponse } from 'next/server';
import { withCorsHandler, corsPreflight } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export const GET = withCorsHandler(async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Admin API is running',
    timestamp: new Date().toISOString(),
  });
});