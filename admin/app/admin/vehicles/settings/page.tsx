'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  Settings,
  Award,
  RefreshCw,
  Plus,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

/* ---------- TYPES ---------- */
interface VehicleSettingsData {
  warranty: {
    vehicle: string;
    battery: string;
    paintwork: string;
    corrosion: string;
  };
  serviceIntervals: {
    standard: string;
    electric: string;
  };
  brochure: {
    url: string;
    fileName: string;
    fileSize: number | null;
    uploadedAt: string | null;
  };
}

interface ShowcaseView {
  angle: string;
  imageUrl: string;
  label: string;
}

interface Showcase {
  id: string;
  vehicleId: string;
  vehicleName: string;
  title: string;
  subtitle: string | null;
  views: ShowcaseView[];
  videoUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------- DEFAULTS ---------- */
const DEFAULT_DATA: VehicleSettingsData = {
  warranty: {
    vehicle: '5 Years or 150,000 km (whichever comes first)',
    battery: '8 Years or 160,000 km (EV battery)',
    paintwork: '3 Years or 100,000 km against perforation',
    corrosion: '12 Years Against Perforation Corrosion',
  },
  serviceIntervals: {
    standard: 'Every 10,000 km or 6 months',
    electric: 'Every 20,000 km or 12 months',
  },
  brochure: { url: '', fileName: '', fileSize: null, uploadedAt: null },
};

/* ---------- PAGE ---------- */
export default function VehicleSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VehicleSettingsData>(DEFAULT_DATA);
  const [section, setSection] = useState<string>('all');

  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleName: '',
    title: 'Explore Every Angle',
    subtitle: 'Experience our vehicles like never before with our interactive 360° viewer.',
    views: [] as ShowcaseView[],
    videoUrl: '',
    ctaText: 'Explore in Detail',
    ctaLink: '',
    sortOrder: 0,
    isActive: false,
  });
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/vehicle-settings');
        if (res.ok) {
          const raw = await res.json();
          setData({
            warranty: { ...DEFAULT_DATA.warranty, ...(raw.warranty ?? {}) },
            serviceIntervals: { ...DEFAULT_DATA.serviceIntervals, ...(raw.serviceIntervals ?? {}) },
            brochure: { ...DEFAULT_DATA.brochure, ...(raw.brochure ?? {}) },
          });
        }
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    })();
    fetchShowcases();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/vehicle-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.details || j.error || 'Save failed');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  async function fetchShowcases() {
    try {
      const response = await fetch('/api/admin/showcase');
      if (response.ok) {
        const data = await response.json();
        setShowcases(data);
      }
    } catch (error) {
      console.error('Error fetching showcases:', error);
    }
  }

  function resetForm() {
    setFormData({
      vehicleId: '',
      vehicleName: '',
      title: 'Explore Every Angle',
      subtitle: 'Experience our vehicles like never before with our interactive 360° viewer.',
      views: [],
      videoUrl: '',
      ctaText: 'Explore in Detail',
      ctaLink: '',
      sortOrder: 0,
      isActive: false,
    });
    setEditingId(null);
  }

  function editShowcase(showcase: Showcase) {
    setFormData({
      vehicleId: showcase.vehicleId,
      vehicleName: showcase.vehicleName,
      title: showcase.title,
      subtitle: showcase.subtitle || '',
      views: showcase.views,
      videoUrl: showcase.videoUrl || '',
      ctaText: showcase.ctaText || '',
      ctaLink: showcase.ctaLink || '',
      sortOrder: showcase.sortOrder,
      isActive: showcase.isActive,
    });
    setEditingId(showcase.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/showcase/${editingId}`
        : '/api/admin/showcase';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingId ? 'Showcase updated successfully!' : 'Showcase created successfully!');
        resetForm();
        fetchShowcases();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save showcase');
      }
    } catch (error) {
      console.error('Error saving showcase:', error);
      alert('Failed to save showcase');
    }
  }

  async function deleteShowcase(id: string) {
    if (!confirm('Are you sure you want to delete this showcase?')) return;

    try {
      const response = await fetch(`/api/admin/showcase/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Showcase deleted successfully!');
        fetchShowcases();
      } else {
        alert('Failed to delete showcase');
      }
    } catch (error) {
      console.error('Error deleting showcase:', error);
      alert('Failed to delete showcase');
    }
  }

  function addView() {
    setFormData({
      ...formData,
      views: [
        ...formData.views,
        { angle: '0', imageUrl: '', label: '' }
      ]
    });
  }

  function updateView(index: number, field: keyof ShowcaseView, value: string) {
    const newViews = [...formData.views];
    newViews[index] = { ...newViews[index], [field]: value };
    setFormData({ ...formData, views: newViews });
  }

  function removeView(index: number) {
    const newViews = formData.views.filter((_, i) => i !== index);
    setFormData({ ...formData, views: newViews });
  }

  async function handleFileUpload(index: number, file: File) {
    if (!file) return;

    setUploadingIndex(index);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.success ? data.url : data.url;
        updateView(index, 'imageUrl', imageUrl);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  }

  async function handleBrochureUpload(file: File) {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF brochure.');
      return;
    }

    setUploadingBrochure(true);
    setError(null);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: uploadFormData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || 'Failed to upload brochure');

      setData((current) => ({
        ...current,
        brochure: {
          url: result.url,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        },
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload brochure');
    } finally {
      setUploadingBrochure(false);
    }
  }

  async function handleShowcaseVideoUpload(file: File) {
    if (!file) return;
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      setError('Please upload an MP4, WebM, or MOV video.');
      return;
    }

    setUploadingVideo(true);
    setError(null);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: uploadFormData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || 'Failed to upload showcase video');
      setFormData((current) => ({ ...current, videoUrl: result.url }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload showcase video');
    } finally {
      setUploadingVideo(false);
    }
  }

  /* ---------- TABS ---------- */
  const TABS = [
    { id: 'all', label: 'All Sections', icon: Settings, hint: 'Full overview' },
    { id: 'warranty', label: 'Warranty', icon: Award, hint: 'Service intervals' },
    { id: '360', label: '360° View', icon: Layers, count: showcases.length, hint: 'Interactive showcase' },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Loading vehicle settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Vehicle Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Warranty, service intervals, brochure, and 360° showcase that appear across the public website —
            categories are managed under Vehicles → Categories, feature/spec reference lists under
            Vehicles → Features / Specifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved {savedAt}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-violet-800 transition-all hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-60 font-medium whitespace-nowrap"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
            <span className="sm:hidden">{saving ? 'Saving' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* SECTION TABS (CAROUSEL ON SMALL SCREENS) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm overflow-x-auto">
        <div className="flex min-w-max sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            const gradient =
              tab.id === 'warranty'
                ? 'from-emerald-500 to-emerald-600'
                : tab.id === '360'
                ? 'from-fuchsia-500 to-pink-600'
                : 'from-violet-500 to-violet-600';
            const textColor =
              tab.id === 'warranty'
                ? 'text-emerald-600'
                : tab.id === '360'
                ? 'text-fuchsia-600'
                : 'text-violet-600';
            const bgColor =
              tab.id === 'warranty'
                ? 'bg-emerald-50'
                : tab.id === '360'
                ? 'bg-fuchsia-50'
                : 'bg-violet-50';
            return (
              <button
                key={tab.id}
                onClick={() => {
                  const next = active ? 'all' : tab.id;
                  setSection(next);
                  if (typeof window !== 'undefined' && next !== 'all') {
                    const el = document.getElementById(`sec-${tab.id}`);
                    setTimeout(() => el?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  }
                }}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  active
                    ? `bg-gradient-to-r ${gradient} text-white shadow-md`
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  active ? 'bg-white/20' : `${bgColor} ${textColor}`
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-900'}`}>
                    {tab.label}
                  </div>
                  <div className={`text-xs ${active ? 'text-white/80' : 'text-gray-500'}`}>
                    {tab.count !== undefined ? `${tab.count} items` : tab.hint}
                  </div>
                </div>
                {active ? (
                  <ChevronDown className="w-4 h-4 shrink-0 hidden sm:block" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 text-gray-400 hidden sm:block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Could not save</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* WARRANTY */}
      {(section === 'all' || section === 'warranty') && (
        <SectionCard id="sec-warranty" title="Warranty & Service Intervals" subtitle="Shown in footer and vehicle details" icon={Award} gradient="from-emerald-500 to-emerald-600" accent="emerald">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextareaField label="Vehicle Warranty" value={data.warranty.vehicle}
              onChange={(v) => setData((d) => ({ ...d, warranty: { ...d.warranty, vehicle: v } }))}
              accent="blue" />
            <TextareaField label="EV Battery Warranty" value={data.warranty.battery}
              onChange={(v) => setData((d) => ({ ...d, warranty: { ...d.warranty, battery: v } }))}
              accent="emerald" />
            <TextareaField label="Paintwork Warranty" value={data.warranty.paintwork}
              onChange={(v) => setData((d) => ({ ...d, warranty: { ...d.warranty, paintwork: v } }))}
              accent="amber" />
            <TextareaField label="Corrosion Warranty" value={data.warranty.corrosion}
              onChange={(v) => setData((d) => ({ ...d, warranty: { ...d.warranty, corrosion: v } }))}
              accent="slate" />
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextareaField label="Service Interval — Standard (Petrol / Hybrid)" value={data.serviceIntervals.standard}
                onChange={(v) => setData((d) => ({ ...d, serviceIntervals: { ...d.serviceIntervals, standard: v } }))}
                accent="orange" />
              <TextareaField label="Service Interval — Electric Vehicles" value={data.serviceIntervals.electric}
                onChange={(v) => setData((d) => ({ ...d, serviceIntervals: { ...d.serviceIntervals, electric: v } }))}
                accent="teal" />
            </div>
          </div>
        </SectionCard>
      )}

      {/* 360° VIEW */}
      {(section === 'all' || section === '360') && (
        <SectionCard id="sec-360" title="360° Vehicle Showcase" subtitle="Manage interactive 360° viewer section on the homepage" icon={Layers} gradient="from-fuchsia-500 to-pink-600" accent="violet">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Frontend brochure</h2>
                  <p className="mt-1 text-sm text-gray-500">Upload the PDF used by Download Brochure buttons on public vehicle pages.</p>
                </div>
                {data.brochure.url && <a href={data.brochure.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-700 hover:text-fuchsia-800"><Eye className="h-4 w-4" />Preview PDF</a>}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-700">
                  <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={uploadingBrochure} onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleBrochureUpload(file);
                    event.currentTarget.value = '';
                  }} />
                  <FileText className="h-4 w-4" />{uploadingBrochure ? 'Uploading...' : data.brochure.url ? 'Replace PDF' : 'Upload PDF'}
                </label>
                {data.brochure.url ? <div className="flex items-center gap-2 text-sm text-gray-600"><span className="max-w-64 truncate font-medium">{data.brochure.fileName || 'Uploaded brochure.pdf'}</span>{data.brochure.fileSize && <span className="text-gray-400">({(data.brochure.fileSize / 1024 / 1024).toFixed(1)} MB)</span>}<button type="button" onClick={() => setData((current) => ({ ...current, brochure: DEFAULT_DATA.brochure }))} className="text-red-600 hover:text-red-700">Remove</button></div> : <p className="text-sm text-gray-500">PDF only, up to 15 MB. Save Changes after uploading.</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/40 p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">360° Showcase Video</h2>
                  <p className="mt-1 text-sm text-gray-600">Upload an optional product video. It will appear in the public vehicle showcase video tab.</p>
                </div>
                {formData.videoUrl && <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-700 hover:text-fuchsia-800"><Eye className="h-4 w-4" />Preview video</a>}
              </div>
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-700">
                  <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="hidden" disabled={uploadingVideo} onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleShowcaseVideoUpload(file);
                    event.currentTarget.value = '';
                  }} />
                  <FileText className="h-4 w-4" />{uploadingVideo ? 'Uploading...' : formData.videoUrl ? 'Replace Video' : 'Upload Video'}
                </label>
                {formData.videoUrl ? (
                  <button type="button" onClick={() => setFormData((current) => ({ ...current, videoUrl: '' }))} className="text-sm font-medium text-red-600 hover:text-red-700">Remove video</button>
                ) : (
                  <p className="text-sm text-gray-500">MP4, WebM, or MOV, up to 50 MB. Save the showcase after uploading.</p>
                )}
              </div>
              {formData.videoUrl && <video src={formData.videoUrl} controls preload="metadata" className="mt-5 max-h-72 w-full rounded-xl border border-gray-200 bg-black" />}
            </div>
            {/* Create/Edit Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingId ? 'Edit Showcase' : 'Create New Showcase'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle ID *
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      placeholder="coolray, emgrand, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Name *
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleName}
                      onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                      placeholder="Geely Coolray"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Section Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <textarea
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  />
                </div>

                {/* 360° Views */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      360° Views *
                    </label>
                    <button
                      type="button"
                      onClick={addView}
                      className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white text-sm font-medium rounded-lg hover:bg-fuchsia-700"
                    >
                      <Plus size={16} />
                      Add View
                    </button>
                  </div>

                  {formData.views.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <ImageIcon className="mx-auto text-gray-400 mb-2" size={48} />
                      <p className="text-gray-500">No views added yet</p>
                      <button
                        type="button"
                        onClick={addView}
                        className="mt-4 text-fuchsia-600 font-medium hover:underline"
                      >
                        Add your first view
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {formData.views.map((view, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <GripVertical size={20} className="text-gray-400" />
                          <span className="font-medium text-gray-700">View {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeView(index)}
                            className="ml-auto text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Angle
                            </label>
                            <input
                              type="text"
                              value={view.angle}
                              onChange={(e) => updateView(index, 'angle', e.target.value)}
                              placeholder="0, 45, 90, interior, etc."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Label
                            </label>
                            <input
                              type="text"
                              value={view.label}
                              onChange={(e) => updateView(index, 'label', e.target.value)}
                              placeholder="Front View, Side View, etc."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                              Image *
                            </label>

                            {/* Image Preview */}
                            {view.imageUrl && (
                              <div className="mb-3 relative">
                                <img
                                  src={view.imageUrl}
                                  alt={view.label || 'Preview'}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateView(index, 'imageUrl', '')}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                  title="Remove image"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}

                            {/* Upload Button or Info */}
                            {!view.imageUrl ? (
                              <label className="block cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(index, file);
                                  }}
                                  className="hidden"
                                  disabled={uploadingIndex === index}
                                />
                                <div className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-all">
                                  {uploadingIndex === index ? (
                                    <>
                                      <div className="w-6 h-6 border-3 border-fuchsia-600 border-t-transparent rounded-full animate-spin" />
                                      <span className="text-fuchsia-600 font-medium">Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <ImageIcon size={24} className="text-gray-400" />
                                      <div className="text-center">
                                        <span className="block text-sm font-medium text-gray-900">
                                          Click to upload image
                                        </span>
                                        <span className="block text-xs text-gray-500 mt-1">
                                          JPEG, PNG, WebP, GIF (max 10MB)
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </label>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(view.imageUrl, '_blank')}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
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
                                      if (file) handleFileUpload(index, file);
                                    }}
                                    className="hidden"
                                    disabled={uploadingIndex === index}
                                  />
                                  <div className="flex items-center justify-center gap-2 px-3 py-2 bg-fuchsia-600 text-white text-sm font-medium rounded-lg hover:bg-fuchsia-700">
                                    <ImageIcon size={16} />
                                    Change Image
                                  </div>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      placeholder="Explore in Detail"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={formData.ctaLink}
                      onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                      placeholder="/models/coolray"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer mt-7">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Show on homepage</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg hover:bg-fuchsia-700 transition-colors"
                  >
                    {editingId ? 'Update Showcase' : 'Create Showcase'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Showcase List */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">All Showcases</h2>

              {showcases.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No showcases created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {showcases.map((showcase) => (
                    <div
                      key={showcase.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {showcase.vehicleName}
                            </h3>
                            {showcase.isActive ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 font-medium mb-1">{showcase.title}</p>
                          {showcase.subtitle && (
                            <p className="text-gray-600 text-sm mb-2">{showcase.subtitle}</p>
                          )}
                          <p className="text-gray-500 text-sm">
                            {showcase.views.length} view{showcase.views.length !== 1 ? 's' : ''} • Sort: {showcase.sortOrder}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => editShowcase(showcase)}
                            className="p-2 text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteShowcase(showcase.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* STICKY SAVE BAR (mobile + small screens) */}
      <div className="sm:hidden sticky bottom-4 -mx-2">
        <div className="mx-2 bg-white border border-gray-200 shadow-2xl rounded-2xl p-3 flex items-center gap-2">
          {savedAt && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-60 font-medium"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SHARED UI SUBCOMPONENTS (colocated for clarity, no separate files needed)
   ============================================================ */

function SectionCard({
  id, title, subtitle, icon: Icon, gradient, accent, children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  gradient: string;
  accent: string;
  children: React.ReactNode;
}) {
  const accentMap: Record<string, string> = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    teal: 'border-teal-100 bg-teal-50 text-teal-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    orange: 'border-orange-100 bg-orange-50 text-orange-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
  };
  return (
    <section id={id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} shadow-md flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function TextareaField({
  label, value, onChange, accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent: 'blue' | 'emerald' | 'amber' | 'violet' | 'orange' | 'teal' | 'slate';
}) {
  const accentMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 focus-within:ring-blue-500',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 focus-within:ring-emerald-500',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 focus-within:ring-amber-500',
    violet: 'bg-violet-50 border-violet-200 text-violet-700 focus-within:ring-violet-500',
    orange: 'bg-orange-50 border-orange-200 text-orange-700 focus-within:ring-orange-500',
    teal: 'bg-teal-50 border-teal-200 text-teal-700 focus-within:ring-teal-500',
    slate: 'bg-slate-50 border-slate-200 text-slate-700 focus-within:ring-slate-500',
  };
  const [bg, border, text, _ring] = accentMap[accent].split(' ');
  return (
    <label className={`block rounded-xl border-2 ${border} ${bg} p-0.5 focus-within:ring-4 focus-within:ring-opacity-30 focus-within:${_ring.replace('focus-within:', '')} transition-shadow`}>
      <div className={`px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider ${text}`}>{label}</div>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full bg-white rounded-lg px-4 py-2.5 border border-gray-200 focus:border-transparent focus:outline-none text-gray-800 text-sm leading-relaxed"
      />
    </label>
  );
}
