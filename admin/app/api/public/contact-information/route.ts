import { NextResponse } from 'next/server';
import { getContactInformation } from '@/lib/services/content/contactInformationService';

export async function GET() {
  const contactInfo = await getContactInformation();
  return NextResponse.json(contactInfo);
}
