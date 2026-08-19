/**
 * Admin vehicle form validation schemas.
 * Uses inline validators until Zod is added.
 */

export interface VehicleFormData {
  name: string;
  slug: string;
  model: string;
  year: number;
  categoryId: string;
  basePrice: number;
  discountAmount?: number;
  discountType?: 'fixed' | 'percentage';
  description?: string;
  isFeatured: boolean;
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  displayOrder: number;
  heroImageUrl?: string;
}

export function validateVehicleForm(data: Partial<VehicleFormData>): string[] {
  const errors: string[] = [];

  if (!data.name?.trim())       errors.push('Name is required.');
  if (!data.slug?.trim())       errors.push('Slug is required.');
  if (!data.model?.trim())      errors.push('Model is required.');
  if (!data.categoryId?.trim()) errors.push('Category is required.');
  if (!data.year || data.year < 2000 || data.year > 2100)
    errors.push('Valid year (2000–2100) is required.');
  if (!data.basePrice || data.basePrice <= 0)
    errors.push('Base price must be greater than 0.');

  return errors;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
