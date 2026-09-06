'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, ArrowLeft, Image as ImageIcon, Video, Upload } from 'lucide-react';
import Link from 'next/link';
import { Card, Button, LinkButton } from '@/components/admin/ui';

interface HeroSectionFormProps {
  heroId?: string;
}

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  mediaType: string;
  imageUrl: string;
  videoUrl: string;
  posterUrl: string;
  buttonText: string;
  buttonLink: string;
  sortOrder: number;
  isActive: boolean;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduledAt: string;
}

export default function HeroSectionForm({ heroId }: HeroSectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    description: '',
    mediaType: 'IMAGE',
    imageUrl: '',
    videoUrl: '',
    posterUrl: '',
    buttonText: '',
    buttonLink: '',
    sortOrder: 0,
    isActive: false,
    status: 'PUBLISHED',
    scheduledAt: '',
  });

  useEffect(() => {
    if (heroId) {
      fetchHero();
    }
  }, [heroId]);

  const fetchHero = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/hero/${heroId}`);
      const data = await response.json();
      
      if (data.heroSection) {
        setFormData({
          title: data.heroSection.title || '',
          subtitle: data.heroSection.subtitle || '',
          description: data.heroSection.description || '',
          mediaType: data.heroSection.mediaType || 'IMAGE',
          imageUrl: data.heroSection.imageUrl || '',
          videoUrl: data.heroSection.videoUrl || '',
          posterUrl: data.heroSection.posterUrl || '',
          buttonText: data.heroSection.buttonText || '',
          buttonLink: data.heroSection.buttonLink || '',
          sortOrder: data.heroSection.sortOrder || 0,
          isActive: data.heroSection.isActive || false,
          status: data.heroSection.status || 'PUBLISHED',
          scheduledAt: data.heroSection.scheduledAt
            ? new Date(data.heroSection.scheduledAt).toISOString().slice(0, 16)
            : '',
        });
      }
    } catch (error) {
      console.error('Error fetching hero:', error);
      alert('Failed to load hero section');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (field: string, file: File) => {
    if (!file) return;

    setUploading(field);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, [field]: data.url }));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Please enter a title');
      return;
    }

    if (formData.mediaType === 'IMAGE' && !formData.imageUrl) {
      alert('Please upload an image');
      return;
    }

    if (formData.mediaType === 'VIDEO' && !formData.videoUrl) {
      alert('Please upload a video');
      return;
    }

    setSaving(true);
    try {
      const url = heroId ? `/api/admin/hero/${heroId}` : '/api/admin/hero';
      const method = heroId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(heroId ? 'Hero section updated successfully!' : 'Hero section created successfully!');
        router.push('/admin/content/hero');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save hero section');
      }
    } catch (error) {
      console.error('Error saving hero:', error);
      alert('Failed to save hero section');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="Move forward. In every direction."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="GLOBAL ENGINEERING · BUILT FOR ETHIOPIA"
            />
            <p className="mt-1 text-xs text-gray-500">
              Small text displayed above the title
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="Explore the full Geely range..."
            />
          </div>
        </div>
      </Card>

      {/* Media */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Background Media</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="IMAGE"
                  checked={formData.mediaType === 'IMAGE'}
                  onChange={(e) => setFormData(prev => ({ ...prev, mediaType: e.target.value }))}
                  className="w-4 h-4 text-geely-blue"
                />
                <ImageIcon size={20} />
                <span>Image</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="VIDEO"
                  checked={formData.mediaType === 'VIDEO'}
                  onChange={(e) => setFormData(prev => ({ ...prev, mediaType: e.target.value }))}
                  className="w-4 h-4 text-geely-blue"
                />
                <Video size={20} />
                <span>Video</span>
              </label>
            </div>
          </div>

          {formData.mediaType === 'IMAGE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Image <span className="text-red-500">*</span>
              </label>
              
              {formData.imageUrl ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(formData.imageUrl, '_blank')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Eye size={16} />
                      View Full Size
                    </button>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('imageUrl', file);
                        }}
                        className="hidden"
                        disabled={uploading === 'imageUrl'}
                      />
                      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-geely-blue text-white rounded-lg hover:bg-navy">
                        <Upload size={16} />
                        Change Image
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('imageUrl', file);
                    }}
                    className="hidden"
                    disabled={uploading === 'imageUrl'}
                  />
                  <div className="flex items-center justify-center gap-3 px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-navy hover:bg-blue-50 transition-all">
                    {uploading === 'imageUrl' ? (
                      <>
                        <div className="w-6 h-6 border-3 border-geely-blue border-t-transparent rounded-full animate-spin" />
                        <span className="text-geely-blue font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={32} className="text-gray-400" />
                        <div>
                          <span className="block text-sm font-medium text-gray-900">
                            Click to upload background image
                          </span>
                          <span className="block text-xs text-gray-500 mt-1">
                            Recommended: 1920x560px (JPEG, PNG, WebP)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          )}

          {formData.mediaType === 'VIDEO' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Video <span className="text-red-500">*</span>
                </label>
                
                {formData.videoUrl ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <video 
                        src={formData.videoUrl} 
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        controls
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('videoUrl', file);
                        }}
                        className="hidden"
                        disabled={uploading === 'videoUrl'}
                      />
                      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-geely-blue text-white rounded-lg hover:bg-navy">
                        <Upload size={16} />
                        Change Video
                      </div>
                    </label>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('videoUrl', file);
                      }}
                      className="hidden"
                      disabled={uploading === 'videoUrl'}
                    />
                    <div className="flex items-center justify-center gap-3 px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-navy hover:bg-blue-50 transition-all">
                      {uploading === 'videoUrl' ? (
                        <>
                          <div className="w-6 h-6 border-3 border-geely-blue border-t-transparent rounded-full animate-spin" />
                          <span className="text-geely-blue font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Video size={32} className="text-gray-400" />
                          <div>
                            <span className="block text-sm font-medium text-gray-900">
                              Click to upload background video
                            </span>
                            <span className="block text-xs text-gray-500 mt-1">
                              MP4 format recommended (max 50MB)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Poster (Thumbnail)
                </label>
                
                {formData.posterUrl ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img 
                        src={formData.posterUrl} 
                        alt="Poster"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, posterUrl: '' }))}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('posterUrl', file);
                        }}
                        className="hidden"
                        disabled={uploading === 'posterUrl'}
                      />
                      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                        <Upload size={14} />
                        Change Poster
                      </div>
                    </label>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('posterUrl', file);
                      }}
                      className="hidden"
                      disabled={uploading === 'posterUrl'}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all">
                      {uploading === 'posterUrl' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-gray-600 text-sm font-medium">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-gray-400" />
                          <span className="text-sm text-gray-600">Click to upload poster image (optional)</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Image shown before video loads
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Call to Action */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Call to Action Button</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={formData.buttonText}
              onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="Explore Models"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Link
            </label>
            <input
              type="text"
              value={formData.buttonLink}
              onChange={(e) => setFormData(prev => ({ ...prev, buttonLink: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="/models"
            />
          </div>
        </div>
      </Card>

      {/* Settings */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              min="0"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first (0 = first, 1 = second, etc.)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-geely-blue border-gray-300 rounded focus:ring-geely-blue"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Show on homepage (active)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publication Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as FormData['status'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Independent of &quot;Show on homepage&quot; above — both must allow it for the hero to appear.
            </p>
          </div>

          {formData.status === 'SCHEDULED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publish At
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6">
        <Link
          href="/admin/content/hero"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
          Cancel
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Eye size={18} />
            Preview Homepage
          </a>
          <button
            type="submit"
            disabled={saving || uploading !== null}
            className="flex items-center gap-2 bg-geely-blue text-white px-6 py-2 rounded-lg hover:bg-navy disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : heroId ? 'Update Hero' : 'Create Hero'}
          </button>
        </div>
      </div>
    </form>
  );
}
