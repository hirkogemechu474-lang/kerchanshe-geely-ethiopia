'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Shuffle, CheckCircle2, Sparkles } from 'lucide-react';
import type { AssignmentRules } from '@/lib/assignSalesRep';

const DEFAULT_RULES: AssignmentRules = {
  lowestWorkload: true,
  availability: false,
  workingHours: false,
  specialization: false,
  branch: true,
  managersOnly: false,
};

const FACTORS: { key: keyof AssignmentRules; label: string; description: string }[] = [
  {
    key: 'managersOnly',
    label: 'Managers only',
    description: 'Only ever assign new leads to sales_manager-role users — regular sales reps are excluded entirely, not just deprioritized.',
  },
  {
    key: 'lowestWorkload',
    label: 'Lowest active workload',
    description: 'Prefer the sales rep with the fewest open quotations + open sales orders right now.',
  },
  {
    key: 'availability',
    label: 'Agent availability',
    description: 'Only consider reps marked "Available for leads" on their user profile.',
  },
  {
    key: 'workingHours',
    label: 'Working hours',
    description: 'Only consider reps whose configured lead-hours window includes the current time.',
  },
  {
    key: 'specialization',
    label: 'Vehicle brand specialization',
    description: "Prefer reps whose profile lists the lead's vehicle brand as a specialization.",
  },
  {
    key: 'branch',
    label: 'Branch / location',
    description: "Prefer reps at the lead's preferred dealer/branch when one is known.",
  },
];

export default function AssignmentRulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<AssignmentRules>(DEFAULT_RULES);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/assignment-rules');
        if (res.ok) {
          const json = await res.json();
          setRules({ ...DEFAULT_RULES, ...json });
        }
      } catch {
        setRules(DEFAULT_RULES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/assignment-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        alert('Failed to save assignment rules');
      }
    } catch {
      alert('Failed to save assignment rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <Sparkles className="animate-spin w-5 h-5" /> Loading assignment rules...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
          <h1 className="text-2xl font-bold">Lead Assignment Rules</h1>
          <p className="text-gray-600">
            Choose which factors nextSalesRep() considers when auto-assigning a new lead. Off factors are ignored;
            every "on" factor narrows the candidate pool before the next one is applied.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
          {savedAt && (
            <span className="ml-1 text-xs text-blue-100 opacity-90 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved {savedAt}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-geely-blue via-indigo-500 to-navy p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <Shuffle className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">Assignment Factors</h2>
              <p className="text-blue-100 text-sm">Applied in this order, each narrowing the pool from the previous one</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {FACTORS.map((factor) => (
            <label
              key={factor.key}
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={rules[factor.key]}
                onChange={(e) => setRules((r) => ({ ...r, [factor.key]: e.target.checked }))}
                className="mt-1 rounded text-geely-blue focus:ring-geely-blue"
              />
              <div>
                <div className="font-semibold text-gray-900 text-sm">{factor.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{factor.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
        Availability, working hours, and specialization are set per rep on their user profile (
        <Link href="/admin/users" className="underline font-semibold">
          Users &amp; Roles
        </Link>
        ). A manager can always manually reassign any quotation regardless of these rules.
      </div>
    </div>
  );
}
