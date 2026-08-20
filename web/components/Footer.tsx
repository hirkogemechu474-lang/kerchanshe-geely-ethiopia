'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin, Music,
  Clock, Award, Headphones, ExternalLink, Send, Shield, MessageCircle,
} from 'lucide-react';

interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
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

interface HoursSettings {
  workdays?: string;
  saturday?: string;
  sunday?: string;
  note?: string;
}

// Shape returned by /api/public/business-settings (admin/app/admin/settings/business-settings) —
// only the fields the footer actually displays.
interface BusinessHours {
  weekdays?: string;
  saturday?: string;
  sunday?: string;
  holidays?: string;
}

const FALLBACK_CONTACT: ContactInfo = {
  headquarters: {
    name: 'Geely Ethiopia — Kerchanshe Auto HQ',
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

const FALLBACK_HOURS: HoursSettings = {
  workdays: 'Mon–Fri · 08:30 AM – 06:00 PM',
  saturday: 'Saturday · 09:00 AM – 01:00 PM',
  sunday: 'Sunday · Closed',
  note: 'Public holidays: Closed or by appointment',
};

export function Footer() {
  const [socialMedia, setSocialMedia] = useState<SocialMediaLinks>({});
  const [contact, setContact] = useState<ContactInfo>(FALLBACK_CONTACT);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [emailDraft, setEmailDraft] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    // Parallel fetch both contact and social media CMS values
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
      fetch('/api/public/business-settings')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.businessHours && setBusinessHours(d.businessHours))
        .catch(() => {}),
    ]);
  }, []);

  const vehicleLinks = [
    { name: 'Coolray', href: '/models/coolray' },
    { name: 'Emgrand', href: '/models/emgrand' },
    { name: 'Monjaro', href: '/models/monjaro' },
    { name: 'Azkarra', href: '/models/azkarra' },
    { name: 'Okavango', href: '/models/okavango' },
    { name: 'Geometry EV', href: '/electric' },
  ];

  const serviceLinks = [
    { name: 'Book Test Drive', href: '/test-drive' },
    { name: 'Service Booking', href: '/service' },
    { name: 'Purchase', href: '/financing' },
    { name: 'Warranty', href: '/warranty' },
    { name: 'Spare Parts', href: '/parts' },
    { name: 'Trade-In', href: '/trade-in' },
  ];

  const companyLinks = [
    { name: 'About Geely Ethiopia', href: '/about' },
    { name: 'Find a Dealer', href: '/dealers' },
    { name: 'News & Media', href: '/news' },
    { name: 'Careers', href: '/careers' },
    { name: 'Sustainability', href: '/sustainability' },
    { name: 'Customer Reviews', href: '/testimonials' },
  ];

  const supportLinks = [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Roadside Assistance', href: '/roadside' },
    { name: 'Owner Resources', href: '/owners' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
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
    contact.headquarters.address.postalCode,
    contact.headquarters.address.country,
  ].filter(Boolean).join(', ');

  return (
    <footer className="bg-[#0a1a40] text-white relative overflow-hidden">
      {/* Top decorative gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-gold via-orange-500 to-gold" />

      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
        <div className="absolute top-16 right-16 w-96 h-96 rounded-full bg-white" />
        <div className="absolute bottom-0 left-10 w-80 h-80 rounded-full bg-gold" />
      </div>

      {/* ===== PROMISE / VALUE STRIP ===== */}
      <div className="relative border-b border-white/10 bg-white/[0.02] backdrop-blur">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 py-6 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-gold/15 text-gold flex items-center justify-center ring-1 ring-gold/30">
                <Shield size={20} />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base">Official Manufacturer Warranty</div>
                <div className="text-xs sm:text-sm text-blue-100/80">Backed by Zhejiang Geely Holding Group</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-500/15 text-blue-200 flex items-center justify-center ring-1 ring-blue-400/30">
                <Headphones size={20} />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base">24/7 Roadside Assistance</div>
                <div className="text-xs sm:text-sm text-blue-100/80">Emergency support nationwide</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center ring-1 ring-emerald-400/30">
                <Award size={20} />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base">Certified Service Centers</div>
                <div className="text-xs sm:text-sm text-blue-100/80">Factory-trained technicians, genuine parts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN 5-COL FOOTER ===== */}
      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand + contact + hours — 5 cols */}
          <div className="lg:col-span-5 space-y-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-navy font-extrabold text-lg shadow-lg shadow-gold/20">
                  G
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">GEELY</div>
                  <div className="text-xs font-semibold text-gold/90 tracking-wide">ETHIOPIA · KERCHANSHE AUTO</div>
                </div>
              </div>
              <p className="text-sm text-blue-100/80 leading-relaxed mb-6 max-w-md">
                Kerchanshe Auto is the <span className="text-gold font-semibold">exclusive official distributor</span> of
                Geely vehicles in Ethiopia — importing and supporting vehicles nationwide with genuine warranty,
                certified service, and nationwide spare parts support.
              </p>

              {/* Contact lines */}
              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-gold">
                    <Phone size={15} />
                  </div>
                  <div>
                    <div className="text-blue-200/70 text-xs uppercase tracking-wider font-semibold">Call Sales</div>
                    <a href={`tel:${contact.phone.sales}`} className="text-white font-bold hover:text-gold transition">
                      {contact.phone.sales}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-blue-300">
                    <Mail size={15} />
                  </div>
                  <div>
                    <div className="text-blue-200/70 text-xs uppercase tracking-wider font-semibold">Email</div>
                    <a href={`mailto:${contact.email.general}`} className="text-white hover:text-gold transition">
                      {contact.email.general}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-emerald-300">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <div className="text-blue-200/70 text-xs uppercase tracking-wider font-semibold">Showroom & HQ</div>
                    <div className="text-white leading-relaxed">{address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-amber-300">
                    <Clock size={15} />
                  </div>
                  <div>
                    <div className="text-blue-200/70 text-xs uppercase tracking-wider font-semibold">Opening Hours</div>
                    <div className="text-white leading-relaxed text-sm space-y-0.5">
                      <div>{businessHours?.weekdays || FALLBACK_HOURS.workdays}</div>
                      <div>{businessHours?.saturday || FALLBACK_HOURS.saturday}</div>
                      <div className="text-blue-100/70">{businessHours?.sunday || FALLBACK_HOURS.sunday}</div>
                      {businessHours?.holidays && (
                        <div className="text-blue-100/70">{businessHours.holidays}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <div className="lg:col-span-2">
            <FooterColTitle>Vehicles</FooterColTitle>
            <ul className="mt-5 space-y-2.5">
              {vehicleLinks.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    className="text-sm text-blue-100/85 hover:text-gold transition-colors"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <FooterColTitle>Services</FooterColTitle>
            <ul className="mt-5 space-y-2.5">
              {serviceLinks.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    className="text-sm text-blue-100/85 hover:text-gold transition-colors"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company + Newsletter — 3 cols */}
          <div className="lg:col-span-3 space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <FooterColTitle>Company</FooterColTitle>
                <ul className="space-y-2.5 mt-5">
                  {companyLinks.slice(0, 5).map((l) => (
                    <li key={l.name}>
                      <Link href={l.href} className="inline-flex text-sm text-blue-100/85 hover:text-gold transition">
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <FooterColTitle>Support</FooterColTitle>
                <ul className="space-y-2.5 mt-5">
                  {supportLinks.slice(0, 5).map((l) => (
                    <li key={l.name}>
                      <Link href={l.href} className="inline-flex text-sm text-blue-100/85 hover:text-gold transition">
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Newsletter */}
            <div className="relative rounded-2xl p-5 bg-gradient-to-br from-gold/10 via-transparent to-blue-500/10 border border-white/10 backdrop-blur">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <MessageCircle size={17} className="text-gold" />
                    Stay Connected
                  </div>
                  <div className="text-xs mt-1 text-blue-100/80">
                    Latest models, special offers, and Geely Ethiopia news.
                  </div>
                </div>
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
                className="flex flex-col sm:flex-row gap-2 mt-4"
              >
                <div className="relative flex-1">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200/60" />
                  <input
                    type="email"
                    required
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-navy text-sm font-bold hover:from-amber-400 hover:to-gold transition-all shadow-lg shadow-gold/20 whitespace-nowrap"
                >
                  {subscribing ? 'Subscribing...' : subscribed ? '✓ Subscribed' : (<>Subscribe <Send size={13} /></>)}
                </button>
              </form>
              {subscribed && (
                <div className="mt-3 text-xs text-emerald-300 font-medium inline-flex items-center gap-1.5">
                  <Shield size={13} />
                  Thanks! Check your inbox to confirm.
                </div>
              )}
              {subscribeError && (
                <div className="mt-3 text-xs text-red-300 font-medium inline-flex items-center gap-1.5">
                  <Shield size={13} />
                  {subscribeError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== KERCHANSHE SISTER COMPANIES STRIP ===== */}
      <div className="relative border-y border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-lg font-extrabold text-gold tracking-tight">KERCHANSHE GROUP</div>
                <span className="text-xs text-blue-200/60 font-semibold bg-white/5 px-2 py-1 rounded-full">EST. 2003</span>
              </div>
              <p className="text-sm text-blue-100/80 leading-relaxed">
                Ethiopia's largest coffee exporter and most diversified conglomerate — operating 10+ sectors
                including coffee export, manufacturing (Buna Plate, Buna Pen), construction (AMAM Construction),
                heavy equipment (exclusive Caterpillar dealer), logistics, hospitality, and automotive via
                Kerchanshe Auto. Employing 25,000+ people nationwide.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-200/70 mb-3">Sister Companies</div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Kerchanshe Group', emoji: '🌐', href: 'https://kerchanshegroup.com' },
                  { label: 'Kerchanshe Equipment', emoji: '🚜', href: '#' },
                  { label: 'AMAM Construction', emoji: '🏗️', href: '#' },
                  { label: 'Kerchanshe Coffee', emoji: '☕', href: '#' },
                  { label: 'Buna Manufacturing', emoji: '🏭', href: '#' },
                  { label: 'More ›', emoji: '→', href: '#' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-sm text-blue-100/85 hover:text-white hover:bg-white/5 rounded-lg px-3 py-2 transition border border-white/5 hover:border-white/15"
                  >
                    <span>{s.emoji}</span>
                    <span className="truncate flex-1">{s.label}</span>
                    {s.href.startsWith('http') && <ExternalLink size={12} className="opacity-40 group-hover:opacity-100" />}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM BAR — copyright + socials + legal ===== */}
      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:justify-between">
          {/* Socials */}
          <div className="flex items-center gap-4">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-200/70 hidden sm:block">Follow us</div>
            <div className="flex items-center gap-2 flex-wrap">
              {(anySocial ? socials : socials.reduce<Partial<SocialMediaLinks>>((a, _, i) => ({ ...a, [socials[i].key]: '#' }), {}))
                &&
                socials
                  .filter(({ key }) => anySocial ? !!socialMedia[key] : true)
                  .map(({ key, Icon, label, hover }) => {
                    const href = anySocial ? socialMedia[key] : '#';
                    if (!href) return null;
                    return (
                      <a
                        key={key}
                        href={href || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className={`group relative inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-blue-100/80 hover:text-white ${hover} transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20`}
                      >
                        <Icon size={16} />
                      </a>
                    );
                  })}
            </div>
          </div>

          {/* Legal links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-blue-200/70">
            <Link href="/privacy" className="hover:text-gold transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gold transition">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-gold transition">Cookie Policy</Link>
            <Link href="/dealers" className="hover:text-gold transition">Locate Dealer</Link>
            <Link href="/faq" className="hover:text-gold transition">FAQ</Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-blue-200/60">
            © {currentYear} Geely Ethiopia by Kerchanshe Auto · Kerchanshe Group. All rights reserved.
          </div>
          <div className="text-xs text-blue-200/40">
            Official exclusive distributor of Zhejiang Geely Holding Group in Ethiopia.
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1 h-5 rounded-full bg-gradient-to-b from-gold to-amber-500" />
      <h4 className="text-white font-bold tracking-wide">{children}</h4>
    </div>
  );
}
