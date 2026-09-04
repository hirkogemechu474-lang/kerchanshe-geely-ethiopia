'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Loader2, Image as ImageIcon, Video } from 'lucide-react';

export interface FileUploadProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  helperText?: string;
  previewHeight?: string;
  maxSizeMB?: number;
}

const ACCEPT_ALL = '.jpg,.jpeg,.png,.webp,.svg,.gif,.mp4,.webm,.mov,.avi,.pdf';

function isImagePath(url: string) {
  return /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(url);
}

function isVideoPath(url: string) {
  return /\.(mp4|webm|mov|avi)$/i.test(url);
}

export default function FileUpload({
  value,
  onChange,
  accept = ACCEPT_ALL,
  multiple = false,
  label = 'Upload File',
  helperText = 'JPG, JPEG, PNG, WEBP, SVG, GIF, MP4, WEBM, MOV, AVI, PDF',
  previewHeight = 'h-48',
  maxSizeMB = 10,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const values: string[] = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : value ? [value] : [];

  const uploadFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = accept.replace(/\s+/g, '').split(',');
    const isAllowed = allowedExts.length === 0 || allowedExts.includes(`.${ext}`) || allowedExts.includes('*');
    if (!isAllowed) {
      setError(`File type ".${ext}" is not allowed.`);
      return null;
    }

    const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(ext);
    const isPdf = ext === 'pdf';
    const sizeLimit = isVideo ? 50 : isPdf ? 15 : maxSizeMB;
    if (file.size > sizeLimit * 1024 * 1024) {
      setError(`File too large. Maximum size is ${sizeLimit}MB.`);
      return null;
    }

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', label.toLowerCase().replace(/\s+/g, '-'));
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'Upload failed');
        return null;
      }
      return data.url as string;
    } catch {
      setError('Upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  }, [accept, label, maxSizeMB]);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!multiple && arr.length > 1) arr.splice(1);
    const urls: string[] = [];
    for (const file of arr) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      onChange(multiple ? [...values, ...urls] : urls[0]);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    if (multiple) {
      const next = values.filter((_, i) => i !== index);
      onChange(next);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          <p className="text-sm font-medium text-gray-700">
            {uploading ? 'Uploading...' : `Drag & drop or click to ${values.length > 0 ? 'replace' : 'upload'} ${label.toLowerCase()}`}
          </p>
          <p className="text-xs text-gray-500">{helperText}</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {values.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {values.map((url, index) => (
            <div key={url + index} className="relative group">
              <div className={`w-full ${previewHeight} rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center`}>
                {isImagePath(url) ? (
                  <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                ) : isVideoPath(url) ? (
                  <video src={url} className="w-full h-full object-cover" controls />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <FileText className="w-10 h-10" />
                    <span className="text-xs truncate max-w-[90%]">{url.split('/').pop()}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
