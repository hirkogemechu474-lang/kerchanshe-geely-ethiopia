'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import FileUpload from '@/components/admin/FileUpload';

interface Content {
  id: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroBannerImage: string | null;
  heroBackgroundImage: string | null;
  introHeading: string | null;
  introDescription: string | null;
  ctaTitle: string | null;
  ctaDescription: string | null;
  ctaButtonText: string | null;
  ctaButtonLink: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

export default function PartsContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<Content>({
    id: '',
    heroTitle: '',
    heroSubtitle: '',
    heroBannerImage: '',
    heroBackgroundImage: '',
    introHeading: '',
    introDescription: '',
    ctaTitle: '',
    ctaDescription: '',
    ctaButtonText: '',
    ctaButtonLink: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/parts/admin/parts/content');
      const data = await response.json();
      if (data.content) {
        setFormData({ ...formData, ...data.content });
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/parts/admin/parts/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save content');
      }

      setMessage({ type: 'success', text: 'Content saved successfully. The /parts page will update immediately.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save content' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Content) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-geely-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/parts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parts Page Content</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the hero, introduction, CTA and SEO of the /parts page
          </p>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Hero Section</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
              <input
                type="text"
                value={formData.heroTitle || ''}
                onChange={handleChange('heroTitle')}
                placeholder="Genuine Geely Parts & Accessories"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
              <input
                type="text"
                value={formData.heroSubtitle || ''}
                onChange={handleChange('heroSubtitle')}
                placeholder="100% authentic Geely parts with warranty"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4" /> Banner Image
                </label>
                <FileUpload
                  value={formData.heroBannerImage || undefined}
                  onChange={(v) => setFormData(prev => ({ ...prev, heroBannerImage: v as string }))}
                  label="parts banner"
                  helperText="Upload a banner image (JPG, PNG, WEBP)"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4" /> Background Image
                </label>
                <FileUpload
                  value={formData.heroBackgroundImage || undefined}
                  onChange={(v) => setFormData(prev => ({ ...prev, heroBackgroundImage: v as string }))}
                  label="parts background"
                  helperText="Upload a background image (JPG, PNG, WEBP)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Introduction</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heading</label>
              <input
                type="text"
                value={formData.introHeading || ''}
                onChange={handleChange('introHeading')}
                placeholder="Quality parts for lasting performance"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.introDescription || ''}
                onChange={handleChange('introDescription')}
                rows={4}
                placeholder="Maintain your Geely's performance and safety with genuine spare parts..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Call-to-Action Section</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={formData.ctaTitle || ''}
                onChange={handleChange('ctaTitle')}
                placeholder="Need Help Finding the Right Part?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.ctaDescription || ''}
                onChange={handleChange('ctaDescription')}
                rows={3}
                placeholder="Our parts specialists can help you identify the correct parts..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                value={formData.ctaButtonText || ''}
                onChange={handleChange('ctaButtonText')}
                placeholder="Contact Parts Department"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
              <input
                type="text"
                value={formData.ctaButtonLink || ''}
                onChange={handleChange('ctaButtonLink')}
                placeholder="/contact or tel:+251110000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">SEO Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={handleChange('metaTitle')}
                maxLength={60}
                placeholder="Genuine Geely Spare Parts | Geely Ethiopia"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
              <textarea
                value={formData.metaDescription || ''}
                onChange={handleChange('metaDescription')}
                rows={3}
                maxLength={160}
                placeholder="Browse genuine Geely spare parts and accessories with manufacturer warranty..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <input
                type="text"
                value={formData.metaKeywords || ''}
                onChange={handleChange('metaKeywords')}
                placeholder="Geely parts, Geely spare parts Ethiopia, genuine parts"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-geely-blue text-white py-3 rounded-lg hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Content'}
          </button>
          <Link
            href="/admin/parts"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
