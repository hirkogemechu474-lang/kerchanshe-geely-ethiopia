// Shared chart color tokens for every admin BI/analytics dashboard
// (Executive Overview, CRM Dashboard, Workshop BI) — validated for
// colorblind-safety per Anthropic's dataviz method (CVD Delta E >= 8,
// normal-vision Delta E >= 15 on every adjacent pair). Slot 1 is swapped to
// the Geely brand blue (#0066FF) in place of the reference palette's default
// blue; re-validated with `validate_palette.js` and still passes every gate.
//
// Rules that matter when using these (see the dataviz skill for the full
// method):
// - Categorical hues are assigned in this fixed order, never cycled or
//   reassigned when a filter changes the series count — color follows the
//   entity, not its rank.
// - Only the first 3 slots are safe for all-pairs comparison (scatter/bubble/
//   small-multiples); bar/line/stacked charts with adjacent-only comparison
//   can use all 8, but fold anything past 8 series into "Other".
// - Sequential (single-hue magnitude, e.g. a heatmap or ordered funnel) uses
//   CHART_SEQUENTIAL_BLUE, light -> dark, never the categorical set.
// - Status colors are reserved for state (good/warning/serious/critical) and
//   must never be reused as a categorical series color, or vice versa.
export const CHART_CATEGORICAL = [
  '#0066FF', // 1 blue (Geely brand)
  '#eb6834', // 2 orange
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#4a3aa7', // 7 violet
  '#e34948', // 8 red
] as const;

// Single-hue sequential ramp (magnitude, light -> dark) — e.g. a heatmap
// cell or an ordered funnel stage. Not for identity/categorical use.
export const CHART_SEQUENTIAL_BLUE = [
  '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec',
  '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b',
] as const;

// Fixed — never themed, never reused as a categorical series color.
export const CHART_STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const;

// Chart chrome — recessive gridlines/axes so the data reads first.
export const CHART_CHROME = {
  gridline: '#e1e0d9',
  axis: '#c3c2b7',
  mutedText: '#898781',
} as const;
