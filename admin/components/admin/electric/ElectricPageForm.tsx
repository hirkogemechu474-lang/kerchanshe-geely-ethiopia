'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ElectricPageFormProps {
  pageId?: string;
  page?: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    isPublished: boolean;
  };
  mode?: 'create' | 'edit';
}

export default function ElectricPageForm({ page, pageId, mode = 'create' }: ElectricPageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    content: page?.content || '',
    metaTitle: page?.metaTitle || '',
    metaDescription: page?.metaDescription || '',
    isPublished: page?.isPublished !== undefined ? page.isPublished : false,
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
      metaTitle: mode === 'create' && !formData.metaTitle ? title : formData.metaTitle,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/admin/electric/pages'
        : `/api/admin/electric/pages/${page?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/electric/pages');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save page');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/electric/pages/${page?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/electric/pages');
        router.refresh();
      } else {
        alert('Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    } finally {
      setLoading(false);
    }
  };

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
            Delete Page
          </button>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          placeholder="e.g., Electric Vehicle Benefits, Charging Solutions"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">/electric/</span>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
            required
            placeholder="benefits"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Auto-generated from title. This will be the page URL.
        </p>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Content
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter your page content here... (HTML is supported)"
          rows={12}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          You can use HTML tags for formatting (e.g., &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;)
        </p>
      </div>

      {/* SEO Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h3>
        
        {/* Meta Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Title
          </label>
          <input
            type="text"
            value={formData.metaTitle}
            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
            placeholder="SEO title for search engines"
            maxLength={60}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Recommended: 50-60 characters. Defaults to page title if empty.
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
          </label>
          <textarea
            value={formData.metaDescription}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            placeholder="Brief description for search engine results"
            maxLength={160}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Recommended: 150-160 characters. This appears in search results.
          </p>
        </div>
      </div>

      {/* Publish Toggle */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Published</label>
            <p className="text-sm text-gray-500">
              Make this page visible to the public
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isPublished ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isPublished ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {!formData.isPublished && (
          <p className="mt-2 text-sm text-amber-600">
            ⚠️ This page is in draft mode and won't be visible to visitors
          </p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </span>
          ) : mode === 'create' ? (
            'Create Page'
          ) : (
            'Update Page'
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
