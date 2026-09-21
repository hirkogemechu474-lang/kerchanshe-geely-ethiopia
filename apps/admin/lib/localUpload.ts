import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

// Handles file uploads directly in this app instead of proxying them to the
// backend (see next.config.ts's rewrites — `/api/upload*` is deliberately
// excluded from the general `/api/:path*` backend proxy so these routes win).
// The backend's own upload handler already wrote files straight into this
// app's `public/uploads/` folder (so the admin panel could serve them
// without another network hop), which meant routing the upload itself
// through the backend was a redundant hop, and specifically a broken one:
// Next's rewrite proxy times out and fails (~30s, 500 Internal Server Error)
// on multipart bodies much past a few MB, which is exactly the showcase
// video / 3D model uploads this app needs. Handling it locally sidesteps
// that entirely — same URL shape, same result, no proxy involved.
const UPLOAD_ROOT = path.resolve(process.cwd(), 'public', 'uploads');

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
