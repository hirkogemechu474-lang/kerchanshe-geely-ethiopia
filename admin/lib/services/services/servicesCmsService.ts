import { servicesCmsRepository } from '@/repositories/servicesCmsRepository';

// ── Sections ───────────────────────────────────────────────────────────
export async function listSections() {
  return servicesCmsRepository.findAllSections();
}

export async function createSection(body: any) {
  return servicesCmsRepository.createSection({
    title: body.title,
    slug: body.slug,
    description: body.description || null,
    iconUrl: body.iconUrl || null,
    isActive: body.isActive !== false,
    displayOrder: body.displayOrder || 0,
  });
}

export async function getSection(id: string) {
  return servicesCmsRepository.findSectionById(id);
}

export async function updateSection(id: string, body: any) {
  return servicesCmsRepository.updateSection(id, {
    title: body.title,
    slug: body.slug,
    description: body.description || null,
    iconUrl: body.iconUrl || null,
    isActive: body.isActive !== false,
    displayOrder: body.displayOrder || 0,
  });
}

export async function deleteSection(id: string) {
  return servicesCmsRepository.deleteSection(id);
}

// ── Pages ──────────────────────────────────────────────────────────────
export async function listPages() {
  return servicesCmsRepository.findAllPages();
}

export async function createPage(body: any) {
  return servicesCmsRepository.createPage({
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt || null,
    content: body.content || null,
    heroImage: body.heroImage || null,
    heroVideo: body.heroVideo || null,
    metaTitle: body.metaTitle || null,
    metaDescription: body.metaDescription || null,
    isPublished: body.isPublished === true,
  });
}

export async function getPage(id: string) {
  return servicesCmsRepository.findPageById(id);
}

export async function updatePage(id: string, body: any) {
  return servicesCmsRepository.updatePage(id, {
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt || null,
    content: body.content || '',
    heroImage: body.heroImage || null,
    heroVideo: body.heroVideo || null,
    metaTitle: body.metaTitle || null,
    metaDescription: body.metaDescription || null,
    isPublished: body.isPublished === true,
  });
}

export async function deletePage(id: string) {
  return servicesCmsRepository.deletePage(id);
}

// ── Items ──────────────────────────────────────────────────────────────
export async function listItems(sectionId: string | null) {
  return servicesCmsRepository.findManyItems(sectionId);
}

export async function createItem(body: any) {
  return servicesCmsRepository.createItem({
    section: { connect: { id: body.sectionId } },
    title: body.title,
    description: body.description || null,
    icon: body.icon || null,
    image: body.image || null,
    url: body.url || null,
    isActive: body.isActive !== false,
    isFeatured: body.isFeatured === true,
    displayOrder: body.displayOrder || 0,
  });
}

export async function getItem(id: string) {
  return servicesCmsRepository.findItemById(id);
}

export async function updateItem(id: string, body: any) {
  return servicesCmsRepository.updateItem(id, {
    section: { connect: { id: body.sectionId } },
    title: body.title,
    description: body.description || null,
    icon: body.icon || null,
    image: body.image || null,
    url: body.url || null,
    isActive: body.isActive !== false,
    isFeatured: body.isFeatured === true,
    displayOrder: body.displayOrder || 0,
  });
}

export async function deleteItem(id: string) {
  return servicesCmsRepository.deleteItem(id);
}
