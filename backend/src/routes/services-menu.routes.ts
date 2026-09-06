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

// GET /api/services-menu/sections (admin: list all sections, with items)
router.get('/sections', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const sections = await serviceCmsRepository.findAllSections();
    res.json(sections);
  } catch (error) {
    console.error('Get service sections error:', error);
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

// POST /api/services-menu/sections (admin: create section)
router.post('/sections', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { title, slug, description, iconUrl, isActive, displayOrder } = req.body;
    const section = await serviceCmsRepository.createSection({
      title,
      slug,
      description: description || null,
      iconUrl: iconUrl || null,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder ?? 0,
    });
    res.status(201).json(section);
  } catch (error) {
    console.error('Create service section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/services-menu/sections/:id (admin: update section)
router.put('/sections/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { title, slug, description, iconUrl, isActive, displayOrder } = req.body;
    const section = await serviceCmsRepository.updateSection(req.params.id, {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(iconUrl !== undefined && { iconUrl }),
      ...(isActive !== undefined && { isActive }),
      ...(displayOrder !== undefined && { displayOrder }),
    });
    res.json(section);
  } catch (error) {
    console.error('Update service section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/services-menu/sections/:id (admin: delete section, cascades to items)
router.delete('/sections/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await serviceCmsRepository.deleteSection(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete service section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/services-menu/pages (admin: create service page)
router.post('/pages', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { title, slug, content, excerpt, heroImage, heroVideo, metaTitle, metaDescription, isPublished, status, scheduledAt } = req.body;
    const page = await serviceCmsRepository.createPage({
      title,
      slug,
      content: content || null,
      excerpt: excerpt || null,
      heroImage: heroImage || null,
      heroVideo: heroVideo || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      isPublished: isPublished || false,
      ...(status !== undefined && { status }),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    });
    res.status(201).json(page);
  } catch (error) {
    console.error('Create service page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/services-menu/pages/:id (admin: update service page)
router.put('/pages/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { title, slug, content, excerpt, heroImage, heroVideo, metaTitle, metaDescription, isPublished, status, scheduledAt } = req.body;
    const page = await serviceCmsRepository.updatePage(req.params.id, {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(heroImage !== undefined && { heroImage }),
      ...(heroVideo !== undefined && { heroVideo }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(isPublished !== undefined && { isPublished }),
      ...(status !== undefined && { status }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
    });
    res.json(page);
  } catch (error) {
    console.error('Update service page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/services-menu/pages/:id (admin: delete service page)
router.delete('/pages/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await serviceCmsRepository.deletePage(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete service page error:', error);
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

// POST /api/services-menu/items (admin: create service item)
// NOTE: the ServiceItem model has no `pageId`/`page` relation or `slug`
// field (see prisma/schema.prisma) — only pick the fields that actually
// exist on the model, so an extra `pageId` sent by the admin form doesn't
// make Prisma throw on an unknown argument.
router.post('/items', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { title, description, icon, image, url, sectionId, displayOrder, isActive, isFeatured } = req.body;
    if (!sectionId) { res.status(400).json({ error: 'sectionId is required' }); return; }
    const item = await serviceCmsRepository.createItem({
      title,
      description: description || null,
      icon: icon || null,
      image: image || null,
      url: url || null,
      displayOrder: displayOrder ?? 0,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      section: { connect: { id: sectionId } },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create service item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/services-menu/items/:id (admin: update service item)
router.put('/items/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { title, description, icon, image, url, sectionId, displayOrder, isActive, isFeatured } = req.body;
    const item = await serviceCmsRepository.updateItem(req.params.id, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(icon !== undefined && { icon }),
      ...(image !== undefined && { image }),
      ...(url !== undefined && { url }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(sectionId !== undefined && { section: { connect: { id: sectionId } } }),
    });
    res.json(item);
  } catch (error) {
    console.error('Update service item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/services-menu/items/:id (admin: delete service item)
router.delete('/items/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await serviceCmsRepository.deleteItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete service item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as servicesMenuRoutes };
