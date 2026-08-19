'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/admin/ui';

interface ElectricSectionFormProps {
  section?: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    icon: string | null;
    displayOrder: number;
    isActive: boolean;
  };
  mode: 'create' | 'edit';
}

export default function ElectricSectionForm({ section, mode }: ElectricSectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: section?.title || '',
    slug: section?.slug || '',
    description: section?.description || '',
    icon: section?.icon || '',
    displayOrder: section?.displayOrder || 0,
    isActive: section?.isActive !== undefined ? section.isActive : true,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: mode === 'create' ? generateSlug(title) : formData.slug,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/admin/electric/sections'
        : `/api/admin/electric/sections/${section?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/electric');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save section');
      }
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all items in this section.')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/electric/sections/${section?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/electric');
        router.refresh();
      } else {
        alert('Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'edit' && (
        <div className="flex justify-end">
          <Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>
            Delete Section
          </Button>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          placeholder="e.g., Models, Charging, Benefits"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug (URL) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">/electric/</span>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
            required
            placeholder="models"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Auto-generated from title. Used for URLs and identification.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Electric vehicle models and specifications"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional description for admin reference
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
          placeholder="e.g., Car, Zap, Award, MapPin"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional: Lucide icon name for the section (Car, Zap, Award, etc.)
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

      {/* Active Toggle */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Active</label>
            <p className="text-sm text-gray-500">
              Show this section in the electric menu
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
            'Create Section'
          ) : (
            'Update Section'
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading} className="py-3">
          Cancel
        </Button>
      </div>
    </form>
  );
}