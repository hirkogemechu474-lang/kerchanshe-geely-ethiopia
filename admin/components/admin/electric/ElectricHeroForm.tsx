'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import MediaUploadComponent from './MediaUploadComponent';
import { Button } from '@/components/admin/ui';

interface HeroSection {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  heroVideo: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  ctaSecondaryButtonText: string;
  ctaSecondaryButtonLink: string;
  backgroundGradient: string;
  isPublished: boolean;
}

interface ElectricHeroFormProps {
  heroId?: string;
}

export default function ElectricHeroForm({ heroId }: ElectricHeroFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!heroId);
  const [submitting, setSubmitting] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');
  const [heroVideo, setHeroVideo] = useState<string>('');

  const [formData, setFormData] = useState<HeroSection>({
    id: '',
    heroTitle: 'Electric Vehicles by Geely',
    heroSubtitle: 'THE FUTURE OF MOBILITY',
    heroDescription: 'Experience the future of driving with Geely\'s advanced electric vehicles. Zero emissions, lower running costs, and cutting-edge technology for Ethiopian roads.',
    heroImage: '',
    heroVideo: '',
    ctaButtonText: 'Explore Our Electric Vehicles',
    ctaButtonLink: '/electric/models',
    ctaSecondaryButtonText: 'Book Test Drive',
    ctaSecondaryButtonLink: '/test-drive',
    backgroundGradient: 'from-green-600 via-green-500 to-blue-500',
    isPublished: true,
  });

  useEffect(() => {
    if (heroId) {
      fetchHero();
    }
  }, [heroId]);

  const fetchHero = async () => {
    try {
      const response = await fetch(`/api/admin/electric/hero/${heroId}`);
      const data = await response.json();
      setFormData(data.hero);
      setHeroImage(data.hero.heroImage || '');
      setHeroVideo(data.hero.heroVideo || '');
    } catch (error) {
      console.error('Error fetching hero:', error);
      alert('Failed to load hero section');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        heroImage,
        heroVideo,
      };

      const url = heroId
        ? `/api/admin/electric/hero/${heroId}`
        : '/api/admin/electric/hero';

      const method = heroId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        router.push('/admin/electric');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save hero section');
      }
    } catch (error) {
      console.error('Error saving hero:', error);
      alert('Failed to save hero section');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading hero section...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Content */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section Text</h3>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle/Badge *</label>
          <input
            type="text"
            name="heroSubtitle"
            value={formData.heroSubtitle}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., THE FUTURE OF MOBILITY"
          />
          <p className="text-xs text-gray-500 mt-1">Usually in all caps, appears above the main title</p>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Title *</label>
          <input
            type="text"
            name="heroTitle"
            value={formData.heroTitle}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Electric Vehicles by Geely"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="heroDescription"
            value={formData.heroDescription}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the hero section content"
          />
        </div>

        {/* Call-to-Action Buttons */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Call-to-Action Buttons</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Text</label>
          <input
            type="text"
            name="ctaButtonText"
            value={formData.ctaButtonText}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Explore Our Electric Vehicles"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Link</label>
          <input
            type="text"
            name="ctaButtonLink"
            value={formData.ctaButtonLink}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., /electric/models"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Text</label>
          <input
            type="text"
            name="ctaSecondaryButtonText"
            value={formData.ctaSecondaryButtonText}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Book Test Drive"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Link</label>
          <input
            type="text"
            name="ctaSecondaryButtonLink"
            value={formData.ctaSecondaryButtonLink}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., /test-drive"
          />
        </div>

        {/* Background Gradient */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Background Styling</h3>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Gradient Style</label>
          <select
            name="backgroundGradient"
            value={formData.backgroundGradient}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="from-green-600 via-green-500 to-blue-500">Green to Blue (Default)</option>
            <option value="from-blue-600 via-blue-500 to-cyan-500">Blue to Cyan</option>
            <option value="from-green-600 to-emerald-500">Green to Emerald</option>
            <option value="from-purple-600 via-pink-500 to-red-500">Purple to Red</option>
            <option value="from-slate-700 via-slate-600 to-slate-500">Gray (Dark)</option>
          </select>
        </div>

        {/* Media */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Assets</h3>
        </div>

        {/* Hero Image */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image *</label>
          <MediaUploadComponent
            mediaType="image"
            currentUrl={heroImage}
            onSelect={(url) => {
              setHeroImage(url);
              setFormData(prev => ({ ...prev, heroImage: url }));
            }}
            onRemove={() => {
              setHeroImage('');
              setFormData(prev => ({ ...prev, heroImage: '' }));
            }}
            category="electric-hero"
          />
        </div>

        {/* Hero Video */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Hero Video (Optional)</label>
          <MediaUploadComponent
            mediaType="video"
            currentUrl={heroVideo}
            onSelect={(url) => {
              setHeroVideo(url);
              setFormData(prev => ({ ...prev, heroVideo: url }));
            }}
            onRemove={() => {
              setHeroVideo('');
              setFormData(prev => ({ ...prev, heroVideo: '' }));
            }}
            category="electric-hero"
          />
        </div>

        {/* Publishing */}
        <div className="lg:col-span-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Publish Hero Section</span>
          </label>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <Button type="submit" disabled={submitting}>
          <Save className="w-4 h-4" />
          {submitting ? 'Saving...' : 'Save Hero Section'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Preview */}
      <div className="mt-8 pt-8 border-t">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div className={`bg-gradient-to-br ${formData.backgroundGradient} text-white py-12 rounded-lg overflow-hidden`}>
          <div className="max-w-[1280px] mx-auto px-10">
            <div className="max-w-2xl">
              <div className="text-sm tracking-widest text-opacity-80 font-bold mb-3 text-white text-opacity-75">
                {formData.heroSubtitle}
              </div>
              <h1 className="text-5xl font-bold mb-4">
                {formData.heroTitle}
              </h1>
              <p className="text-lg text-opacity-90 text-white mb-6">
                {formData.heroDescription}
              </p>
              <div className="flex gap-4">
                <button className="bg-white text-blue-600 font-bold px-6 py-2 rounded hover:opacity-90">
                  {formData.ctaButtonText}
                </button>
                <button className="border-2 border-white text-white font-semibold px-6 py-2 rounded hover:bg-white hover:bg-opacity-10">
                  {formData.ctaSecondaryButtonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
