'use client';

import { useId, useState } from 'react';
import { Plus, X } from 'lucide-react';

type Accent = 'blue' | 'teal' | 'emerald' | 'amber' | 'violet' | 'orange' | 'slate';

const ACCENT_MAP: Record<Accent, string> = {
  blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
  teal: 'from-teal-500 to-teal-600 bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100',
  emerald: 'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100',
  amber: 'from-amber-500 to-amber-600 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  violet: 'from-violet-500 to-violet-600 bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100',
  orange: 'from-orange-500 to-orange-600 bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
  slate: 'from-slate-500 to-slate-600 bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
};

/**
 * Add/remove chip-list editor for a string[] field. Extracted from the inline
 * `FeatureGroup` that used to live in vehicles/settings/page.tsx so it can be
 * reused across the Features, Specifications, and Vehicle Sections pages.
 */
export default function FeatureTagList({
  title, icon: Icon, items, accent, placeholder, onChange, suggestions,
}: {
  title: string;
  icon: any;
  items: string[];
  accent: Accent;
  placeholder: string;
  onChange: (next: string[]) => void;
  /** Optional curated values (e.g. from the Specifications reference list) shown as autocomplete suggestions. */
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState('');
  const datalistId = useId();
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  const cls = ACCENT_MAP[accent];
  const [_from, _to, bgColor, textColor, borderColor, hoverBg] = cls.split(' ');
  return (
    <div className={`rounded-xl border ${borderColor} bg-white`}>
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${borderColor} ${bgColor} rounded-t-xl`}>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${_from} ${_to} flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${textColor}`}>{title}</div>
          <div className="text-xs text-gray-500">{items.length} feature{items.length === 1 ? '' : 's'}</div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            placeholder={placeholder}
            list={suggestions?.length ? datalistId : undefined}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-offset-0 focus:ring-geely-blue focus:border-transparent"
          />
          {suggestions?.length ? (
            <datalist id={datalistId}>
              {suggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          ) : null}
          <button
            onClick={add}
            className={`inline-flex items-center justify-center gap-1 px-3 py-2 ${bgColor} ${textColor} border ${borderColor} rounded-lg text-sm font-medium hover:${hoverBg} transition-colors shrink-0`}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
          {items.length === 0 && (
            <div className="text-xs italic text-gray-400 py-1 px-1">No {title.toLowerCase()} added yet</div>
          )}
          {items.map((it, i) => (
            <div
              key={i}
              className={`group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 ${bgColor} ${textColor} border ${borderColor} rounded-full text-sm transition-all hover:shadow-sm`}
            >
              <span className="max-w-[min(48ch,60vw)] truncate">{it}</span>
              <button
                onClick={() => onChange(items.filter((_, j) => i !== j))}
                aria-label="Remove"
                className="p-0.5 rounded-full text-current/70 hover:bg-white hover:text-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
