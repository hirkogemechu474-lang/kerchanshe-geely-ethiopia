import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { staffSignatureRepository } from '@/repositories/staffSignatureRepository';
import { UPLOADS_ROOT } from '@/lib/upload-utils';

export type SignatureTokenLookupResult =
  | { ok: true; name: string; hasExistingSignature: boolean }
  | { ok: false; httpStatus: 404 | 409; error: string };

// Public — same random-token-as-access-key pattern as every other
// self-service link in this codebase, just for a staff member setting up
// their own signature (see admin/app/api/admin/users/[id]/signature-link)
// rather than a customer signing a document.
export async function lookupSignatureToken(token: string): Promise<SignatureTokenLookupResult> {
  const user = await staffSignatureRepository.findByToken(token);
  if (!user) {
    return { ok: false, httpStatus: 404, error: 'This signature link is invalid or has already been used.' };
  }
  if (!user.signatureSetupTokenExpiresAt || user.signatureSetupTokenExpiresAt < new Date()) {
    return { ok: false, httpStatus: 409, error: 'This signature link has expired. Ask your admin to send a new one.' };
  }

  return { ok: true, name: user.name, hasExistingSignature: Boolean(user.signatureUrl) };
}

export type CompleteSignatureSetupResult =
  | { ok: true; signatureUrl: string }
  | { ok: false; httpStatus: 400 | 404 | 409; error: string };

// Public — completes staff signature setup. Unlike the customer-facing
// sign routes (agreement/handover/quotation), this stores the signature
// as a standalone image asset to be reused later, not stamped onto a
// specific document right now — see stampAgentSignatureText's sibling
// image-stamping counterpart, applied at countersign time.
// One-time: the token is cleared on success, same as every other setup
// link in this codebase.
export async function completeSignatureSetup(
  token: string,
  type: 'drawn' | 'photo',
  payload: { signatureDataUrl?: string; photoUrl?: string }
): Promise<CompleteSignatureSetupResult> {
  const user = await staffSignatureRepository.findByToken(token);
  if (!user) {
    return { ok: false, httpStatus: 404, error: 'This signature link is invalid or has already been used.' };
  }
  if (!user.signatureSetupTokenExpiresAt || user.signatureSetupTokenExpiresAt < new Date()) {
    return { ok: false, httpStatus: 409, error: 'This signature link has expired. Ask your admin to send a new one.' };
  }

  let signatureUrl: string;

  if (type === 'drawn') {
    const signatureDataUrl = payload.signatureDataUrl || '';
    if (!signatureDataUrl.startsWith('data:image/png')) {
      return { ok: false, httpStatus: 400, error: 'A valid drawn signature is required.' };
    }
    const base64 = signatureDataUrl.split(',')[1] || '';
    const pngBytes = Buffer.from(base64, 'base64');

    const uploadDir = path.join(UPLOADS_ROOT, 'staff-signatures');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filename = `${user.id}-${Date.now()}.png`;
    await writeFile(path.join(uploadDir, filename), pngBytes);
    signatureUrl = `/uploads/staff-signatures/${filename}`;
  } else {
    const photoUrl = payload.photoUrl?.trim() || '';
    if (!photoUrl.startsWith('/uploads/')) {
      return { ok: false, httpStatus: 400, error: 'A valid uploaded photo is required.' };
    }
    signatureUrl = photoUrl;
  }

  await staffSignatureRepository.completeSetup(user.id, signatureUrl);

  return { ok: true, signatureUrl };
}
