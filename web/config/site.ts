/**
 * Static site-wide configuration values.
 */

export const SITE_CONFIG = {
  name: 'Geely Ethiopia',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://geelyethiopia.com',
  description:
    'Official distributor of Geely vehicles in Ethiopia. Browse SUVs, sedans, and EVs.',
  defaultLocale: 'en',
  supportedLocales: ['en', 'am'] as const,
  currency: 'ETB',
  timezone: 'Africa/Addis_Ababa',
} as const;

export const NAV_LINKS = [
  { label: 'Models',    href: '/models' },
  { label: 'Electric',  href: '/electric' },
  { label: 'Services',  href: '/service' },
  { label: 'Dealers',   href: '/dealers' },
  { label: 'Financing', href: '/financing' },
  { label: 'News',      href: '/news' },
] as const;
