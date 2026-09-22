'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin, Music, Send, Shield,
} from 'lucide-react';
import { withBasePath } from '@/lib/publicPath';
import { useTranslation } from '@/lib/i18n';
import Button from '@/components/ui/Button';

interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
}

interface FooterVehicle {
  id: string;
  name: string;
  slug: string;
}

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

interface FooterContent {
  columns: FooterColumn[];
  legalLinks: FooterLink[];
}

// Matches the arrays that used to be hardcoded here — used as the initial
// render (before /api/public/footer resolves) and as a fallback if that
// request fails, so the footer never flashes empty.
const FALLBACK_FOOTER_CONTENT: FooterContent = {
  columns: [
    {
      heading: 'Company',
      links: [
        { label: 'Home', href: '/' },
        { label: 'About Geely Ethiopia', href: '/about' },
        { label: 'News & Media', href: '/news' },
        { label: 'Customer Reviews', href: '/testimonials' },
      ],
    },
    { heading: 'Models', links: [] },
    {
      heading: 'After-Sales Services',
      links: [
        { label: 'Service Booking', href: '/service' },
        { label: 'Warranty', href: '/warranty' },
        { label: 'Spare Parts', href: '/parts' },
        { label: 'Roadside Assistance', href: '/roadside' },
      ],
    },
    { heading: 'Support', links: [{ label: 'Contact Us', href: '/contact' }] },
  ],
  legalLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

interface ContactInfo {
  headquarters: {
    name: string;
    address: { street: string; area: string; city: string; region: string; country: string; postalCode: string };
    coordinates?: { latitude: number; longitude: number };
  };
  phone: { primary: string; sales: string; service: string; parts: string; emergency?: string };
  email: { general: string; sales: string; service: string; support: string; careers?: string };
  whatsapp?: string;
  website?: string;
}

const FALLBACK_CONTACT: ContactInfo = {
  headquarters: {
    name: 'Geely Ethiopia, Kerchanshe Group Geely HQ',
    address: {
      street: 'Sarbet Area',
      area: 'Bole Sub-city',
      city: 'Addis Ababa',
      region: 'Addis Ababa',
      country: 'Ethiopia',
      postalCode: '1000',
    },
  },
  phone: {
    primary: '+251 99 338 9874',
    sales: '+251 11 000 0001',
    service: '+251 11 000 0002',
    parts: '+251 11 000 0003',
    emergency: '+251 99 338 9874',
  },
  email: {
    general: 'info@geelyethiopia.com',
    sales: 'sales@geelyethiopia.com',
    service: 'service@geelyethiopia.com',
    support: 'support@geelyethiopia.com',
  },
  whatsapp: '+251 99 338 9874',
  website: 'https://geelyethiopia.com',
};

// Four columns — Company / Models / After-Sales Services / Support — mirrors
// the footer pattern on Geely's regional distributor sites (e.g. geely.com.eg)
// rather than the wider set of sections the site happens to have pages for.
export function Footer() {
  const { t } = useTranslation();
  const [socialMedia, setSocialMedia] = useState<SocialMediaLinks>({});
  const [contact, setContact] = useState<ContactInfo>(FALLBACK_CONTACT);
  const [vehicles, setVehicles] = useState<FooterVehicle[]>([]);
  const [footerContent, setFooterContent] = useState<FooterContent>(FALLBACK_FOOTER_CONTENT);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [emailDraft, setEmailDraft] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    Promise.all([
      fetch('/api/public/contact-information')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setContact({ ...FALLBACK_CONTACT, ...d }))
        .catch(() => {}),
      fetch('/api/public/social-media')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) {
            // Accept both flat-object and newer {facebook:{url:...}} shape
            const flat: SocialMediaLinks = {};
            for (const k of ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'tiktok']) {
              const v = d[k];
              if (!v) continue;
              if (typeof v === 'string') flat[k as keyof SocialMediaLinks] = v;
              else if (typeof v === 'object' && typeof v.url === 'string') flat[k as keyof SocialMediaLinks] = v.url;
            }
            setSocialMedia(flat);
          }
        })
        .catch(() => {}),
      fetch('/api/public/vehicles')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const list = Array.isArray(d) ? d : d?.vehicles || [];
          setVehicles(list.slice(0, 5));
        })
        .catch(() => {}),
      // Column headings/links (Company, After-Sales Services, Support's
      // "Contact Us" link) and the legal links row — admin-editable at
      // Settings > Footer Content. Falls back to the same values that used
      // to be hardcoded here if the request fails or hasn't resolved yet.
      fetch('/api/public/footer')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && Array.isArray(d.columns) && Array.isArray(d.legalLinks)) {
            setFooterContent(d);
          }
        })
        .catch(() => {}),
    ]);
  }, []);

  const companyLinks = (footerContent.columns[0]?.links || []).map((l) => ({ name: l.label, href: l.href }));
  const modelsHeading = footerContent.columns[1]?.heading || 'Models';

  // Sourced from /api/public/vehicles (active + published models, DB-driven)
  // rather than a fixed list, so this stays correct as models are added,
  // renamed, or retired in admin. (The "Models" column's own `links` in
  // footer_content are always empty and ignored here — only its heading is
  // admin-editable — see the comment in backend/src/routes/public.routes.ts.)
  const vehicleLinks = vehicles.map((v) => ({
    name: v.name.replace(/^Geely\s+/i, '').trim() || v.name,
    href: `/models/${v.slug}`,
  }));

  const afterSalesLinks = (footerContent.columns[2]?.links || []).map((l) => ({ name: l.label, href: l.href }));
  const supportHeading = footerContent.columns[3]?.heading || 'Support';
  const supportLinks = (footerContent.columns[3]?.links || []).map((l) => ({ name: l.label, href: l.href }));

  const socials: { key: keyof Required<SocialMediaLinks>; Icon: typeof Facebook; label: string; hover: string }[] = [
    { key: 'facebook', Icon: Facebook, label: 'Facebook', hover: 'hover:bg-blue-600' },
    { key: 'instagram', Icon: Instagram, label: 'Instagram', hover: 'hover:bg-pink-600' },
    { key: 'twitter', Icon: Twitter, label: 'Twitter / X', hover: 'hover:bg-slate-800' },
    { key: 'youtube', Icon: Youtube, label: 'YouTube', hover: 'hover:bg-red-600' },
    { key: 'linkedin', Icon: Linkedin, label: 'LinkedIn', hover: 'hover:bg-blue-700' },
    { key: 'tiktok', Icon: Music, label: 'TikTok', hover: 'hover:bg-black' },
  ];

  const anySocial = Object.values(socialMedia).some((v) => !!v);

  const address = [
    contact.headquarters.address.street,
    contact.headquarters.address.area,
    contact.headquarters.address.city,
    contact.headquarters.address.country,
  ].filter(Boolean).join(', ');

  return (
    <footer className="bg-black text-white">
      <div className="page-container py-14">
        {/* Logo */}
        <img
          src={withBasePath('/assets/logos/geely-logo.png')}
          alt="Geely Ethiopia"
          width={1920}
          height={1080}
          className="h-10 md:h-11 w-auto max-w-[140px] object-contain brightness-0 invert mb-10"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <FooterColTitle>{footerContent.columns[0]?.heading || 'Company'}</FooterColTitle>
            <ul className="mt-5 space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterColTitle>{modelsHeading}</FooterColTitle>
            <ul className="mt-5 space-y-2.5">
              {vehicleLinks.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterColTitle>{footerContent.columns[2]?.heading || 'After-Sales Services'}</FooterColTitle>
            <ul className="mt-5 space-y-2.5">
              {afterSalesLinks.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterColTitle>{supportHeading}</FooterColTitle>
            <ul className="mt-5 space-y-2.5">
              {supportLinks.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
              <li>
                <a href={`tel:${contact.phone.sales}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                  <Phone size={13} /> {contact.phone.sales}
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email.general}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                  <Mail size={13} /> {contact.email.general}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <MapPin size={13} className="shrink-0 mt-0.5" /> {address}
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
          <div>
            <div className="font-bold text-white text-sm">{t('footer.stayConnected')}</div>
            <div className="text-xs mt-1 text-white/60">{t('footer.newsletter')}</div>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const email = emailDraft.trim();
              if (!email || subscribing) return;
              setSubscribing(true);
              setSubscribeError(null);
              try {
                const res = await fetch('/api/newsletter/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setSubscribeError(data.error || 'Subscription failed. Please try again.');
                } else {
                  setSubscribed(true);
                  setEmailDraft('');
                  setTimeout(() => setSubscribed(false), 6000);
                }
              } catch {
                setSubscribeError('Subscription failed. Please try again.');
              } finally {
                setSubscribing(false);
              }
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 sm:w-72">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-active-blue/40 focus:border-active-blue/50"
              />
            </div>
            <Button type="submit" variant="outline" tone="dark" size="md" className="whitespace-nowrap">
              {subscribing ? 'Subscribing...' : subscribed ? '✓ Subscribed' : (<>{t('footer.subscribe')} <Send size={13} /></>)}
            </Button>
          </form>
        </div>
        {subscribeError && (
          <div className="mt-2 text-xs text-red-300 font-medium inline-flex items-center gap-1.5">
            <Shield size={13} />
            {subscribeError}
          </div>
        )}

        {/* Bottom bar — socials, legal, copyright */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap order-2 sm:order-1">
            {socials
              .filter(({ key }) => anySocial && !!socialMedia[key])
              .map(({ key, Icon, label, hover }) => (
                <a
                  key={key}
                  href={socialMedia[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white ${hover} transition-all`}
                >
                  <Icon size={15} />
                </a>
              ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60 order-1 sm:order-2">
            {footerContent.legalLinks.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-white transition">{l.label}</Link>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-white/70">
          © {currentYear} Geely Ethiopia · Official distributor: Kerchanshe Group Geely. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterColTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-white font-bold text-sm tracking-wide">{children}</h4>;
}
