'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin, Music, Send, Shield,
} from 'lucide-react';
import { withBasePath } from '@/lib/publicPath';
import { useTranslation } from '@/lib/i18n';

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
    name: 'Geely Ethiopia — Kerchanshe Group Geely HQ',
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
    primary: '+251 11 000 0000',
    sales: '+251 11 000 0001',
    service: '+251 11 000 0002',
    parts: '+251 11 000 0003',
    emergency: '+251 911 000 000',
  },
  email: {
    general: 'info@geelyethiopia.com',
    sales: 'sales@geelyethiopia.com',
    service: 'service@geelyethiopia.com',
    support: 'support@geelyethiopia.com',
  },
  whatsapp: '+251 911 000 000',
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
      fetch('/api/settings/social-media')
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
    ]);
  }, []);

  const companyLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Geely Ethiopia', href: '/about' },
    { name: 'News & Media', href: '/news' },
    { name: 'Customer Reviews', href: '/testimonials' },
  ];

  // Sourced from /api/public/vehicles (active + published models, DB-driven)
  // rather than a fixed list, so this stays correct as models are added,
  // renamed, or retired in admin.
  const vehicleLinks = vehicles.map((v) => ({
    name: v.name.replace(/^Geely\s+/i, '').trim() || v.name,
    href: `/models/${v.slug}`,
  }));

  const afterSalesLinks = [
    { name: 'Service Booking', href: '/service' },
    { name: 'Warranty', href: '/warranty' },
    { name: 'Spare Parts', href: '/parts' },
    { name: 'Roadside Assistance', href: '/roadside' },
  ];

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
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Logo */}
        <img
          src={withBasePath('/assets/logos/geely-logo.png')}
          alt="Geely Ethiopia"
          className="h-9 w-auto max-w-[124px] object-contain bg-white rounded p-1 mb-10"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <FooterColTitle>Company</FooterColTitle>
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
            <FooterColTitle>Models</FooterColTitle>
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
            <FooterColTitle>After-Sales Services</FooterColTitle>
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
            <FooterColTitle>Support</FooterColTitle>
            <ul className="mt-5 space-y-2.5">
              <li>
                <Link href="/contact" className="text-sm text-white/70 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
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
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-bright/40 focus:border-blue-bright/50"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-bright text-black text-sm font-bold hover:bg-white transition-all whitespace-nowrap"
            >
              {subscribing ? 'Subscribing...' : subscribed ? '✓ Subscribed' : (<>{t('footer.subscribe')} <Send size={13} /></>)}
            </button>
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
            <Link href="/privacy" className="hover:text-white transition">{t('footer.privacyPolicy')}</Link>
            <Link href="/terms" className="hover:text-white transition">{t('footer.termsOfService')}</Link>
            <Link href="/cookies" className="hover:text-white transition">{t('footer.cookiePolicy')}</Link>
          </div>
        </div>

        <div className="mt-4 text-xs text-white/40">
          © {currentYear} Geely Ethiopia · Official distributor: Kerchanshe Group Geely. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterColTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-white font-bold text-sm tracking-wide">{children}</h4>;
}
