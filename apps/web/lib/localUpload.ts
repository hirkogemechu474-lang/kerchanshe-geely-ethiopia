import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

// Handles file uploads directly in this app instead of proxying them to the
// backend (see next.config.ts's rewrites — `/api/upload*` is deliberately
// excluded from the general `/api/:path*` backend proxy so these routes win,
// same reasoning as apps/admin/lib/localUpload.ts). Next's rewrite proxy
// times out and fails (~30s, plain-text 500 Internal Server Error, not JSON)
// on multipart bodies much past a few MB, which every caller here parses
// with response.json() — that mismatch is what surfaces in the browser
// console as "Unexpected token 'I', "Internal S"... is not valid JSON".
//
// Files land in the admin app's public/uploads/ (not this app's own), since
// that's the directory actually served at GET /uploads/* — both this app's
// own rewrite (proxying to the admin origin) and the backend's own upload
// handler already agree on that location.
const UPLOAD_ROOT = path.resolve(process.cwd(), '..', 'admin', 'public', 'uploads');
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;

function sanitizeSegment(name: unknown): string {
  if (typeof name !== 'string' || !name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function handleLocalUpload(req: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File is too large. Maximum upload size is 1GB.' }, { status: 413 });
  }

  try {
    const category = sanitizeSegment(formData.get('category'));
    const folder = category ? path.join(UPLOAD_ROOT, category) : UPLOAD_ROOT;
    fs.mkdirSync(folder, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${randomBytes(4).toString('hex')}${ext.toLowerCase() || ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(folder, filename), buffer);

    const url = category ? `/uploads/${category}/${filename}` : `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (error: any) {
    console.error('[UPLOAD ERROR]', error?.message);
    return NextResponse.json({ error: 'Failed to save uploaded file.' }, { status: 500 });
  }
}
