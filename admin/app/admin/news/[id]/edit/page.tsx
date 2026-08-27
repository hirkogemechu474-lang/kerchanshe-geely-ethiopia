'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Save, FileText, Tag, Calendar, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, Button, PageHeader } from '@/components/admin/ui';

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  content: string;
  imageUrl: string | null;
  excerpt: string | null;
  status: string;
  publishDate: string | null;
}

export default function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [originalArticle, setOriginalArticle] = useState<NewsArticle | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'company',
    content: '',
    author: '',
    image: '',
    excerpt: '',
    status: 'draft',
    publishDate: '',
  });

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/news/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const article = await response.json();
      setOriginalArticle(article);
      
      // Convert publishDate to datetime-local format
      const publishDate = article.publishDate 
        ? new Date(article.publishDate).toISOString().slice(0, 16)
        : '';

      setFormData({
        title: article.title || '',
        category: article.category || 'company',
        content: article.content || '',
        author: article.author || '',
        image: article.imageUrl || '',
        excerpt: article.excerpt || '',
        status: article.status || 'draft',
        publishDate: publishDate,
      });

      if (article.imageUrl) {
        setImagePreview(article.imageUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'news');

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setFormData(prev => ({ ...prev, image: data.url }));
      setImagePreview(data.url);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl: formData.image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update news article');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/news');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update news article');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-geely-blue mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!originalArticle) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">Article not found</p>
          <Link
            href="/admin/news"
            className="mt-4 inline-block text-geely-blue hover:underline"
          >
            Back to News
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit News Article" description="Update and republish article" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          News article updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card padding="none">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Article Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="e.g., Geely Opens New Showroom in Addis Ababa"
            />
          </div>

          {/* Category and Author */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              >
                <option value="company">Company News</option>
                <option value="product">Product Updates</option>
                <option value="technology">Technology</option>
                <option value="events">Events</option>
                <option value="awards">Awards & Recognition</option>
                <option value="community">Community</option>
                <option value="press">Press Release</option>
              </select>
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                Author *
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                placeholder="e.g., Marketing Team"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              Article Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="Brief summary of the article (optional - will be auto-generated if left empty)"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Article Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="Write your article content here..."
            />
            <p className="mt-1 text-xs text-gray-500">Support for rich text editor coming soon</p>
          </div>

          {/* Featured Image */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-2" />
              Featured Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload new image (max 10MB) - PNG, JPG, JPEG, GIF supported
            </p>
            
            {(formData.image || imagePreview) && (
              <div className="mt-4">
                <p className="text-xs text-gray-600 mb-2">Current image:</p>
                <img
                  src={imagePreview || formData.image}
                  alt="Preview"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Status and Publish Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Publication Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Publish Date
              </label>
              <input
                type="datetime-local"
                id="publishDate"
                name="publishDate"
                value={formData.publishDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Leave empty to use current date</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-xl">
          <Link
            href="/admin/news"
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Updating...' : 'Update Article'}
          </Button>
        </div>
        </Card>
      </form>
    </div>
  );
}