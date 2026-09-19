import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { newsRepository } from '../repositories/news.repository';

const router = Router();

// Every route here only ever required a valid admin session, never checked a
// permission — any authenticated staff member of any role could create/edit/
// delete news articles. canManageContent matches AdminLayout.tsx's "Manage
// News" nav item and every news admin page.tsx's own requirePermission/
// useAdminAuth('canManageContent') guard (not the separate canManageNews/
// canViewNews fields, which exist but aren't what the nav/pages actually use).
const gate = requirePermission('canManageContent');

// GET /api/news (admin list all — not just published; the public list lives
// under /api/public/news, a separate route)
router.get('/', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.newsArticle.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.newsArticle.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('Admin list news error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/news/:id (admin: single article detail)
router.get('/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const article = await newsRepository.findById(req.params.id);
    if (!article) { res.status(404).json({ error: 'News article not found' }); return; }
    res.json(article);
  } catch (error) {
    console.error('Get news article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/news (admin: create article)
router.post('/', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { title, category, content, author, image, imageUrl, excerpt, status, publishDate } = req.body;
    const article = await newsRepository.create({
      title,
      category,
      content,
      author,
      imageUrl: imageUrl || image || null,
      excerpt: excerpt || null,
      status: status || 'draft',
      publishDate: publishDate ? new Date(publishDate) : null,
    });
    res.status(201).json(article);
  } catch (error) {
    console.error('Create news article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/news/:id (admin: update article)
router.put('/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { title, category, content, author, image, imageUrl, excerpt, status, publishDate } = req.body;
    const article = await newsRepository.update(req.params.id, {
      ...(title !== undefined && { title }),
      ...(category !== undefined && { category }),
      ...(content !== undefined && { content }),
      ...(author !== undefined && { author }),
      ...((imageUrl !== undefined || image !== undefined) && { imageUrl: imageUrl || image || null }),
      ...(excerpt !== undefined && { excerpt }),
      ...(status !== undefined && { status }),
      ...(publishDate !== undefined && { publishDate: publishDate ? new Date(publishDate) : null }),
    });
    res.json(article);
  } catch (error) {
    console.error('Update news article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/news/:id (admin: delete article)
router.delete('/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    await newsRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete news article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as newsRoutes };
