import { partsRepository } from '@/repositories/partsRepository';

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Benefits ───────────────────────────────────────────────────────────
export async function listBenefits() {
  return partsRepository.findAllBenefits();
}

export async function createBenefit(body: any) {
  const { title, description, icon, displayOrder, isActive } = body;
  if (!title) {
    return { ok: false as const, error: 'Title is required' };
  }

  const benefit = await partsRepository.createBenefit({
    title,
    description: description || null,
    icon: icon || null,
    displayOrder: parseInt(displayOrder) || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  return { ok: true as const, benefit };
}

export async function updateBenefit(id: string, body: any) {
  return partsRepository.updateBenefit(id, {
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.icon !== undefined && { icon: body.icon }),
    ...(body.displayOrder !== undefined && { displayOrder: parseInt(body.displayOrder) }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  });
}

export async function deleteBenefit(id: string) {
  return partsRepository.deleteBenefit(id);
}

// ── Brands ─────────────────────────────────────────────────────────────
export async function listBrands() {
  return partsRepository.findAllBrands();
}

export async function createBrand(body: any) {
  const { name, imageUrl, description, displayOrder, isActive } = body;
  if (!name) {
    return { ok: false as const, error: 'Name is required' };
  }

  const brand = await partsRepository.createBrand({
    name,
    imageUrl: imageUrl || null,
    description: description || null,
    displayOrder: parseInt(displayOrder) || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  return { ok: true as const, brand };
}

export async function updateBrand(id: string, body: any) {
  return partsRepository.updateBrand(id, {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.displayOrder !== undefined && { displayOrder: parseInt(body.displayOrder) }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  });
}

export async function deleteBrand(id: string) {
  return partsRepository.deleteBrand(id);
}

// ── Categories ─────────────────────────────────────────────────────────
export async function listCategories() {
  return partsRepository.findAllCategories();
}

export async function createCategory(body: any) {
  const { name, description, imageUrl, displayOrder, isActive } = body;
  if (!name) {
    return { ok: false as const, error: 'Name is required' };
  }

  const slug = toSlug(body.slug || name);
  const existing = await partsRepository.findCategoryBySlug(slug);
  if (existing) {
    return { ok: false as const, error: 'A category with this slug already exists' };
  }

  const category = await partsRepository.createCategory({
    name,
    slug,
    description: description || null,
    imageUrl: imageUrl || null,
    displayOrder: parseInt(displayOrder) || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  return { ok: true as const, category };
}

export async function updateCategory(id: string, body: any) {
  return partsRepository.updateCategory(id, {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
    ...(body.displayOrder !== undefined && { displayOrder: parseInt(body.displayOrder) }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
    ...(body.slug && { slug: toSlug(body.slug) }),
  });
}

export async function deleteCategory(id: string) {
  return partsRepository.deleteCategory(id);
}

// ── Page content (single record, upserted lazily) ────────────────────
export async function getContent() {
  const content = await partsRepository.findContent();
  if (content) return content;
  return partsRepository.createContent({});
}

export async function updateContent(body: any) {
  const content = await partsRepository.findContent();
  if (!content) {
    return partsRepository.createContent(body);
  }
  return partsRepository.updateContent(content.id, body);
}
