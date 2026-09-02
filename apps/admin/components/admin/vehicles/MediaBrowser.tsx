'use client';

import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Video, Search, Upload as UploadIcon } from 'lucide-react';

interface MediaAsset {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  category: string | null;
  createdAt: string;
}

interface MediaBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  fileType?: 'image' | 'video' | 'all';
  title?: string;
}

export default function MediaBrowser({
  isOpen,
  onClose,
  onSelect,
  fileType = 'all',
  title = 'Select Media'
}: MediaBrowserProps) {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMediaAssets();
    }
  }, [isOpen, fileType]);

  async function fetchMediaAssets() {
    try {
      setLoading(true);
      const url = fileType === 'all' 
        ? '/api/media'
        : `/api/media?fileType=${fileType}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMediaAssets(data);
      }
    } catch (error) {
      console.error('Error fetching media assets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    try {
      setUploading(true);

      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const isImage = file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes(extension);
      const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.mov', '.avi', '.m4v'].includes(extension);
      if ((fileType === 'image' && !isImage) || (fileType === 'video' && !isVideo)) {
        throw new Error(`Please select a valid ${fileType} file.`);
      }
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('category', 'vehicle');
      uploadFormData.append('altText', file.name);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || errorBody.details || `Upload failed (${response.status})`);
      }

      const result = await response.json();
      if (!result.file?.url) {
        throw new Error('Upload completed but the server did not return a media URL.');
      }
      
      // Refresh media list
      await fetchMediaAssets();
      
      // Auto-select the newly uploaded file
      setSelectedAsset(result.file);
      
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  const filteredAssets = mediaAssets.filter(asset => {
    if (searchQuery) {
      return (
        asset.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.altText && asset.altText.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  const handleSelect = () => {
    if (selectedAsset) {
      onSelect(selectedAsset.url);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div>
            <h2 className="text-2xl font-bold text-navy">{title}</h2>
            <p className="text-sm text-steel mt-1">
              {fileType === 'all' ? 'Images and videos' : fileType === 'image' ? 'Images only' : 'Videos only'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search & Upload */}
        <div className="p-6 border-b border-line">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-steel" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search media..."
                className="w-full pl-12 pr-4 py-3 border border-line rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>

            {/* Upload Button */}
            <label className="flex items-center gap-2 bg-geely-blue text-white font-semibold px-6 py-3 rounded-lg cursor-pointer hover:bg-opacity-90 transition-all">
              <UploadIcon size={20} />
              <span>Upload New</span>
              <input
                type="file"
                accept={fileType === 'image' ? 'image/*' : fileType === 'video' ? 'video/*' : 'image/*,video/*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.currentTarget.value = '';
                }}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-geely-blue border-t-transparent mb-4"></div>
                <p className="text-steel">Loading media...</p>
              </div>
            </div>
          ) : uploading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-geely-blue border-t-transparent mb-4"></div>
                <p className="text-steel">Uploading file...</p>
              </div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <ImageIcon size={48} className="mx-auto text-steel mb-4" />
                <h3 className="text-xl font-bold text-navy mb-2">No Media Found</h3>
                <p className="text-steel">Upload files to get started</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg ${
                    selectedAsset?.id === asset.id
                      ? 'border-geely-blue ring-2 ring-geely-blue'
                      : 'border-line hover:border-geely-blue'
                  }`}
                >
                  {/* Media Preview */}
                  <div className="relative aspect-square bg-gradient-to-br from-ice to-line flex items-center justify-center">
                    {asset.fileType === 'video' ? (
                      <>
                        <Video size={32} className="text-steel" />
                        {asset.url && (
                          <video
                            src={asset.url}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                          />
                        )}
                      </>
                    ) : (
                      <img
                        src={asset.url}
                        alt={asset.altText || asset.originalName}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    
                    {/* File Type Badge */}
                    <div className="absolute top-2 right-2">
                      {asset.fileType === 'video' ? (
                        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          VIDEO
                        </div>
                      ) : (
                        <div className="bg-geely-blue text-white text-xs font-bold px-2 py-1 rounded">
                          IMAGE
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="p-3 bg-white">
                    <p className="text-xs font-semibold text-navy truncate" title={asset.originalName}>
                      {asset.originalName}
                    </p>
                    <p className="text-xs text-steel">
                      {(asset.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-line bg-ice">
          <div className="text-sm text-steel">
            {selectedAsset ? (
              <span>
                Selected: <span className="font-semibold text-navy">{selectedAsset.originalName}</span>
              </span>
            ) : (
              <span>Select a file to continue</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-line rounded-lg hover:bg-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedAsset}
              className="px-6 py-3 bg-geely-blue text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
