'use client';

import { useCallback, useEffect, useState } from 'react';
import { Target, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, Button, PageHeader } from '@/components/admin/ui';
import apiClient from '@/lib/apiClient';

interface DealerTargetRow {
  dealerId: string;
  name: string;
  revenueTarget: number | null;
  unitsTarget: number | null;
}

interface TargetsResponse {
  month: string;
  company: { revenueTarget: number; unitsTarget: number } | null;
  dealers: DealerTargetRow[];
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** One editable revenue+units row — used for both the company-wide target
 * and each showroom's own row, so both save through the same PUT shape
 * (dealerId omitted/null = company-wide). */
function TargetRow({
  label,
  revenueTarget,
  unitsTarget,
  onSave,
  highlight,
}: {
  label: string;
  revenueTarget: number | null;
  unitsTarget: number | null;
  onSave: (revenueTarget: number, unitsTarget: number) => Promise<void>;
  highlight?: boolean;
}) {
  const [revenue, setRevenue] = useState(revenueTarget != null ? String(revenueTarget) : '');
  const [units, setUnits] = useState(unitsTarget != null ? String(unitsTarget) : '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRevenue(revenueTarget != null ? String(revenueTarget) : '');
    setUnits(unitsTarget != null ? String(unitsTarget) : '');
  }, [revenueTarget, unitsTarget]);

  const handleSave = async () => {
    const revenueNum = Number(revenue);
    const unitsNum = Number(units);
    if (!Number.isFinite(revenueNum) || revenueNum < 0 || !Number.isInteger(unitsNum) || unitsNum < 0) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSave(revenueNum, unitsNum);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className={highlight ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}>
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{label}</td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          placeholder="e.g. 45000000"
          className="w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          placeholder="e.g. 150"
          className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
        />
      </td>
      <td className="px-4 py-3">
        <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Saved' : 'Save'}
        </Button>
      </td>
    </tr>
  );
}

export default function SalesTargetsSettings() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<TargetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (m: string) => {
    setLoading(true);
    setError('');
    try {
      const { data: result } = await apiClient.get<TargetsResponse>('/sales-targets', { params: { month: m } });
      setData(result);
    } catch {
      setError('Failed to load sales targets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month); }, [month, load]);

  const saveTarget = async (dealerId: string | null, revenueTarget: number, unitsTarget: number) => {
    await apiClient.put('/sales-targets', { month, dealerId, revenueTarget, unitsTarget });
    await load(month);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sales Targets"
        description="Monthly revenue and unit quotas — company-wide and per showroom. These drive every Achievement % and vs-Plan figure on the Executive Overview and Sales Dashboard."
        actions={
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        }
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-geely-blue animate-spin" />
        </div>
      ) : (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-geely-blue" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Targets for {monthLabel(data.month)}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Scope</th>
                  <th className="text-left px-4 py-3 font-semibold">Revenue Target (ETB)</th>
                  <th className="text-left px-4 py-3 font-semibold">Units Target</th>
                  <th className="text-left px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <TargetRow
                  label="Company-wide"
                  revenueTarget={data.company?.revenueTarget ?? null}
                  unitsTarget={data.company?.unitsTarget ?? null}
                  onSave={(revenue, units) => saveTarget(null, revenue, units)}
                  highlight
                />
                {data.dealers.map((d) => (
                  <TargetRow
                    key={d.dealerId}
                    label={d.name}
                    revenueTarget={d.revenueTarget}
                    unitsTarget={d.unitsTarget}
                    onSave={(revenue, units) => saveTarget(d.dealerId, revenue, units)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {data.dealers.length === 0 && (
            <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">No active showrooms found — add one under Dealers first.</p>
          )}
        </Card>
      )}
    </div>
  );
}
