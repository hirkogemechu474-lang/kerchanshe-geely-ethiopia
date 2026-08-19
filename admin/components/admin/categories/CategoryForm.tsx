'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
  heroImageUrl: string | null;
  heroVideoUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  brandId: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface CategoryFormProps {
  category?: Category;
  brands: Brand[];
  isEdit?: boolean;
}

export default function CategoryForm({ category, brands, isEdit = false }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    iconUrl: category?.iconUrl || '',
    heroImageUrl: category?.heroImageUrl || '',
    heroVideoUrl: category?.heroVideoUrl || '',
    metaTitle: category?.metaTitle || '',
    metaDescription: category?.metaDescription || '',
    brandId: category?.brandId || '',
    isActive: category?.isActive !== false,
    displayOrder: category?.displayOrder?.toString() || '0',
  });

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: isEdit ? formData.slug : generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        iconUrl: formData.iconUrl || null,
        heroImageUrl: formData.heroImageUrl || null,
        heroVideoUrl: formData.heroVideoUrl || null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        brandId: formData.brandId || null,
        isActive: formData.isActive,
        displayOrder: parseInt(formData.displayOrder) || 0,
      };

      const url = isEdit ? `/api/admin/categories/${category?.id}` : `/api/admin/categories`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/categories');
        router.refresh();
      } else {
        setError(data.error || 'Failed to save category');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${category?.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/categories');
        router.refresh();
      } else {
        setError(data.error || 'Failed to delete category');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/categories" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Category' : 'Add New Category'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit ? 'Update vehicle category information' : 'Create a new vehicle category'}
            </p>
          </div>
        </div>
        {isEdit && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g., SUVs, Sedans, Electric"
              />
              <p className="mt-1 text-xs text-gray-500">This will be displayed to customers</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g., suvs, sedans, electric"
              />
              <p className="mt-1 text-xs text-gray-500">Used in URL: /models/{formData.slug || 'category-slug'}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="Describe this vehicle category..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">No Brand (General)</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                min="0"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Image
              </label>
              <FileUpload
                value={formData.imageUrl || undefined}
                onChange={(v) => setFormData({ ...formData, imageUrl: v as string })}
                label="category image"
                previewHeight="h-28"
              />
              <p className="mt-1 text-xs text-gray-500">Main category image for listings</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <FileUpload
                value={formData.iconUrl || undefined}
                onChange={(v) => setFormData({ ...formData, iconUrl: v as string })}
                label="category icon"
                previewHeight="h-20"
                helperText="Small icon for menus (SVG or PNG recommended)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Image
              </label>
              <FileUpload
                value={formData.heroImageUrl || undefined}
                onChange={(v) => setFormData({ ...formData, heroImageUrl: v as string })}
                label="category hero image"
                previewHeight="h-32"
              />
              <p className="mt-1 text-xs text-gray-500">Large banner image for category page header</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Video (Optional)
              </label>
              <FileUpload
                value={formData.heroVideoUrl || undefined}
                onChange={(v) => setFormData({ ...formData, heroVideoUrl: v as string })}
                label="category hero video"
                accept=".mp4,.webm,.mov,.avi"
                previewHeight="h-32"
                maxSizeMB={50}
              />
              <p className="mt-1 text-xs text-gray-500">Video will play instead of hero image (MP4 recommended)</p>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Geely SUVs - Premium Sport Utility Vehicles"
                maxLength={60}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.metaTitle.length}/60 characters (optimal: 50-60)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                rows={2}
                placeholder="Explore Geely's range of premium SUVs. Advanced safety, modern design, and exceptional value."
                maxLength={160}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.metaDescription.length}/160 characters (optimal: 150-160)
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Active</span>
              <p className="text-xs text-gray-500">Category will be visible to customers when active</p>
            </div>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
          </button>

          <Link
            href="/admin/categories"
            className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
