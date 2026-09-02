import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { serviceCmsRepository } from '../repositories/serviceCms.repository';

const router = Router();

// GET /api/services-menu/pages (admin: list all service pages)
router.get('/pages', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const pages = await serviceCmsRepository.findAllPages();
    res.json(pages);
  } catch (error) {
    console.error('Get service pages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services-menu/pages/:id (admin: single service page)
router.get('/pages/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = await serviceCmsRepository.findPageById(req.params.id);
    if (!page) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json(page);
  } catch (error) {
    console.error('Get service page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services-menu/sections/:id (admin: service section with its items)
router.get('/sections/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const section = await serviceCmsRepository.findSectionById(req.params.id);
    if (!section) { res.status(404).json({ error: 'Section not found' }); return; }
    res.json(section);
  } catch (error) {
    console.error('Get service section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services-menu/items/:id (admin: service item with its section)
router.get('/items/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const item = await serviceCmsRepository.findItemById(req.params.id);
    if (!item) { res.status(404).json({ error: 'Item not found' }); return; }
    res.json(item);
  } catch (error) {
    console.error('Get service item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as servicesMenuRoutes };
