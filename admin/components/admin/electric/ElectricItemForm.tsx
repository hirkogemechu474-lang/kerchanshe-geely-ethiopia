'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';
import { Button } from '@/components/admin/ui';

interface ElectricSection {
  id: string;
  title: string;
  slug: string;
}

interface ElectricPage {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
}

interface ElectricItemFormProps {
  item?: {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    image: string | null;
    url: string | null;
    displayOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    sectionId: string;
    pageId: string | null;
  };
  mode: 'create' | 'edit';
}

export default function ElectricItemForm({ item, mode }: ElectricItemFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<ElectricSection[]>([]);
  const [pages, setPages] = useState<ElectricPage[]>([]);
  
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    icon: item?.icon || '',
    image: item?.image || '',
    url: item?.url || '',
    displayOrder: item?.displayOrder || 0,
    isActive: item?.isActive !== undefined ? item.isActive : true,
    isFeatured: item?.isFeatured !== undefined ? item.isFeatured : false,
    sectionId: item?.sectionId || searchParams.get('sectionId') || '',
    pageId: item?.pageId || '',
  });

  useEffect(() => {
    fetchSections();
    fetchPages();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/electric/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/admin/electric/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/admin/electric/items'
        : `/api/admin/electric/items/${item?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pageId: formData.pageId || null,
        }),
      });

      if (response.ok) {
        router.push('/admin/electric');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/electric/items/${item?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/electric');
        router.refresh();
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'edit' && (
        <div className="flex justify-end">
          <Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>
            Delete Item
          </Button>
        </div>
      )}

      {/* Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.sectionId}
          onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Select a section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="e.g., Geometry EX5, Charging Map, Cost Calculator"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Premium Electric SUV with 520km range"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icon (Lucide Icon Name)
        </label>
        <input
          type="text"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          placeholder="e.g., Car, MapPin, Calculator, Zap"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Lucide icon name for the menu item
        </p>
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Featured Image
        </label>
        <FileUpload
          value={formData.image || undefined}
          onChange={(v) => setFormData({ ...formData, image: v as string })}
          label="electric item image"
          previewHeight="h-32"
        />
      </div>

      {/* Page Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Linked Page
        </label>
        <select
          value={formData.pageId}
          onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">No linked page</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title} ({page.slug}) {!page.isPublished && '- Draft'}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Link this item to an existing page, or leave empty for external URL
        </p>
      </div>

      {/* External URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          External URL
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://example.com/page"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Use this if not linking to an internal page
        </p>
      </div>

      {/* Display Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Order
        </label>
        <input
          type="number"
          value={formData.displayOrder}
          onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Lower numbers appear first (0 = first, 1 = second, etc.)
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-4 border-t pt-6">
        {/* Featured */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Featured</label>
            <p className="text-sm text-gray-500">
              Highlight this item in the menu
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isFeatured ? 'bg-yellow-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isFeatured ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Active */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Active</label>
            <p className="text-sm text-gray-500">
              Show this item in the menu
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isActive ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <Button type="submit" disabled={loading} className="flex-1 py-3">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </span>
          ) : mode === 'create' ? (
            'Create Item'
          ) : (
            'Update Item'
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading} className="py-3">
          Cancel
        </Button>
      </div>
    </form>
  );
}