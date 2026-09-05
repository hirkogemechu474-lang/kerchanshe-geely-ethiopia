'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

interface ServiceSection {
  id: string;
  title: string;
  slug: string;
}

interface ServiceItemFormProps {
  item?: {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    image: string | null;
    url: string | null;
    pageId: string | null;
    displayOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    sectionId: string;
  };
  mode: 'create' | 'edit';
}

export default function ServiceItemForm({ item, mode }: ServiceItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    icon: item?.icon || '',
    image: item?.image || '',
    url: item?.url || '',
    pageId: item?.pageId || '',
    displayOrder: item?.displayOrder || 0,
    isActive: item?.isActive !== undefined ? item.isActive : true,
    isFeatured: item?.isFeatured || false,
    sectionId: item?.sectionId || '',
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/services-menu/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoadingSections(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/services-menu/items'
        : `/api/services-menu/items/${item?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          displayOrder: parseInt(formData.displayOrder.toString()),
          pageId: formData.pageId || null,
        }),
      });

      if (response.ok) {
        router.push('/admin/services-menu');
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
      const response = await fetch(`/api/services-menu/items/${item?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/services-menu');
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

  if (loadingSections) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-geely-blue" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'edit' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Delete Item
          </button>
        </div>
      )}

      {/* Section Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.sectionId}
          onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        >
          <option value="">Select a section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </select>
        {sections.length === 0 && (
          <p className="mt-2 text-sm text-amber-600">
            No sections available. Please create a section first.
          </p>
        )}
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
          placeholder="e.g., Test Drive"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
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
          placeholder="e.g., Book a test drive today"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Short description displayed in the menu
        </p>
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
          placeholder="e.g., Car, Wrench, Shield, Phone"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional: Lucide icon name (Car, Wrench, Shield, Phone, etc.)
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
          label="service item image"
          previewHeight="h-32"
        />
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL / Link
        </label>
        <input
          type="text"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="/services/test-drive or https://external-link.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Link to internal page (/services/test-drive) or external URL
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Lower numbers appear first (0 = first, 1 = second, etc.)
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Active</label>
            <p className="text-sm text-gray-500">Show this item in the menu</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isActive ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Featured</label>
            <p className="text-sm text-gray-500">Highlight this item in the menu</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isFeatured ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isFeatured ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading || !formData.sectionId}
          className="flex-1 bg-geely-blue text-white py-3 rounded-lg hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
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
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
