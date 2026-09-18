'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Globe, Link2, Tag, ExternalLink } from 'lucide-react';
import type { VehicleFeatureLists } from '@/lib/vehicle-settings-types';

interface VehicleOption {
  id: string;
  name: string;
  category: string;
  heroImageUrl?: string | null;
}

const STATUS_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'draft', label: 'Draft', hint: 'Hidden from the public site entirely' },
  { value: 'published', label: 'Published', hint: 'Live on the public site' },
  { value: 'archived', label: 'Archived', hint: 'Hidden — kept for records, e.g. a discontinued model' },
];

const FEATURE_GROUPS: { key: keyof VehicleFeatureLists; label: string }[] = [
  { key: 'safety', label: 'Safety' },
  { key: 'comfort', label: 'Comfort & Interior' },
  { key: 'technology', label: 'Technology & Infotainment' },
  { key: 'performance', label: 'Performance & Driving' },
  { key: 'exterior', label: 'Exterior' },
];

const EMPTY_FEATURE_LISTS: VehicleFeatureLists = { safety: [], comfort: [], technology: [], performance: [], exterior: [] };

interface SeoPublishEditorProps {
  status: string;
  onStatusChange: (status: string) => void;
  metaTitle: string;
  onMetaTitleChange: (value: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (value: string) => void;
  relatedVehicleIds: string[];
  onRelatedVehicleIdsChange: (ids: string[]) => void;
  featureTags: Record<string, string[]>;
  onFeatureTagsChange: (tags: Record<string, string[]>) => void;
  currentVehicleId?: string;
  fallbackTitle: string;
  fallbackDescription: string;
}

export default function SeoPublishEditor({
  status,
  onStatusChange,
  metaTitle,
  onMetaTitleChange,
  metaDescription,
  onMetaDescriptionChange,
  relatedVehicleIds,
  onRelatedVehicleIdsChange,
  featureTags,
  onFeatureTagsChange,
  currentVehicleId,
  fallbackTitle,
  fallbackDescription,
}: SeoPublishEditorProps) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [curatedFeatures, setCuratedFeatures] = useState<VehicleFeatureLists>(EMPTY_FEATURE_LISTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [vehiclesRes, featuresRes] = await Promise.all([
          fetch('/api/vehicles?pageSize=200'),
          fetch('/api/settings/vehicle-features'),
        ]);
        if (vehiclesRes.ok) {
          const data = await vehiclesRes.json();
          setVehicles(Array.isArray(data.vehicles) ? data.vehicles : Array.isArray(data.items) ? data.items : []);
        }
        if (featuresRes.ok) {
          setCuratedFeatures({ ...EMPTY_FEATURE_LISTS, ...(await featuresRes.json()) });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleRelated = (id: string) => {
    onRelatedVehicleIdsChange(
      relatedVehicleIds.includes(id) ? relatedVehicleIds.filter((v) => v !== id) : [...relatedVehicleIds, id]
    );
  };

  const toggleFeature = (group: keyof VehicleFeatureLists, tag: string) => {
    const current = featureTags[group] || [];
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    onFeatureTagsChange({ ...featureTags, [group]: next });
  };

  const otherVehicles = vehicles.filter((v) => v.id !== currentVehicleId);
  const anyCuratedFeatures = FEATURE_GROUPS.some((g) => (curatedFeatures[g.key] || []).length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO & Publish</h2>
        <p className="text-sm text-gray-500">Control search-engine metadata, visibility, and cross-sell content for this vehicle</p>
      </div>

      {/* Publish status */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
          <Globe className="w-4 h-4" /> Visibility
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                status === opt.value ? 'border-geely-blue bg-geely-blue/5' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`font-medium ${status === opt.value ? 'text-geely-blue' : 'text-gray-900'}`}>{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SEO fields */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
          <Search className="w-4 h-4" /> Meta Title
        </label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder={`${fallbackTitle || 'Vehicle name'} | Geely Ethiopia`}
          maxLength={70}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-400">
          {metaTitle.length}/70 — leave blank to auto-generate from the vehicle name
        </p>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
          <Search className="w-4 h-4" /> Meta Description
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder={fallbackDescription || 'Explore specs, features, and book a test drive.'}
          maxLength={160}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-400">
          {metaDescription.length}/160 — leave blank to auto-generate from the vehicle description
        </p>
      </div>

      {/* Related vehicles */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
          <Link2 className="w-4 h-4" /> Related Vehicles
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Shown on this vehicle&apos;s public page as &quot;You may also like&quot;. Leave unselected to fall back to
          automatic same-category suggestions.
        </p>
        {loading ? (
          <p className="text-sm text-gray-400">Loading vehicles…</p>
        ) : otherVehicles.length === 0 ? (
          <p className="text-sm text-gray-400">No other vehicles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {otherVehicles.map((v) => (
              <label
                key={v.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${
                  relatedVehicleIds.includes(v.id) ? 'border-geely-blue bg-geely-blue/5' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={relatedVehicleIds.includes(v.id)}
                  onChange={() => toggleRelated(v.id)}
                  className="w-4 h-4 text-geely-blue border-gray-300 rounded focus:ring-geely-blue"
                />
                <span className="text-sm text-gray-900">{v.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{v.category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Feature tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Tag className="w-4 h-4" /> Feature Tags
          </label>
          <Link
            href="/admin/vehicles/features"
            target="_blank"
            className="flex items-center gap-1 text-xs text-geely-blue hover:underline"
          >
            Manage tag list <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Selected tags drive the public &quot;Vehicle Features&quot; section — falls back to the free-text
          specifications features when none are selected here.
        </p>
        {loading ? (
          <p className="text-sm text-gray-400">Loading feature tags…</p>
        ) : !anyCuratedFeatures ? (
          <p className="text-sm text-gray-400">
            No curated tags yet —{' '}
            <Link href="/admin/vehicles/features" target="_blank" className="text-geely-blue hover:underline">
              add some
            </Link>{' '}
            to enable per-vehicle selection.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURE_GROUPS.map((group) => {
              const options = curatedFeatures[group.key] || [];
              if (options.length === 0) return null;
              return (
                <div key={group.key}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.map((tag) => {
                      const selected = (featureTags[group.key] || []).includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleFeature(group.key, tag)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            selected
                              ? 'bg-geely-blue text-white border-geely-blue'
                              : 'bg-white text-gray-600 border-gray-300'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
