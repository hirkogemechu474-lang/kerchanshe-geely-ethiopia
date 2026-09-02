'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';
import { PageHeader, LinkButton, Button, Card } from '@/components/admin/ui';

interface ServiceSection {
  id?: string;
  title: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface ServiceSectionFormProps {
  section?: ServiceSection;
  isEdit?: boolean;
}

export default function ServiceSectionForm({ section, isEdit = false }: ServiceSectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: section?.title || '',
    slug: section?.slug || '',
    description: section?.description || '',
    iconUrl: section?.iconUrl || '',
    isActive: section?.isActive !== false,
    displayOrder: section?.displayOrder?.toString() || '0',
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: isEdit ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit 
        ? `/api/admin/services/sections/${section?.id}` 
        : `/api/admin/services/sections`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          description: formData.description || null,
          iconUrl: formData.iconUrl || null,
          isActive: formData.isActive,
          displayOrder: parseInt(formData.displayOrder) || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/services-menu');
        router.refresh();
      } else {
        setError(data.error || 'Failed to save section');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all items in this section.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/services/sections/${section?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/services-menu');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete section');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/services-menu" className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <PageHeader
            title={isEdit ? 'Edit Section' : 'New Section'}
            description={isEdit ? 'Update section information' : 'Create a new menu section for the Services dropdown'}
            actions={
              isEdit && (
                <Button variant="danger" onClick={handleDelete} disabled={loading}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )
            }
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="e.g., Sales, Service & Parts, Support"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the main heading for this section in the Services menu
              </p>
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
                placeholder="e.g., sales, service-parts"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL-friendly identifier (lowercase, no spaces)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                rows={2}
                placeholder="Brief description of this section (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <FileUpload
                value={formData.iconUrl || undefined}
                onChange={(v) => setFormData({ ...formData, iconUrl: v as string })}
                label="section icon"
                previewHeight="h-20"
                helperText="Optional icon to display next to the section title (SVG or PNG recommended)"
              />
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
              <p className="mt-1 text-xs text-gray-500">
                Lower numbers appear first (0 = first position)
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Active</span>
                  <p className="text-xs text-gray-500">
                    Only active sections appear in the Services menu
                  </p>
                </div>
              </label>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-geely-blue text-white px-6 py-3 rounded-lg hover:bg-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : isEdit ? 'Update Section' : 'Create Section'}
          </button>

          <Link
            href="/admin/services-menu"
            className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
