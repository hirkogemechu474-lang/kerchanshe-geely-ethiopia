import { BarChart3, Settings, ArrowRight, Car, Zap, Award, Calendar, MapPin, Phone, Star, type LucideIcon } from 'lucide-react';

// Shared shape for admin-editable nav entries (SiteNavItem in the DB) — used
// by both Header.tsx (TOP_NAV) and VehicleDropdown.tsx (MODELS_QUICK_ACTIONS)
// so neither has to import a type from the other.
export interface SiteNavItem {
  id: string;
  label: string;
  subtitle?: string | null;
  href: string;
  icon: string | null;
  openInNewTab: boolean;
  isHighlighted?: boolean;
  displayOrder: number;
}

// Resolves a SiteNavItem.icon string (picked from a fixed allowlist in the
// admin form — see admin/lib/siteNavIcons.ts, keep both lists in sync) to an
// actual icon component. Never render an icon name that isn't in this map.
export const NAV_ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Settings,
  ArrowRight,
  Car,
  Zap,
  Award,
  Calendar,
  MapPin,
  Phone,
  Star,
};

export function resolveNavIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  return NAV_ICON_MAP[name] || null;
}
