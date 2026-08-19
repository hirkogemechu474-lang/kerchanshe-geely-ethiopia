'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

interface ServicePageFormProps {
  page?: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    excerpt: string | null;
    heroImage: string | null;
    heroVideo: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    isPublished: boolean;
  };
  mode: 'create' | 'edit';
}

export default function ServicePageForm({ page, mode }: ServicePageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    content: page?.content || '',
    excerpt: page?.excerpt || '',
    heroImage: page?.heroImage || '',
    heroVideo: page?.heroVideo || '',
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
      metaTitle: formData.metaTitle || title,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/admin/services/pages'
        : `/api/admin/services/pages/${page?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/services-menu/pages');
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
      const response = await fetch(`/api/admin/services/pages/${page?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/services-menu/pages');
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
          placeholder="e.g., Test Drive Services"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug (URL) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">/services/</span>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
            required
            placeholder="test-drive"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Auto-generated from title. URL: /services/{formData.slug || 'your-slug'}
        </p>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Excerpt / Summary
        </label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Brief summary of this service page (used in previews and search results)"
          rows={3}
          maxLength={200}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex justify-between mt-1">
          <p className="text-sm text-gray-500">Short summary for previews</p>
          <p className="text-sm text-gray-400">{formData.excerpt.length}/200</p>
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Content
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Write your page content here... (HTML and markdown supported)"
          rows={12}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          Main content for the service page. HTML and markdown are supported.
        </p>
      </div>

      {/* Hero Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h3>
        
        {/* Hero Image */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hero Image
          </label>
          <FileUpload
            value={formData.heroImage || undefined}
            onChange={(v) => setFormData({ ...formData, heroImage: v as string })}
            label="service hero image"
            previewHeight="h-40"
          />
        </div>

        {/* Hero Video */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hero Video URL
          </label>
          <input
            type="url"
            value={formData.heroVideo}
            onChange={(e) => setFormData({ ...formData, heroVideo: e.target.value })}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional: YouTube embed URL (video takes priority over image)
          </p>
        </div>
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
            placeholder="SEO title (auto-fills from page title)"
            maxLength={60}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-between mt-1">
            <p className="text-sm text-gray-500">Displayed in search results</p>
            <p className={`text-sm ${formData.metaTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
              {formData.metaTitle.length}/60
            </p>
          </div>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
          </label>
          <textarea
            value={formData.metaDescription}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            placeholder="Brief description for search engines (160 characters recommended)"
            rows={3}
            maxLength={160}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-between mt-1">
            <p className="text-sm text-gray-500">Displayed in search results</p>
            <p className={`text-sm ${formData.metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
              {formData.metaDescription.length}/160
            </p>
          </div>
        </div>
      </div>

      {/* Publish Toggle */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Published</label>
            <p className="text-sm text-gray-500">
              Make this page visible on the public website
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
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
