'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, FolderOpen } from 'lucide-react';
import MediaBrowser from './MediaBrowser';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  onHeroImageChange?: (url: string) => void;
  onHeroVideoChange?: (url: string) => void;
}

export default function ImageUpload({ 
  images, 
  onChange,
  heroImageUrl,
  heroVideoUrl,
  onHeroImageChange,
  onHeroVideoChange
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [showHeroImageBrowser, setShowHeroImageBrowser] = useState(false);
  const [showHeroVideoBrowser, setShowHeroVideoBrowser] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'vehicle');
        formData.append('altText', file.name);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        return result.file.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedUrls]);
      
      alert('Images uploaded successfully!');
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const setAsPrimary = (index: number) => {
    const newImages = [...images];
    const [primaryImage] = newImages.splice(index, 1);
    newImages.unshift(primaryImage);
    onChange(newImages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Images & Media</h2>
        <p className="text-sm text-gray-500">
          Upload high-quality images and set hero media for the vehicle detail page.
        </p>
      </div>

      {/* Hero Media Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Hero Media (Vehicle Detail Page)</h3>
        <p className="text-sm text-gray-600">
          Select a hero image or video to display prominently on the vehicle detail page
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hero Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Image
            </label>
            <div className="space-y-2">
              {heroImageUrl && (
                <div className="relative aspect-video rounded-lg border-2 border-gray-200 overflow-hidden">
                  <img
                    src={heroImageUrl}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onHeroImageChange?.('')}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowHeroImageBrowser(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <FolderOpen size={20} />
                <span className="text-sm font-medium">
                  {heroImageUrl ? 'Change Hero Image' : 'Select Hero Image'}
                </span>
              </button>
            </div>
          </div>

          {/* Hero Video */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Video (Optional)
            </label>
            <div className="space-y-2">
              {heroVideoUrl && (
                <div className="relative aspect-video rounded-lg border-2 border-gray-200 overflow-hidden">
                  <video
                    src={heroVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onHeroVideoChange?.('')}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowHeroVideoBrowser(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Video size={20} />
                <span className="text-sm font-medium">
                  {heroVideoUrl ? 'Change Hero Video' : 'Select Hero Video'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Images */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Gallery Images</h3>
        
        {/* Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Upload New Images
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>
              </div>
            </label>
          </div>

          <button
            onClick={() => setShowImageBrowser(true)}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Browse Media Library
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Select from uploaded files
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg border-2 border-gray-200 overflow-hidden group"
              >
                <img
                  src={image}
                  alt={`Vehicle ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                    Primary
                  </div>
                )}
                
                {/* Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index !== 0 && (
                    <button
                      onClick={() => setAsPrimary(index)}
                      className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded hover:bg-gray-100 transition-colors"
                    >
                      Set as Primary
                    </button>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No images uploaded yet</p>
          </div>
        )}
      </div>

      {/* Guidelines */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Image Guidelines</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use high-resolution images (minimum 1200x800 pixels)</li>
          <li>• Include exterior shots from multiple angles</li>
          <li>• Add interior photos showing dashboard and seating</li>
          <li>• Hero media displays prominently on the vehicle detail page</li>
          <li>• Ensure good lighting and clean background</li>
        </ul>
      </div>

      {/* Media Browsers */}
      <MediaBrowser
        isOpen={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onSelect={(url) => onChange([...images, url])}
        fileType="image"
        title="Select Image from Library"
      />

      <MediaBrowser
        isOpen={showHeroImageBrowser}
        onClose={() => setShowHeroImageBrowser(false)}
        onSelect={(url) => onHeroImageChange?.(url)}
        fileType="image"
        title="Select Hero Image"
      />

      <MediaBrowser
        isOpen={showHeroVideoBrowser}
        onClose={() => setShowHeroVideoBrowser(false)}
        onSelect={(url) => onHeroVideoChange?.(url)}
        fileType="video"
        title="Select Hero Video"
      />
    </div>
  );
}
