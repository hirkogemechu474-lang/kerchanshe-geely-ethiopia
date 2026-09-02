'use client';

import { useEffect, useState } from 'react';
import { Gauge, Settings, Car, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader, Card, Button } from '@/components/admin/ui';
import FeatureTagList from '@/components/admin/vehicles/FeatureTagList';
import type { VehicleSpecificationLists } from '@/lib/vehicle-settings-types';

const EMPTY: VehicleSpecificationLists = { engine: [], transmission: [], fuelType: [], driveType: [] };

export default function VehicleSpecificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VehicleSpecificationLists>(EMPTY);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/vehicle-specifications');
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setGroup = (key: keyof VehicleSpecificationLists, next: string[]) =>
    setData((d) => ({ ...d, [key]: next }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/vehicle-specifications', {
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
          Loading specifications...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Specifications"
        description="Curated engine, transmission, fuel, and drivetrain options — suggested as you type in a vehicle's Performance tab"
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
            title="Engine Options"
            icon={Gauge}
            items={data.engine}
            accent="blue"
            placeholder="e.g. 2.0L Turbo Petrol - 238 HP"
            onChange={(next) => setGroup('engine', next)}
          />
          <FeatureTagList
            title="Transmission Options"
            icon={Settings}
            items={data.transmission}
            accent="teal"
            placeholder="e.g. 6-Speed Manual"
            onChange={(next) => setGroup('transmission', next)}
          />
          <FeatureTagList
            title="Fuel / Energy Type"
            icon={Gauge}
            items={data.fuelType}
            accent="emerald"
            placeholder="e.g. Plug-in Hybrid (PHEV)"
            onChange={(next) => setGroup('fuelType', next)}
          />
          <FeatureTagList
            title="Drivetrain Options"
            icon={Car}
            items={data.driveType}
            accent="violet"
            placeholder="e.g. All-Wheel Drive (AWD)"
            onChange={(next) => setGroup('driveType', next)}
          />
        </div>
      </Card>
    </div>
  );
}
