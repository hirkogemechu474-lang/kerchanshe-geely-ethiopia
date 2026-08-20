// Fixed allowlist of icon names an admin can pick for a SiteNavItem. Kept as
// plain strings here (no lucide import needed in the admin app's own UI) —
// the public website resolves these same names to actual icon components in
// web/lib/navIcons.ts. Keep both lists in sync.
export const SITE_NAV_ICON_OPTIONS = [
  'BarChart3',
  'Settings',
  'ArrowRight',
  'Car',
  'Zap',
  'Award',
  'Calendar',
  'MapPin',
  'Phone',
  'Star',
] as const;
