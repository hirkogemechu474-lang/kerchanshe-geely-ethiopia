'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Sofa, Radio, Gauge, Car, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader, Card, Button } from '@/components/admin/ui';
import FeatureTagList from '@/components/admin/vehicles/FeatureTagList';
import type { VehicleFeatureLists } from '@/lib/vehicle-settings-types';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const EMPTY: VehicleFeatureLists = { safety: [], comfort: [], technology: [], performance: [], exterior: [] };

export default function VehicleFeaturesPage() {
  useAdminAuth('canManageVehicles');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VehicleFeatureLists>(EMPTY);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/vehicle-features');
        if (res.ok) setData({ ...EMPTY, ...(await res.json()) });
        else setError(res.status === 403 ? 'You don’t have permission to view features.' : 'Unable to load features.');
      } catch {
        setError('Unable to load features.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setGroup = (key: keyof VehicleFeatureLists, next: string[]) =>
    setData((d) => ({ ...d, [key]: next }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/vehicle-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.details || j.error || 'Save failed');
      }
      setSavedAt(new Date().toLocaleTimeString());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin text-geely-blue" />
          Loading features...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Features"
        description="Curated feature lists suggested while editing a vehicle's Specifications — also referenced by filter chips on the public site"
        actions={
          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved {savedAt}
              </span>
            )}
            <Button onClick={save} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Could not save</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FeatureTagList
            title="Safety"
            icon={ShieldCheck}
            items={data.safety}
            accent="blue"
            placeholder="e.g. Tire Pressure Monitoring System"
            onChange={(next) => setGroup('safety', next)}
          />
          <FeatureTagList
            title="Comfort & Interior"
            icon={Sofa}
            items={data.comfort}
            accent="amber"
            placeholder="e.g. Heated steering wheel"
            onChange={(next) => setGroup('comfort', next)}
          />
          <FeatureTagList
            title="Technology & Infotainment"
            icon={Radio}
            items={data.technology}
            accent="violet"
            placeholder="e.g. Wireless Apple CarPlay"
            onChange={(next) => setGroup('technology', next)}
          />
          <FeatureTagList
            title="Performance & Driving"
            icon={Gauge}
            items={data.performance}
            accent="orange"
            placeholder="e.g. Paddle shifters"
            onChange={(next) => setGroup('performance', next)}
          />
          <FeatureTagList
            title="Exterior"
            icon={Car}
            items={data.exterior}
            accent="teal"
            placeholder="e.g. LED Headlights"
            onChange={(next) => setGroup('exterior', next)}
          />
        </div>
      </Card>
    </div>
  );
}
