'use client';

import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, ShieldAlert, AlertTriangle, Info, Trophy } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Link from 'next/link';
import { Card } from '@/components/admin/ui';
import { CHART_CATEGORICAL, CHART_CHROME, CHART_STATUS, CHART_SEQUENTIAL_BLUE } from '@/lib/chartPalette';

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

// Thin top-edge accent stripe — leadership KPI tiles only (see KpiTile);
// OverviewTile deliberately stays flat/borderless everywhere else it's used.
const TILE_ACCENT_BORDER = {
  blue: 'border-t-geely-blue',
  green: 'border-t-green-500',
  purple: 'border-t-purple-500',
  orange: 'border-t-orange-500',
  pink: 'border-t-pink-500',
  indigo: 'border-t-indigo-500',
} as const;

// Soft two-stop tint for the icon chip — a gentler version of TILE_ACCENTS'
// flat fill, KpiTile only (same "leadership tier gets a bit more polish"
// reasoning as TILE_ACCENT_BORDER; OverviewTile stays flat everywhere else).
const TILE_ACCENT_GRADIENT = {
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-geely-blue dark:from-blue-500/15 dark:to-blue-500/5 dark:text-blue-400',
  green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 dark:from-green-500/15 dark:to-green-500/5 dark:text-green-400',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 dark:from-purple-500/15 dark:to-purple-500/5 dark:text-purple-400',
  orange: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 dark:from-orange-500/15 dark:to-orange-500/5 dark:text-orange-400',
  pink: 'bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 dark:from-pink-500/15 dark:to-pink-500/5 dark:text-pink-400',
  indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 dark:from-indigo-500/15 dark:to-indigo-500/5 dark:text-indigo-400',
} as const;

// Same six hues as TILE_ACCENTS, as raw hex — used for the watermark icon
// and sparkline stroke, which are plain SVG and can't read Tailwind classes.
const TILE_ACCENT_HEX = {
  blue: '#0066FF',
  green: '#16a34a',
  purple: '#9333ea',
  orange: '#ea580c',
  pink: '#db2777',
  indigo: '#4f46e5',
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

/** Leadership KPI tile — an OverviewTile plus an optional period-over-period
 * delta, an optional achievement progress rail, and an optional inline
 * sparkline. The delta is never color-alone: it always ships with a
 * TrendingUp/TrendingDown icon and a signed percentage, using the shared
 * status colors (good/critical), not an invented green/red; the progress
 * rail reuses achievementColor()'s same good/warning/serious/critical
 * mapping so a tile's own color story is never freelanced. The watermark
 * icon and gradient chip are purely decorative chrome, not data encoding —
 * see OverviewTile's own comment for why that one stays flat. */
export function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'blue',
  trend,
  progressPct,
  sparkline,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: TileAccent;
  trend?: { pct: number; label: string } | null;
  /** 0-100 — renders a thin achievement-colored progress rail under the value. */
  progressPct?: number | null;
  /** Recent values (oldest -> newest) — renders a tiny inline trend area under the label. */
  sparkline?: number[] | null;
}) {
  const trendGood = trend != null && trend.pct >= 0;
  const hasSpark = sparkline && sparkline.length > 1;
  const sparkData = hasSpark ? sparkline!.map((v, i) => ({ i, v })) : [];
  const hex = TILE_ACCENT_HEX[accent];
  const railColor = progressPct != null ? achievementColor(progressPct) : null;

  return (
    <div
      className={cx(
        'relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-t-4 border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all',
        TILE_ACCENT_BORDER[accent]
      )}
    >
      <Icon className="absolute -right-3 -bottom-3 w-24 h-24 opacity-[0.04] dark:opacity-[0.06] pointer-events-none" style={{ color: hex }} />

      <div className="relative flex items-start justify-between">
        <div className={cx('inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 shadow-sm', TILE_ACCENT_GRADIENT[accent])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
            style={{ color: trendGood ? CHART_STATUS.good : CHART_STATUS.critical, backgroundColor: `${trendGood ? CHART_STATUS.good : CHART_STATUS.critical}14` }}
          >
            {trendGood ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trendGood ? '+' : ''}
            {trend.pct.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="relative text-[1.75rem] leading-tight font-bold text-gray-900 dark:text-gray-100 tabular-nums tracking-tight">{value}</div>
      <div className="relative text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>

      {hasSpark && (
        <div className="relative -mx-1 mt-2 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <defs>
                <linearGradient id={`kpi-spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hex} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={hex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={hex} strokeWidth={1.5} fill={`url(#kpi-spark-${accent})`} isAnimationActive={false} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {(hint || trend) && (
        <div className="relative text-xs text-gray-400 dark:text-gray-500 mt-1.5">{trend ? trend.label : hint}</div>
      )}

      {progressPct != null && (
        <div className="relative mt-2 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="h-1 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%`, backgroundColor: railColor! }} />
        </div>
      )}
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
  valueFormatter,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string;
  suffix?: string;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0];
  const num = Number(point.value ?? 0);
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{label}</p>
      <p className="tabular-nums text-gray-600 dark:text-gray-300">
        {valueFormatter ? valueFormatter(num) : `${num.toLocaleString()}${suffix}`}
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
  valueFormatter,
  axisFormatter,
}: {
  title: string;
  data: BarDatum[];
  suffix?: string;
  emptyLabel?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  /** Formats the tooltip's value — e.g. currency. Defaults to a plain number + suffix. */
  valueFormatter?: (value: number) => string;
  /** Formats the x-axis ticks — usually a compact version of valueFormatter. */
  axisFormatter?: (value: number) => string;
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
                tickFormatter={axisFormatter}
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
              <Tooltip content={<ChartTooltip suffix={suffix} valueFormatter={valueFormatter} />} cursor={{ fill: CURSOR_FILL }} />
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
  valueFormatter,
}: {
  title: string;
  segments: UtilizationSegment[];
  icon?: LucideIcon;
  emptyLabel?: string;
  /** Formats each segment's value in the tooltip/legend — e.g. currency. Defaults to a plain number. */
  valueFormatter?: (value: number) => string;
}) {
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString());
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
                          {String(p.dataKey)}: <span className="font-semibold text-gray-900 dark:text-gray-100">{fmt(p.value as number)}</span>
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
                {s.label}: <strong className="text-gray-900 dark:text-gray-100 tabular-nums">{fmt(s.value)}</strong>
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

interface IdentityDatum {
  label: string;
  count: number;
  revenue: number;
}

/** Horizontal bar chart where each bar IS a named entity (e.g. a vehicle
 * model) rather than an ordered magnitude ranking — so per the dataviz method
 * color carries identity (fixed categorical order) and is direct-labeled,
 * not a single brand hue. "Other" (a folded tail, not a real entity) always
 * gets the neutral chrome gray rather than stealing a categorical slot. */
export function SalesMixChart({
  title,
  data,
  valueFormatter,
  emptyLabel = 'No delivered orders yet',
  actions,
  icon: Icon,
}: {
  title: string;
  data: IdentityDatum[];
  valueFormatter: (value: number) => string;
  emptyLabel?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}) {
  const chartHeight = Math.max(160, data.length * 40);
  const totalCount = data.reduce((s, d) => s + d.count, 0);

  const colorFor = (label: string, index: number) =>
    label === 'Other' ? CHART_CHROME.mutedText : CHART_CATEGORICAL[index % CHART_CATEGORICAL.length];

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
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 84, bottom: 4, left: 4 }} barCategoryGap="28%">
              <CartesianGrid horizontal={false} stroke={CHART_CHROME.gridline} />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={132}
                tick={<CategoryTick />}
                axisLine={{ stroke: CHART_CHROME.axis }}
                tickLine={false}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: CURSOR_FILL }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as IdentityDatum;
                  const pct = totalCount > 0 ? Math.round((p.count / totalCount) * 100) : 0;
                  return (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg space-y-0.5">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{p.label}</p>
                      <p className="tabular-nums text-gray-600 dark:text-gray-300">
                        {p.count} unit{p.count === 1 ? '' : 's'} &middot; {pct}%
                      </p>
                      <p className="tabular-nums text-gray-400">{valueFormatter(p.revenue)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
                {data.map((d, i) => (
                  <Cell key={d.label} fill={colorFor(d.label, i)} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  formatter={(v: number) => {
                    const pct = totalCount > 0 ? Math.round((v / totalCount) * 100) : 0;
                    return `${v} (${pct}%)`;
                  }}
                  style={{ fill: CHART_CHROME.mutedText, fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

interface QuarterDatum {
  label: string;
  revenue: number;
  orders: number;
}

/** Revenue-over-time trend — a single series, so per the method this is an
 * area chart in one brand hue rather than a categorical multi-line. */
export function RevenueTrendChart({
  title,
  data,
  valueFormatter,
  axisFormatter,
  emptyLabel = 'No delivered revenue in this window yet',
}: {
  title: string;
  data: QuarterDatum[];
  valueFormatter: (value: number) => string;
  axisFormatter: (value: number) => string;
  emptyLabel?: string;
}) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {!hasData ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{emptyLabel}</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_CHROME.gridline} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
              axisLine={{ stroke: CHART_CHROME.axis }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={axisFormatter}
              tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
              axisLine={{ stroke: CHART_CHROME.axis }}
              tickLine={false}
              width={56}
            />
            <Tooltip
              cursor={{ stroke: CHART_CHROME.axis }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as QuarterDatum;
                return (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg space-y-0.5">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{p.label}</p>
                    <p className="tabular-nums text-gray-600 dark:text-gray-300">{valueFormatter(p.revenue)}</p>
                    <p className="tabular-nums text-gray-400">{p.orders} order{p.orders === 1 ? '' : 's'}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={CHART_CATEGORICAL[0]}
              strokeWidth={2}
              fill={CHART_CATEGORICAL[0]}
              fillOpacity={0.1}
              dot={{ r: 4, fill: CHART_CATEGORICAL[0], strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export interface ShowroomRankRow {
  id: string;
  name: string;
  revenue: number;
  units: number;
  achievementPct: number | null;
}

/** Ranked table (not a duplicate of the Revenue by Showroom bar chart above
 * it) — gives leadership the exact figures per branch: revenue, units sold,
 * and achievement against that branch's own monthly target. */
export function ShowroomRankingTable({
  title,
  rows,
  valueFormatter,
  emptyLabel = 'No orders booked yet this month',
}: {
  title: string;
  rows: ShowroomRankRow[];
  valueFormatter: (value: number) => string;
  emptyLabel?: string;
}) {
  const maxRevenue = Math.max(1, ...rows.map((r) => r.revenue));

  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-semibold w-10">#</th>
                <th className="text-left px-4 py-3 font-semibold">Showroom</th>
                <th className="text-left px-4 py-3 font-semibold">Units</th>
                <th className="text-left px-4 py-3 font-semibold">Revenue</th>
                <th className="text-left px-4 py-3 font-semibold">Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                    {i === 0 ? <Trophy className="w-4 h-4 text-amber-500" /> : i + 1}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 tabular-nums">{r.units}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums whitespace-nowrap">{valueFormatter(r.revenue)}</span>
                      <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${(r.revenue / maxRevenue) * 100}%`, backgroundColor: CHART_CATEGORICAL[0] }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AchievementPill pct={r.achievementPct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export interface RiskFlag {
  id: string;
  label: string;
  severity: 'critical' | 'serious' | 'warning';
  href: string;
}

const RISK_ICON = { critical: ShieldAlert, serious: AlertTriangle, warning: Info } as const;
const RISK_TEXT_CLASS = {
  critical: 'text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  serious: 'text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  warning: 'text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
} as const;

/** Leadership risk/flag list — each row keeps the shared status-color meaning
 * (critical/serious/warning), always paired with an icon and a text label so
 * severity is never color-alone. */
export function RiskFlagsList({ title, risks }: { title: string; risks: RiskFlag[] }) {
  return (
    <Card>
      <h3 className="flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
        <ShieldAlert className="w-4 h-4" style={{ color: CHART_STATUS.serious }} />
        {title}
      </h3>
      {risks.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
          No leadership-level risks flagged right now.
        </p>
      ) : (
        <ul className="space-y-2">
          {risks.map((risk) => {
            const RiskIcon = RISK_ICON[risk.severity];
            return (
              <li key={risk.id}>
                <Link
                  href={risk.href}
                  className={cx(
                    'flex items-center gap-2.5 text-sm rounded-lg border px-3 py-2.5 transition-colors hover:brightness-95',
                    RISK_TEXT_CLASS[risk.severity]
                  )}
                >
                  <RiskIcon className="w-4 h-4 shrink-0" />
                  {risk.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export interface FunnelStage {
  stage: string;
  count: number;
}

/** Ordered-stage funnel — each bar is the same lifecycle population getting
 * progressively filtered (e.g. quotation -> paid -> signed -> delivered), so
 * per the method this is a magnitude comparison across an ORDERED set, not
 * independent categories: one hue, light -> dark on the sequential ramp
 * (later stage = darker = "further committed"), with the conversion rate off
 * the previous stage in the tooltip and a direct count label on every bar. */
export function FunnelChart({
  title,
  stages,
  icon: Icon,
  emptyLabel = 'No pipeline data yet',
}: {
  title: string;
  stages: FunnelStage[];
  icon?: LucideIcon;
  emptyLabel?: string;
}) {
  const hasData = stages.some((s) => s.count > 0);
  const data = stages.map((s, i) => ({
    ...s,
    rate: i === 0 || stages[i - 1].count === 0 ? null : Math.round((s.count / stages[i - 1].count) * 100),
  }));
  const rampMax = CHART_SEQUENTIAL_BLUE.length - 1;
  const colorFor = (i: number) => CHART_SEQUENTIAL_BLUE[Math.round((i / Math.max(1, stages.length - 1)) * (rampMax * 0.7) + rampMax * 0.3)];

  return (
    <Card>
      <h3 className="flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {Icon && <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
        {title}
      </h3>
      {!hasData ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{emptyLabel}</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, stages.length * 44)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }} barCategoryGap="26%">
            <CartesianGrid horizontal={false} stroke={CHART_CHROME.gridline} />
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="stage"
              width={132}
              tick={<CategoryTick />}
              axisLine={{ stroke: CHART_CHROME.axis }}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: CURSOR_FILL }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof data)[number];
                return (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg space-y-0.5">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{p.stage}</p>
                    <p className="tabular-nums text-gray-600 dark:text-gray-300">{p.count.toLocaleString()}</p>
                    {p.rate != null && <p className="tabular-nums text-gray-400">{p.rate}% of prior stage</p>}
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
              {data.map((s, i) => (
                <Cell key={s.stage} fill={colorFor(i)} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                formatter={(v: number) => v.toLocaleString()}
                style={{ fill: CHART_CHROME.mutedText, fontSize: 11, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// Same 3 cut points (50/60/70) as the reference design this was modeled on,
// but mapped onto the app's own 4 reserved status colors (good/warning/
// serious/critical) instead of introducing brand-blue as a 5th "status" —
// the palette's own rule is that status colors and categorical/brand colors
// are never interchangeable (see chartPalette.ts).
export function achievementTier(pct: number): keyof typeof CHART_STATUS {
  if (pct >= 70) return 'good';
  if (pct >= 60) return 'warning';
  if (pct >= 50) return 'serious';
  return 'critical';
}

export function achievementColor(pct: number): string {
  return CHART_STATUS[achievementTier(pct)];
}

/** Thin labeled progress bar for one actual-vs-target figure — "part of a
 * planned whole", so a single filled bar (not a chart with axes) is the
 * right form; per the method, color still carries the status meaning, so
 * severity is never color-alone (the % and the target are always printed too). */
export function AchievementBar({
  label,
  value,
  target,
  valueFormatter,
  unit = '',
}: {
  label: string;
  value: number;
  target: number | null;
  valueFormatter?: (v: number) => string;
  unit?: string;
}) {
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString());
  const pct = target && target > 0 ? Math.round((value / target) * 100) : null;
  const color = pct != null ? achievementColor(pct) : CHART_CHROME.mutedText;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1.5">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {target != null ? (
            <>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{fmt(value)}</span> / {fmt(target)}
              {unit}
              {pct != null && (
                <strong className="ml-1.5" style={{ color }}>
                  {pct}%
                </strong>
              )}
            </>
          ) : (
            <span className="italic">No target set</span>
          )}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${Math.min(100, pct ?? 0)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Achievement % pill — the same status-color mapping as AchievementBar,
 * used inline in tables (e.g. Showroom Ranking) where a full bar would be
 * too wide. */
export function AchievementPill({ pct }: { pct: number | null }) {
  if (pct == null) {
    return <span className="text-xs text-gray-400 dark:text-gray-500 italic">No target</span>;
  }
  const color = achievementColor(pct);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {pct}%
    </span>
  );
}

export interface QuarterActualPlan {
  label: string;
  actual: number;
  plan: number | null;
  isCurrent: boolean;
  isFuture: boolean;
  projectedActual: number | null;
}

/** Grouped Actual-vs-Plan columns per quarter — two measures of the SAME
 * unit (currency) compared side by side, so per the one-axis rule this is
 * still a single y-axis with two series (not a dual-axis chart): Actual in
 * the brand hue, Plan in a light neutral tint, exactly the categorical-vs-
 * comparison pattern the method allows for <=3 series. */
export function QuarterlyPlanChart({
  title,
  data,
  valueFormatter,
  axisFormatter,
}: {
  title: string;
  data: QuarterActualPlan[];
  valueFormatter: (v: number) => string;
  axisFormatter: (v: number) => string;
}) {
  const hasAnyPlan = data.some((d) => d.plan != null);
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_CATEGORICAL[0] }} /> Actual</span>
          {hasAnyPlan && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_CHROME.gridline }} /> Plan</span>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke={CHART_CHROME.gridline} />
          <XAxis dataKey="label" tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} />
          <YAxis tickFormatter={axisFormatter} tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} width={56} />
          <Tooltip
            cursor={{ fill: CURSOR_FILL }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as QuarterActualPlan;
              return (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg space-y-0.5">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{p.label}</p>
                  <p className="tabular-nums text-gray-600 dark:text-gray-300">Actual: {valueFormatter(p.actual)}</p>
                  {p.plan != null && <p className="tabular-nums text-gray-400">Plan: {valueFormatter(p.plan)}</p>}
                  {p.isCurrent && p.projectedActual != null && (
                    <p className="tabular-nums text-gray-400">Full-quarter pace: {valueFormatter(p.projectedActual)}</p>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="actual" fill={CHART_CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          {hasAnyPlan && <Bar dataKey="plan" fill={CHART_CHROME.gridline} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />}
        </BarChart>
      </ResponsiveContainer>
      {data.some((d) => d.isCurrent && d.projectedActual != null) && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          *The in-progress quarter's actual is month-to-date; full-quarter pace projects to{' '}
          {valueFormatter(data.find((d) => d.isCurrent)?.projectedActual || 0)}
          {(() => {
            const cur = data.find((d) => d.isCurrent);
            return cur?.plan ? ` (${Math.round(((cur.projectedActual || 0) / cur.plan) * 100)}% of plan)` : '';
          })()}.
        </p>
      )}
    </Card>
  );
}

export interface DailyTrendPoint {
  day: number;
  label: string;
  cumulativeRevenue: number;
  pace: number | null;
}

/** Cumulative MTD revenue vs. the straight-line pace needed to hit the
 * monthly target — an "emphasis" chart (one series is the point, the other
 * is context), per the method: the actual line carries the brand hue, the
 * pace reference is a dashed neutral gray, never a second categorical color. */
export function MtdTrendChart({
  title,
  data,
  valueFormatter,
  axisFormatter,
}: {
  title: string;
  data: DailyTrendPoint[];
  valueFormatter: (v: number) => string;
  axisFormatter: (v: number) => string;
}) {
  const hasPace = data.some((d) => d.pace != null);
  const hasRevenue = data.some((d) => d.cumulativeRevenue > 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Revenue Trend — Month to Date</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cumulative booked revenue, day by day</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: CHART_CATEGORICAL[0] }} /> Actual</span>
          {hasPace && <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded-full border-t-2 border-dashed" style={{ borderColor: CHART_CHROME.mutedText }} /> Pace to Target</span>}
        </div>
      </div>
      {!hasRevenue ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-10 text-center">No orders booked yet this month.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_CHROME.gridline} />
            <XAxis dataKey="label" tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} />
            <YAxis tickFormatter={axisFormatter} tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} width={56} />
            <Tooltip
              cursor={{ stroke: CHART_CHROME.axis }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as DailyTrendPoint;
                return (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg space-y-0.5">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Day {p.day}</p>
                    <p className="tabular-nums text-gray-600 dark:text-gray-300">Actual: {valueFormatter(p.cumulativeRevenue)}</p>
                    {p.pace != null && <p className="tabular-nums text-gray-400">Pace to target: {valueFormatter(p.pace)}</p>}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulativeRevenue"
              stroke={CHART_CATEGORICAL[0]}
              strokeWidth={2}
              fill={CHART_CATEGORICAL[0]}
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {hasPace && (
              <Line
                type="monotone"
                dataKey="pace"
                stroke={CHART_CHROME.mutedText}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
