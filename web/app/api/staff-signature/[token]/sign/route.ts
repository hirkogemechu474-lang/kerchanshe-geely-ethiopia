import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { UPLOADS_ROOT } from '@/lib/upload-utils';

// Public — completes staff signature setup. Unlike the customer-facing
// sign routes (agreement/handover/quotation), this stores the signature
// as a standalone image asset to be reused later, not stamped onto a
// specific document right now — see stampAgentSignatureText's sibling
// image-stamping counterpart, applied at countersign time.
// One-time: the token is cleared on success, same as every other setup
// link in this codebase.
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementSign);
  if (rateLimitResult) return rateLimitResult;

  const { token } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type === 'drawn' || body?.type === 'photo' ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: 'Invalid signing type' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { signatureSetupToken: token } });
  if (!user) {
    return NextResponse.json({ error: 'This signature link is invalid or has already been used.' }, { status: 404 });
  }
  if (!user.signatureSetupTokenExpiresAt || user.signatureSetupTokenExpiresAt < new Date()) {
    return NextResponse.json({ error: 'This signature link has expired. Ask your admin to send a new one.' }, { status: 409 });
  }

  let signatureUrl: string;

  if (type === 'drawn') {
    const signatureDataUrl = typeof body?.signatureDataUrl === 'string' ? body.signatureDataUrl : '';
    if (!signatureDataUrl.startsWith('data:image/png')) {
      return NextResponse.json({ error: 'A valid drawn signature is required.' }, { status: 400 });
    }
    const base64 = signatureDataUrl.split(',')[1] || '';
    const pngBytes = Buffer.from(base64, 'base64');

    const uploadDir = path.join(UPLOADS_ROOT, 'staff-signatures');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filename = `${user.id}-${Date.now()}.png`;
    await writeFile(path.join(uploadDir, filename), pngBytes);
    signatureUrl = `/uploads/staff-signatures/${filename}`;
  } else {
    const photoUrl = typeof body?.photoUrl === 'string' ? body.photoUrl.trim() : '';
    if (!photoUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'A valid uploaded photo is required.' }, { status: 400 });
    }
    signatureUrl = photoUrl;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      signatureUrl,
      signatureUpdatedAt: new Date(),
      signatureSetupToken: null,
      signatureSetupTokenExpiresAt: null,
    },
  });

  return NextResponse.json({ signatureUrl });
}
