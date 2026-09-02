'use client';

import { ReactNode, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/admin/ui';

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const TILE_ACCENTS = {
  blue: 'bg-blue-50 text-geely-blue dark:bg-blue-500/10 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
} as const;

export type TileAccent = keyof typeof TILE_ACCENTS;

/** KPI tile for the overview row — flat surface + colored icon chip, no gradient blocks. */
export function OverviewTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'blue',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: TileAccent;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={cx('inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3', TILE_ACCENTS[accent])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
      {hint && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{hint}</div>}
    </div>
  );
}

interface BarDatum {
  label: string;
  value: number;
}

/** Horizontal ranking bar chart — one hue (the categories have no natural order,
 * so color encodes nothing extra; the label carries identity, the bar carries magnitude). */
export function RankedBarChart({
  title,
  data,
  suffix = '',
  emptyLabel = 'No data yet',
  actions,
}: {
  title: string;
  data: BarDatum[];
  suffix?: string;
  emptyLabel?: string;
  actions?: ReactNode;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {actions}
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{emptyLabel}</p>
      ) : (
        <div className="space-y-3.5">
          {data.map((item, i) => {
            const pct = (item.value / max) * 100;
            const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div
                key={item.label}
                className="group"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center justify-between mb-1.5 gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums shrink-0">
                    {item.value.toLocaleString()}
                    {suffix}
                  </span>
                </div>
                <div className="relative w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={cx(
                      'h-2.5 bg-geely-blue dark:bg-blue-500 transition-all duration-500 ease-out',
                      hovered === i && 'bg-blue-700 dark:bg-blue-400'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {hovered === i && total > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{share}% of total</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

interface StatusDatum {
  status: string;
  label: string;
  count: number;
  /** Tailwind solid-fill class, e.g. "bg-geely-blue" — kept in sync with the app's status badge colors. */
  fillClass: string;
}

/** Horizontal bar-by-status chart. Each bar keeps the same hue used for that status's
 * badge elsewhere in the app, so color means the same thing everywhere a status appears. */
export function StatusBarChart({ title, data }: { title: string; data: StatusDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) return null;

  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 w-32 shrink-0 truncate">{item.label}</span>
            <div className="relative flex-1 bg-gray-100 dark:bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
              <div
                className={cx('h-2.5 transition-all duration-500 ease-out', item.fillClass)}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums w-8 text-right shrink-0">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
