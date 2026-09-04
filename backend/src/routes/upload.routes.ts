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
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});

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

router.post('/', upload.single('file') as any, handleUpload);
router.post('/image', upload.single('file') as any, handleUpload);
router.post('/document', upload.single('file') as any, handleUpload);

export { router as uploadRoutes, UPLOAD_ROOT };
