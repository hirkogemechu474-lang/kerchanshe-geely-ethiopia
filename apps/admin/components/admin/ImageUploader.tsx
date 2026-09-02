'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Link2, X, Loader2, Trash2, FileImage } from 'lucide-react';

/**
 * ImageUploader — reusable component with 3 modes:
 *   1. Upload from device (via FilePicker + Drag&Drop → POST /api/upload/image)
 *   2. Paste remote Image URL (tab)
 *
 * Props:
 *   - value: current image URL (can be /uploads/… or https://… or '' empty)
 *   - onChange(newUrl): called AFTER a successful upload OR a URL change
 *   - onUploadStart / onUploadEnd: optional progress callbacks
 *   - category: passed to /api/upload/image for the uploads subfolder (default "general")
 *   - label / hint: optional helper text
 *   - aspect: "square" | "video" | "wide" | "auto" — controls empty area + preview aspect
 *   - maxSizeMB: default 10
 */

type Tab = 'upload' | 'url';

export interface ImageUploaderProps {
  value: string;
  onChange: (newUrl: string) => void;
  category?: string;
  label?: string;
  hint?: string;
  required?: boolean;
  aspect?: 'square' | 'video' | 'wide' | 'auto';
  maxSizeMB?: number;
  className?: string;
}

const ASPECT_CLASS: Record<NonNullable<ImageUploaderProps['aspect']>, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[16/9]',
  auto: 'min-h-[220px]',
};

export default function ImageUploader({
  value,
  onChange,
  category = 'general',
  label,
  hint,
  required,
  aspect = 'video',
  maxSizeMB = 10,
  className = '',
}: ImageUploaderProps) {
  const [tab, setTab] = useState<Tab>('upload');
  const [draftUrl, setDraftUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectCls = ASPECT_CLASS[aspect];

  const clear = () => {
    onChange('');
    setDraftUrl('');
    setError(null);
  };

  const applyUrl = useCallback((url: string) => {
    if (!url.trim()) {
      onChange('');
      setError(null);
      return;
    }
    if (/^https?:\/\//i.test(url) || /^\/uploads\//.test(url) || url.startsWith('data:')) {
      onChange(url.trim());
      setError(null);
    } else {
      setError('URL must start with http://, https://, or /uploads/…');
    }
  }, [onChange]);

  const uploadFile = async (file: File) => {
    setError(null);
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are accepted (JPG, PNG, WEBP, GIF).');
      return;
    }
    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large (max ${maxSizeMB}MB). Choose a smaller image.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => 'Upload failed');
        throw new Error(txt || `Upload failed: ${res.status}`);
      }
      const json = await res.json();
      if (!json?.url) throw new Error('No URL returned from upload API');
      onChange(json.url);
    } catch (e) {
      setError((e as Error).message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    // reset value so picking the same file again still fires change
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  /* ---- RENDER ---- */

  // Preview when value already exists
  if (value) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-800">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          </div>
        )}
        <div className={`relative w-full ${aspectCls} rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm`}>
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Floating overlay actions */}
          <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent">
            <div className="text-xs text-white/90 truncate max-w-[70%]" title={value}>
              <FileImage size={13} className="inline mr-1 align-[-2px]" />
              {value.startsWith('/uploads/') ? value.split('/').pop() : value}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-gray-800 text-xs font-semibold hover:bg-white transition shadow"
              >
                <Upload size={13} />
                Replace
              </button>
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition shadow"
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          className="hidden"
        />
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg border border-red-200 p-2.5">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Empty state → tabs: Upload / URL
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Tab switcher */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
            tab === 'upload'
              ? 'bg-white shadow text-gray-900 ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Upload size={13} /> From Device
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
            tab === 'url'
              ? 'bg-white shadow text-gray-900 ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Link2 size={13} /> From URL
          </span>
        </button>
      </div>

      {tab === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`relative ${aspectCls} rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPick}
            className="hidden"
          />
          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-geely-blue">
              <Loader2 className="w-10 h-10 animate-spin" />
              <div className="font-semibold text-sm">Uploading… please wait</div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-gray-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {isDragging ? 'Drop image here to upload' : 'Click or drag image to upload'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  PNG, JPG, WEBP · max {maxSizeMB}MB · or choose &quot;From URL&quot; tab
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'url' && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Link2 size={15} className="mt-1 text-gray-400 shrink-0" />
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Remote image URL</label>
              <input
                type="url"
                value={draftUrl}
                placeholder="https://example.com/picture.jpg"
                onChange={(e) => setDraftUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyUrl(draftUrl);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-geely-blue/30 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyUrl(draftUrl)}
                  disabled={!draftUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftUrl('');
                    setError(null);
                  }}
                  disabled={!draftUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition border border-transparent disabled:opacity-40"
                >
                  <X size={14} /> Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 rounded-lg border border-red-200 p-2.5">
          {error}
        </div>
      )}
    </div>
  );
}
