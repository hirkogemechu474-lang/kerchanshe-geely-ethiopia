'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Play, Image, Video, Loader } from 'lucide-react';

interface MediaItem {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  altText?: string;
}

interface MediaUploadComponentProps {
  onSelect: (url: string, media: MediaItem) => void;
  mediaType: 'image' | 'video' | 'both';
  currentUrl?: string;
  onRemove?: () => void;
  category?: string;
}

export default function MediaUploadComponent({
  onSelect,
  mediaType = 'both',
  currentUrl,
  onRemove,
  category = 'electric-hero',
}: MediaUploadComponentProps) {
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>(currentUrl || '');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setSelectedUrl(currentUrl || '');
  }, [currentUrl]);

  useEffect(() => {
    if (showLibrary) {
      fetchMediaLibrary();
    }
  }, [showLibrary]);

  const fetchMediaLibrary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/media?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setMediaLibrary(Array.isArray(data) ? data : data.media || []);
      }
    } catch (error) {
      console.error('Error fetching media library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (mediaType === 'image' && !isImage) {
      alert('Please select an image file');
      return;
    }

    if (mediaType === 'video' && !isVideo) {
      alert('Please select a video file');
      return;
    }

    if (mediaType === 'both' && !isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('altText', `Hero ${mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : 'media'}`);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const file = data.file;
        setSelectedUrl(file.url);
        onSelect(file.url, {
          id: file.id,
          fileName: file.fileName,
          url: file.url,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          width: file.width,
          height: file.height,
          duration: file.duration,
          thumbnailUrl: file.thumbnailUrl,
          altText: file.altText,
        });
        setShowLibrary(false);
        // Refresh library
        await fetchMediaLibrary();
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleMediaSelect = (media: MediaItem) => {
    setSelectedUrl(media.url);
    onSelect(media.url, media);
    setShowLibrary(false);
  };

  const handleRemove = () => {
    setSelectedUrl('');
    if (onRemove) {
      onRemove();
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      const media = mediaLibrary.find(m => m.id === mediaId);
      if (!media) return;

      const response = await fetch(`/api/upload/image?url=${encodeURIComponent(media.url)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMediaLibrary(prev => prev.filter(m => m.id !== mediaId));
        if (selectedUrl === mediaId) {
          handleRemove();
        }
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const getMediaTypeLabel = () => {
    if (mediaType === 'image') return 'Image';
    if (mediaType === 'video') return 'Video';
    return 'Image or Video';
  };

  const getAcceptAttribute = () => {
    if (mediaType === 'image') return 'image/*';
    if (mediaType === 'video') return 'video/*';
    return 'image/*,video/*';
  };

  const filteredLibrary = mediaLibrary.filter(media => {
    if (mediaType === 'image') return media.mimeType.startsWith('image/');
    if (mediaType === 'video') return media.mimeType.startsWith('video/');
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Current Selection */}
      {selectedUrl && (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 h-64">
          {mediaType === 'video' || selectedUrl.includes('.mp4') || selectedUrl.includes('.webm') || selectedUrl.includes('.mov') ? (
            <video
              src={selectedUrl}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <img
              src={selectedUrl}
              alt="Selected media"
              className="w-full h-full object-cover"
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
            title="Remove media"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
        <label className="cursor-pointer">
          <input
            type="file"
            accept={getAcceptAttribute()}
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Click to upload {getMediaTypeLabel().toLowerCase()}
                </p>
                <p className="text-xs text-gray-500">
                  {mediaType === 'image' && 'JPG, JPEG, PNG, WEBP, SVG (up to 100MB)'}
                  {mediaType === 'video' && 'MP4, WEBM, MOV (up to 100MB)'}
                  {mediaType === 'both' && 'JPG, PNG, WEBP, MP4, WEBM (up to 100MB)'}
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Media Library Selector */}
      <button
        type="button"
        onClick={() => setShowLibrary(!showLibrary)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        {showLibrary ? 'Hide Media Library' : 'Browse Media Library'}
      </button>

      {/* Media Library */}
      {showLibrary && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {loading ? (
            <div className="text-center py-8">
              <Loader className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading media library...</p>
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No media files yet. Upload one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredLibrary.map(media => (
                <div
                  key={media.id}
                  className="relative group rounded-lg overflow-hidden bg-gray-200 aspect-square cursor-pointer"
                >
                  {/* Thumbnail */}
                  {media.mimeType.startsWith('image/') ? (
                    <img
                      src={media.url}
                      alt={media.fileName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      {media.thumbnailUrl ? (
                        <img
                          src={media.thumbnailUrl}
                          alt={media.fileName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Video className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMediaSelect(media);
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-all"
                      title="Select media"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(media.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-all"
                      title="Delete media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-1 left-1">
                    {media.mimeType.startsWith('video/') && (
                      <div className="bg-black bg-opacity-70 text-white rounded px-2 py-1 text-xs font-semibold flex items-center gap-1">
                        <Play className="w-3 h-3" /> Video
                      </div>
                    )}
                  </div>

                  {/* File info tooltip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="truncate">{media.fileName}</p>
                    <p className="text-gray-300">{(media.fileSize / 1024 / 1024).toFixed(2)}MB</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Responsive Info */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-100">
        <p className="font-medium text-gray-700 mb-1">💡 Media Management Tips:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Upload high-quality media for best display on all devices</li>
          <li>Images: JPG/PNG for photos, SVG for logos (smallest file size)</li>
          <li>Videos: MP4 recommended for best browser compatibility</li>
          <li>Max file size: 100MB for optimal performance</li>
        </ul>
      </div>
    </div>
  );
}
