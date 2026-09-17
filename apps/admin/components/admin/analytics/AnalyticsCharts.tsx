'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/admin/ui';
import { CHART_CATEGORICAL, CHART_CHROME } from '@/lib/chartPalette';

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

/** KPI tile for the overview row — flat surface + colored icon chip, no gradient blocks.
 * Per the dataviz method a single headline number is correctly NOT a chart, so this
 * stays a stat tile (label + value + optional hint), just with a bit more polish. */
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
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
      {hint && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{hint}</div>}
    </div>
  );
}

interface BarDatum {
  label: string;
  value: number;
}

function truncateLabel(value: string, max = 22) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Shared category (y-axis) tick for horizontal bar charts — right-aligned,
 * truncated so long vehicle/category names never overlap the plot area. The
 * full label is still available in the tooltip. */
function CategoryTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (x === undefined || y === undefined || !payload) return null;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill={CHART_CHROME.mutedText}>
      {truncateLabel(payload.value)}
    </text>
  );
}

/** Shared hover tooltip — every chart needs one per the dataviz method. Rendered
 * as a normal DOM node (not SVG) so it can use the app's existing dark: convention. */
function ChartTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{label}</p>
      <p className="tabular-nums text-gray-600 dark:text-gray-300">
        {Number(point.value ?? 0).toLocaleString()}
        {suffix}
      </p>
    </div>
  );
}

const CURSOR_FILL = 'rgba(148, 163, 184, 0.14)';

/** Horizontal ranking bar chart — one hue (the categories have no natural order,
 * so color encodes nothing extra; the label carries identity, the bar carries magnitude). */
export function RankedBarChart({
  title,
  data,
  suffix = '',
  emptyLabel = 'No data yet',
  actions,
  icon: Icon,
}: {
  title: string;
  data: BarDatum[];
  suffix?: string;
  emptyLabel?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}) {
  const chartHeight = Math.max(140, data.length * 44);

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-gray-100">
          {Icon && <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
          {title}
        </h3>
        {actions}
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{emptyLabel}</p>
      ) : (
        <div style={{ width: '100%', height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 4 }} barCategoryGap="30%">
              <CartesianGrid horizontal={false} stroke={CHART_CHROME.gridline} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: CHART_CHROME.mutedText, fontSize: 12 }}
                axisLine={{ stroke: CHART_CHROME.axis }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={132}
                tick={<CategoryTick />}
                axisLine={{ stroke: CHART_CHROME.axis }}
                tickLine={false}
                interval={0}
              />
              <Tooltip content={<ChartTooltip suffix={suffix} />} cursor={{ fill: CURSOR_FILL }} />
              <Bar dataKey="value" fill={CHART_CATEGORICAL[0]} radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

interface UtilizationSegment {
  label: string;
  value: number;
  color: string;
}

/** Single stacked horizontal bar showing how a fixed total splits across a
 * small number of named segments (e.g. bays busy vs. available) — this is a
 * proportion of one whole, not a magnitude comparison across independent
 * categories, so per the method it renders as one bar + a direct-labeled
 * legend rather than per-category bars. */
export function UtilizationBar({
  title,
  segments,
  icon: Icon,
  emptyLabel = 'No data yet',
}: {
  title: string;
  segments: UtilizationSegment[];
  icon?: LucideIcon;
  emptyLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const chartData = [{ name: 'total', ...Object.fromEntries(segments.map((s) => [s.label, s.value])) }];

  return (
    <Card>
      <h3 className="flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {Icon && <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
        {title}
      </h3>
      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{emptyLabel}</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={56}>
            <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
              <XAxis type="number" hide domain={[0, total]} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                cursor={{ fill: CURSOR_FILL }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg space-y-0.5">
                      {payload.map((p) => (
                        <p key={String(p.dataKey)} className="text-gray-600 dark:text-gray-300">
                          {String(p.dataKey)}: <span className="font-semibold text-gray-900 dark:text-gray-100">{p.value as number}</span>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              {segments.map((s, i) => (
                <Bar
                  key={s.label}
                  dataKey={s.label}
                  stackId="util"
                  fill={s.color}
                  radius={[i === 0 ? 4 : 0, i === segments.length - 1 ? 4 : 0, i === segments.length - 1 ? 4 : 0, i === 0 ? 4 : 0]}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            {segments.map((s) => (
              <span key={s.label} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}: <strong className="text-gray-900 dark:text-gray-100 tabular-nums">{s.value}</strong>
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

interface StatusDatum {
  status: string;
  label: string;
  count: number;
  /** Hex color for this status — callers pass CHART_STATUS values (or a neutral
   * chrome gray for non-terminal/inactive states), never an invented hex. */
  color: string;
}

/** Horizontal bar-by-status chart. Each bar keeps the same status color used
 * elsewhere in the app (badges, etc.), so color means the same thing everywhere
 * a status appears. Categories are named directly on the y-axis, so — per the
 * dataviz method — a single-measure chart like this needs no separate legend box. */
export function StatusBarChart({ title, data }: { title: string; data: StatusDatum[] }) {
  const chartHeight = Math.max(160, data.length * 40);

  if (data.length === 0) return null;

  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">{title}</h3>
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 4 }} barCategoryGap="26%">
            <CartesianGrid horizontal={false} stroke={CHART_CHROME.gridline} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: CHART_CHROME.mutedText, fontSize: 12 }}
              axisLine={{ stroke: CHART_CHROME.axis }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={132}
              tick={<CategoryTick />}
              axisLine={{ stroke: CHART_CHROME.axis }}
              tickLine={false}
              interval={0}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: CURSOR_FILL }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
