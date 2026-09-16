import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';

const router = Router();

// Physical location where uploaded media must land so it is served over HTTP.
// The customer web app proxies `/uploads/*` -> admin (`apps/admin/public/uploads/`
// is served by the admin Next.js app at :7500). The backend runs with CWD =
// `backend/`, so `../apps/admin/public/uploads` resolves to the repo's admin
// static uploads directory. Fall back to a local `./uploads` if the path is
// unexpectedly missing (e.g. a different layout) so uploads never throw.
const ADMIN_PUBLIC_UPLOADS = path.resolve(
  process.cwd(),
  '..',
  'apps',
  'admin',
  'public',
  'uploads',
);
const UPLOAD_ROOT = fs.existsSync(path.resolve(ADMIN_PUBLIC_UPLOADS))
  ? ADMIN_PUBLIC_UPLOADS
  : path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

function sanitizeSegment(name: unknown): string {
  if (typeof name !== 'string' || !name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// memoryStorage buffers the file in memory so `req.body` (text fields) is fully
// parsed by the time we resolve the destination subfolder. diskStorage's
// `destination` callback runs before the text fields are guaranteed to be
// populated on `req.body`, which silently dropped the category.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024, files: 1 },
});

// multer emits a MulterError (e.g. LIMIT_FILE_SIZE) through Express's error-
// handling path, not the normal req/res flow — without this, an oversized
// file fell through to Express's default HTML error page, which the admin
// panel's `response.json()` couldn't parse, surfacing as a generic "Failed to
// upload" with no indication of why.
function handleMulterError(err: any, req: any, res: any, next: any): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File is too large. Maximum upload size is 1GB.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  if (err) {
    console.error('[UPLOAD ERROR]', err?.message);
    res.status(500).json({ error: 'Failed to upload file.' });
    return;
  }
  next();
}

function handleUpload(req: any, res: any): void {
  const file: Express.Multer.File | undefined = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }

  try {
    const category = sanitizeSegment(req.body?.category);
    const folder = category ? path.join(UPLOAD_ROOT, category) : UPLOAD_ROOT;
    fs.mkdirSync(folder, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${randomBytes(4).toString('hex')}${ext.toLowerCase() || ext}`;
    fs.writeFileSync(path.join(folder, filename), file.buffer);

    const url = category ? `/uploads/${category}/${filename}` : `/uploads/${filename}`;
    res.status(201).json({ url });
  } catch (error: any) {
    console.error('[UPLOAD ERROR]', error?.message);
    res.status(500).json({ error: 'Failed to save uploaded file.' });
  }
}

router.post('/', upload.single('file') as any, handleMulterError, handleUpload);
router.post('/image', upload.single('file') as any, handleMulterError, handleUpload);
router.post('/document', upload.single('file') as any, handleMulterError, handleUpload);

export { router as uploadRoutes, UPLOAD_ROOT };
