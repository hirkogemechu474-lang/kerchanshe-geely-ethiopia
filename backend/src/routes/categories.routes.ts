import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { contentRepository } from '../repositories/content.repository';
import type { Prisma } from '@prisma/client';

// Admin CRUD for VehicleCategory. The repository CRUD methods
// (findAllCategories/findCategoryById/createCategory/updateCategory/
// deleteCategory) already existed in content.repository.ts, but no route
// ever exposed them — apps/admin/components/admin/categories/CategoryList.tsx
// and CategoryForm.tsx call /api/admin/categories(/:id), which 404'd.
//
// Mounted at /admin in routes/index.ts, so paths below become:
//   GET    /api/admin/categories?includeInactive=true
//   GET    /api/admin/categories/:id
//   POST   /api/admin/categories
//   PUT    /api/admin/categories/:id
//   DELETE /api/admin/categories/:id
//
// NOTE: GET /api/vehicles/categories/:id (backend/src/routes/vehicles.routes.ts)
// already exists and is what the server-rendered edit page actually calls —
// the GET /:id route here is added anyway for contract completeness/parity
// with the rest of this CRUD surface.

const router = Router();

router.get('/categories', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await contentRepository.findAllCategories(includeInactive);
    res.json({ categories });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categories/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const category = await contentRepository.findCategoryById(req.params.id);
    if (!category) { res.status(404).json({ error: 'Category not found' }); return; }
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/categories', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const {
      name, slug, description, imageUrl, iconUrl, heroImageUrl, heroVideoUrl,
      metaTitle, metaDescription, brandId, isActive, displayOrder,
    } = req.body || {};

    if (!name || !slug) {
      res.status(400).json({ error: 'name and slug are required' });
      return;
    }

    const data: Prisma.VehicleCategoryCreateInput = {
      name,
      slug,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      iconUrl: iconUrl ?? null,
      heroImageUrl: heroImageUrl ?? null,
      heroVideoUrl: heroVideoUrl ?? null,
      metaTitle: metaTitle ?? null,
      metaDescription: metaDescription ?? null,
      isActive: isActive ?? true,
      displayOrder: displayOrder ?? 0,
      ...(brandId ? { brand: { connect: { id: brandId } } } : {}),
    };

    const category = await contentRepository.createCategory(data);
    res.status(201).json({ success: true, category });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(400).json({ error: 'A category with that slug already exists.' });
      return;
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/categories/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const {
      name, slug, description, imageUrl, iconUrl, heroImageUrl, heroVideoUrl,
      metaTitle, metaDescription, brandId, isActive, displayOrder,
    } = req.body || {};

    const data: Prisma.VehicleCategoryUpdateInput = {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(iconUrl !== undefined && { iconUrl }),
      ...(heroImageUrl !== undefined && { heroImageUrl }),
      ...(heroVideoUrl !== undefined && { heroVideoUrl }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(isActive !== undefined && { isActive }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(brandId !== undefined && { brand: brandId ? { connect: { id: brandId } } : { disconnect: true } }),
    };

    const category = await contentRepository.updateCategory(req.params.id, data);
    res.json({ success: true, category });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    if (error?.code === 'P2002') {
      res.status(400).json({ error: 'A category with that slug already exists.' });
      return;
    }
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/categories/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const existing = await contentRepository.findCategoryVehicleCount(req.params.id);
    if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
    if ((existing._count?.vehicles ?? 0) > 0) {
      res.status(400).json({ error: 'Cannot delete a category that still has vehicles assigned. Remove or reassign those vehicles first.' });
      return;
    }

    await contentRepository.deleteCategory(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as categoriesRoutes };
