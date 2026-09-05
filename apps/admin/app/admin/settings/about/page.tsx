'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft, Save, Building2, Globe, Award, Shield, Zap, Heart, Users,
  Factory, TrendingUp, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon,
  Handshake, Sparkles, Target, ListChecks, MessageSquare, BarChart3, Cpu, DollarSign, Star,
} from 'lucide-react';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';
import apiClient from '@/lib/apiClient';

type FeatureCard = { icon: string; title: string; description: string; image?: string };
type HighlightItem = { value: string; label: string };
type StatsCard = { icon: string; title: string; description: string; gradient: string };
type HomeStat = { label: string; value: string };
type ValueItem = { icon: string; title: string; description: string };

export interface AboutContent {
  sectionHero: { eyebrow: string; title: string; subtitle: string; backgroundImage: string };
  statsBar: { items: HighlightItem[] };
  designPhilosophy: { eyebrow: string; title: string; paragraphs: string[]; image: string };
  partnership: {
    eyebrow: string; title: string; paragraphs: string[]; highlights: HighlightItem[]; rightImage: string;
  };
  missionVisionValues: {
    eyebrow: string;
    mission: { title: string; text: string };
    vision: { title: string; text: string };
    values: ValueItem[];
    image: string;
  };
  historyTimeline: {
    eyebrow: string;
    title: string;
    subtitle: string;
    milestones: { year: string; title: string; description: string; image?: string }[];
  };
  geelyGlobal: { title: string; subtitle: string; features: FeatureCard[] };
  kerchansheGroup: {
    eyebrow: string; title: string; paragraphs: string[]; sectors: string[]; statsCards: StatsCard[];
  };
  whyChoose: { title: string; subtitle: string; features: FeatureCard[] };
  cta: {
    title: string; subtitle: string;
    primaryButton: { label: string; href: string };
    secondaryButton: { label: string; href: string };
  };
  homeAbout: { title: string; description: string; image: string; keyPoints: string[] };
  homeFeatures: FeatureCard[];
  homeStats: HomeStat[];
}

const DEFAULT_DATA: AboutContent = {
  sectionHero: {
    eyebrow: 'ABOUT US',
    title: 'About Geely Ethiopia',
    subtitle:
      'Bringing global automotive excellence to Ethiopia through the trusted partnership of Zhejiang Geely Holding Group and Kerchanshe Group.',
    backgroundImage: '',
  },
  statsBar: {
    items: [
      { value: '30+', label: 'Global Markets Served' },
      { value: '10M+', label: 'Vehicles Delivered' },
      { value: '12+', label: 'Manufacturing Plants' },
      { value: '50K+', label: 'Employees Worldwide' },
    ],
  },
  designPhilosophy: {
    eyebrow: 'DESIGN PHILOSOPHY',
    title: 'Inspired by Nature, Engineered for Tomorrow',
    paragraphs: [
      "Every Geely vehicle is inspired by nature's energy — from Stonehenge-inspired Matrix LED headlight designs to bold Icefall vertical grilles and lava-flow LED taillights.",
      "This design language carries through every model Kerchanshe Group Geely brings to Ethiopia, pairing striking presence with world-class engineering and safety.",
    ],
    image: '',
  },
  partnership: {
    eyebrow: 'A HISTORIC PARTNERSHIP',
    title: 'Global Engineering Meets Local Excellence',
    paragraphs: [
      'In April 2025, Kerchanshe Group announced a landmark agreement with Zhejiang Geely Holding Group (ZGH) to become the exclusive, official distributor of Geely vehicles in Ethiopia.',
      "This partnership brings together Geely's world-class automotive engineering, safety innovation, and design excellence with Kerchanshe Group's 20+ years of trusted local distribution, manufacturing infrastructure, and after-sales expertise.",
      'Operating through Kerchanshe Group Geely, the motor vehicles division of Kerchanshe Group, we are not just importing vehicles — we are building a complete automotive ecosystem with plans for local assembly, job creation, and technology transfer.',
    ],
    highlights: [
      { value: '2025', label: 'Exclusive Partnership Announced' },
      { value: '100%', label: 'Manufacturer Warranty & Support' },
      { value: 'Local', label: 'Assembly Plans in Progress' },
      { value: '25K+', label: 'Kerchanshe Group Employees' },
    ],
    rightImage: '',
  },
  missionVisionValues: {
    eyebrow: 'OUR PURPOSE',
    mission: {
      title: 'Our Mission',
      text: "Geely's mission is to design vehicles and technologies that put people first — combining innovation, safety, and smart engineering to make every journey better, brought to Ethiopia through Kerchanshe Group Geely's local expertise and support.",
    },
    vision: {
      title: 'Our Vision',
      text: 'To be the most competitive and respected global automotive brand, leading the transformation of the industry through innovation, sustainability, and human-centered design — with Kerchanshe Group Geely driving that vision forward in Ethiopia.',
    },
    values: [
      { icon: 'Zap', title: 'Innovation', description: 'We challenge limits with new ideas, smart technology, and forward-thinking design in every vehicle we bring to Ethiopia.' },
      { icon: 'Award', title: 'Quality', description: "Every detail matters — we uphold Geely's global standards of precision, durability, and craftsmanship on every vehicle we sell and support." },
      { icon: 'Heart', title: 'Responsibility', description: 'We drive progress with integrity, prioritizing safety, sustainability, and a positive impact on Ethiopian communities.' },
    ],
    image: '',
  },
  historyTimeline: {
    eyebrow: 'OUR JOURNEY',
    title: 'Milestones',
    subtitle: 'From a coffee export business to Ethiopia\'s official Geely distributor.',
    milestones: [
      { year: '2003', title: 'Kerchanshe Group Founded', description: "Began as a coffee export business and grew into one of Ethiopia's most diversified conglomerates, spanning manufacturing, construction, heavy equipment, and logistics." },
      { year: 'April 2025', title: 'Exclusive Geely Partnership Signed', description: 'Kerchanshe Group and Zhejiang Geely Holding Group announce an exclusive agreement making Kerchanshe Group Geely the official distributor of Geely vehicles in Ethiopia.' },
      { year: '2025', title: 'Kerchanshe Group Geely Launches', description: 'Opens its showroom in Sarbet, Addis Ababa, bringing genuine manufacturer-backed Geely vehicles and after-sales support to Ethiopian customers.' },
      { year: 'In Progress', title: 'Local Assembly & Technology Transfer', description: 'Plans underway for local vehicle assembly in Ethiopia, creating jobs and building long-term industrial capacity.' },
    ],
  },
  geelyGlobal: {
    title: 'Zhejiang Geely Holding Group',
    subtitle:
      "One of the world's leading automotive groups, with a portfolio spanning multiple brands and innovative technologies.",
    features: [
      { icon: 'Globe', title: 'Global Reach', description: 'Operations in over 40 countries worldwide with production facilities across Asia, Europe, and beyond.' },
      { icon: 'Award', title: 'Premium Brands', description: 'Owns Volvo Cars, Polestar, Lynk & Co, Zeekr, Geometry, and Lotus — recognized for excellence.' },
      { icon: 'Zap', title: 'Innovation Leader', description: 'Pioneering electric and new energy vehicles with advanced battery and autonomous driving technology.' },
      { icon: 'Shield', title: 'Safety First', description: 'Multiple 5-star safety ratings globally, with C-NCAP and Euro NCAP recognition for engineering excellence.' },
    ],
  },
  kerchansheGroup: {
    eyebrow: 'SINCE 2003',
    title: "Kerchanshe Group: Ethiopia's Most Diversified Conglomerate",
    paragraphs: [
      'Founded in 2003, Kerchanshe Group is Ethiopia\'s largest coffee exporter and one of its most diversified conglomerates, with an annual coffee turnover exceeding US$100 million.',
      'The Group operates across 10+ business sectors:',
    ],
    sectors: [
      'Coffee export and agro-industry',
      'Manufacturing (Buna Plate, Buna Pen)',
      'Construction (AMAM Construction)',
      'Heavy equipment (Exclusive Caterpillar dealer)',
      'Logistics, hospitality, and automotive',
    ],
    statsCards: [
      { icon: 'Factory', title: 'Manufacturing', description: 'Buna Plate, Buna Pen production facilities', gradient: 'from-amber-500 to-amber-600' },
      { icon: 'Globe', title: 'Coffee Export', description: '$100M+ annual turnover, largest in Ethiopia', gradient: 'from-slate-700 to-navy' },
      { icon: 'TrendingUp', title: 'Heavy Equipment', description: 'Exclusive Caterpillar dealer in Ethiopia', gradient: 'from-geely-blue to-slate-800' },
      { icon: 'Users', title: '25,000+ Jobs', description: 'Major employer across multiple sectors', gradient: 'from-amber-600 to-yellow-500' },
    ],
  },
  whyChoose: {
    title: 'Why Choose Geely Ethiopia',
    subtitle: 'The perfect combination of global automotive excellence and trusted local service.',
    features: [
      { icon: 'Shield', title: 'Genuine Warranty', description: 'Full manufacturer warranty and technical support backed by Zhejiang Geely Holding Group on every vehicle sold.' },
      { icon: 'Factory', title: 'Local Assembly', description: 'Plans for local assembly of Geely vehicles in Ethiopia, contributing to job creation and industrial growth.' },
      { icon: 'Users', title: 'Trusted Service', description: '20+ years of Kerchanshe Group expertise in distribution, after-sales, and customer service across Ethiopia.' },
      { icon: 'Award', title: 'World-Class Quality', description: "Geely's global standards of engineering, safety, and design, proven across 40+ countries worldwide." },
      { icon: 'Zap', title: 'Future-Ready', description: 'Access to cutting-edge electric and new energy vehicle technology as Ethiopia transitions to sustainable mobility.' },
      { icon: 'Heart', title: 'Community Impact', description: "Commitment to Ethiopia's economic development through technology transfer and local capacity building." },
    ],
  },
  cta: {
    title: 'Ready to Experience Geely?',
    subtitle:
      'Visit our showroom in Sarbet, Addis Ababa, or book a test drive to experience the perfect combination of global excellence and local trust.',
    primaryButton: { label: 'Book a Test Drive', href: '/test-drive' },
    secondaryButton: { label: 'Find Our Showroom', href: '/dealers' },
  },
  homeAbout: {
    title: 'About Geely Ethiopia',
    description:
      'Kerchanshe Group Geely is the exclusive distributor of Geely vehicles in Ethiopia, bringing world-class automotive excellence to the Ethiopian market.',
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20geely%20car%20showroom%20in%20addis%20ababa%20with%20suv%20vehicles%20on%20display%20professional%20lighting&image_size=landscape_4_3',
    keyPoints: [
      'Official authorized distributor with comprehensive warranty coverage',
      'Nationwide service network with certified technicians',
      'Commitment to bringing global automotive excellence to Ethiopian roads',
    ],
  },
  homeFeatures: [
    {
      icon: 'Shield',
      title: 'Advanced Safety',
      description:
        '5-star safety rating with advanced driver assistance systems including collision avoidance, lane departure warning, and automatic emergency braking.',
      image: '',
    },
    {
      icon: 'Cpu',
      title: 'Cutting-Edge Technology',
      description:
        'Smart connectivity features with integrated infotainment, smartphone integration, and intelligent driving assistance systems.',
      image: '',
    },
    {
      icon: 'Star',
      title: 'Exceptional Comfort',
      description:
        'Premium interiors with ergonomic design, quality materials, and advanced climate control for ultimate driving comfort.',
      image: '',
    },
    {
      icon: 'DollarSign',
      title: 'Competitive Pricing',
      description:
        'Best value for money with transparent pricing, flexible financing options, and comprehensive after-sales support.',
      image: '',
    },
  ],
  homeStats: [
    { label: 'Vehicles Sold', value: '10,000+' },
    { label: 'Happy Customers', value: '8,500+' },
    { label: 'Service Centers', value: '15+' },
    { label: 'Years of Excellence', value: '5+' },
  ],
};

/* ---------- Reusable UI helpers ---------- */

function SectionCard(props: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  const Icon = props.icon;
  return (
    <div id={props.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-br from-slate-50 to-white">
        <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${props.gradient} text-white flex items-center justify-center shadow-md`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{props.title}</h2>
          {props.description && (
            <p className="text-sm text-gray-500 mt-0.5">{props.description}</p>
          )}
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-5">{props.children}</div>
    </div>
  );
}

function LabelField(props: { label: string; required?: boolean; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={props.className ?? ''}>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">
        {props.label}
        {props.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {props.children}
      {props.hint && <p className="text-xs text-gray-400 mt-1">{props.hint}</p>}
    </div>
  );
}

const baseInput =
  'w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-geely-blue/30 focus:border-blue-500 transition';

function ParagraphArrayEditor({
  label,
  values,
  onChange,
  minRows = 3,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  minRows?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-geely-blue" /> {label}
        </h4>
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="text-xs font-semibold text-geely-blue hover:text-navy inline-flex items-center gap-1"
        >
          + Add Paragraph
        </button>
      </div>
      <div className="space-y-3">
        {values.map((p, i) => (
          <div key={i} className="relative">
            <div className="absolute top-2.5 left-2.5 text-xs font-bold text-gray-400 w-6">#{i + 1}</div>
            <textarea
              rows={minRows}
              value={p}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              className={`${baseInput} pl-10 resize-y leading-relaxed`}
              placeholder="Type paragraph text…"
            />
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="absolute top-2 right-2 w-7 h-7 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center text-sm"
                aria-label="Remove paragraph"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleStringListEditor({
  title,
  values,
  onChange,
  accent = 'blue',
  icon: Icon,
}: {
  title: string;
  values: string[];
  onChange: (v: string[]) => void;
  accent?: 'blue' | 'emerald' | 'amber' | 'violet';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [draft, setDraft] = useState('');
  const accentMap = {
    blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    emerald: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    amber: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    violet: 'bg-violet-100 text-violet-800 hover:bg-violet-200',
  } as const;
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...values, t]);
    setDraft('');
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 text-${accent}-600`} />}
        <h4 className="font-semibold text-sm text-gray-800">{title}</h4>
        <span className="text-xs text-gray-400">({values.length})</span>
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Type and press Enter…"
          className={`${baseInput} flex-1`}
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.length === 0 && (
          <div className="text-sm text-gray-400 italic py-2">No items added yet</div>
        )}
        {values.map((v, i) => (
          <span
            key={i}
            className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${accentMap[accent]} transition-colors`}
          >
            <span className="max-w-[min(40ch,60vw)] truncate">{v}</span>
            <button
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition"
              aria-label="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function FeatureCardsEditor({
  title,
  cards,
  onChange,
  gradient,
  iconChoices,
  defaultIcon,
  showImageUploader,
  uploadCategory,
}: {
  title: string;
  cards: FeatureCard[];
  onChange: (v: FeatureCard[]) => void;
  gradient: string;
  iconChoices: { value: string; Icon: React.ComponentType<{ className?: string }> }[];
  defaultIcon: string;
  showImageUploader?: boolean;
  uploadCategory?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> {title}
        </h4>
        <button
          type="button"
          onClick={() => onChange([...cards, { icon: defaultIcon, title: '', description: '', image: '' }])}
          className="text-xs font-semibold text-geely-blue hover:text-navy inline-flex items-center gap-1"
        >
          + Add Card
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center`}>
                  {(() => {
                    const pick = iconChoices.find((ic) => ic.value === c.icon);
                    const Ic = pick ? pick.Icon : Target;
                    return <Ic className="w-5 h-5" />;
                  })()}
                </div>
                <select
                  value={c.icon}
                  onChange={(e) => {
                    const next = [...cards];
                    next[i] = { ...c, icon: e.target.value };
                    onChange(next);
                  }}
                  className={baseInput}
                >
                  {iconChoices.map((ic) => (
                    <option key={ic.value} value={ic.value}>
                      {ic.value}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => onChange(cards.filter((_, idx) => idx !== i))}
                disabled={cards.length <= 1}
                className="w-7 h-7 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center text-sm disabled:opacity-40"
              >
                ×
              </button>
            </div>
            <input
              className={baseInput}
              placeholder="Card title"
              value={c.title}
              onChange={(e) => {
                const next = [...cards];
                next[i] = { ...c, title: e.target.value };
                onChange(next);
              }}
            />
            <textarea
              rows={3}
              className={`${baseInput} resize-y`}
              placeholder="Short description…"
              value={c.description}
              onChange={(e) => {
                const next = [...cards];
                next[i] = { ...c, description: e.target.value };
                onChange(next);
              }}
            />
            {showImageUploader && (
              <ImageUploader
                label="Feature Image (optional)"
                value={c.image ?? ''}
                onChange={(v) => {
                  const next = [...cards];
                  next[i] = { ...c, image: v };
                  onChange(next);
                }}
                category={uploadCategory || 'features'}
                aspect="wide"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function AboutSettingsPage() {
  const [data, setData] = useState<AboutContent>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/settings/about')
      .then(({ data: aboutContent }) => aboutContent)
      .then((d) => {
        if (d && typeof d === 'object') {
          setData({ ...DEFAULT_DATA, ...(d as Partial<AboutContent>) });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/settings/about', data);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError((e as { response?: { data?: { error?: string } }; message: string }).response?.data?.error || (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /* ---- icon choices (shared for Geely features + WhyChoose + Home Features cards) ---- */
  const ICON_CHOICES = [
    { value: 'Shield', Icon: Shield },
    { value: 'Award', Icon: Award },
    { value: 'Globe', Icon: Globe },
    { value: 'Users', Icon: Users },
    { value: 'Zap', Icon: Zap },
    { value: 'Heart', Icon: Heart },
    { value: 'Factory', Icon: Factory },
    { value: 'TrendingUp', Icon: TrendingUp },
    { value: 'Target', Icon: Target },
    { value: 'Sparkles', Icon: Sparkles },
    { value: 'Cpu', Icon: Cpu },
    { value: 'Star', Icon: Star },
    { value: 'DollarSign', Icon: DollarSign },
  ];

  /* ---- Helpers to update nested state cleanly ---- */
  function setKey<K extends keyof AboutContent>(k: K, v: AboutContent[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
          Loading About page content…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">About & Company Content</h1>
            <p className="mt-1 text-sm text-gray-500">
              Controls the text, highlights, cards, and CTA shown on the <code className="px-1.5 py-0.5 rounded bg-gray-100">/about</code> page and the About section on the home page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved {savedAt}
              </span>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition-all hover:shadow-xl disabled:opacity-60 font-medium whitespace-nowrap"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save Changes'}</span>
              <span className="sm:hidden">{saving ? 'Saving' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Could not save</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* ===== 1. Home Page About Section ===== */}
        <SectionCard
          id="sec-home"
          icon={Building2}
          gradient="from-geely-blue to-navy"
          title="Homepage — About Preview Section"
          description="Shown directly after the hero on the landing page. Keep it short, confident, and scannable."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="Section Title" className="sm:col-span-2">
              <input
                value={data.homeAbout.title}
                onChange={(e) => setKey('homeAbout', { ...data.homeAbout, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <div className="sm:col-span-2">
              <ImageUploader
                label="Section Image"
                value={data.homeAbout.image}
                onChange={(v) => setKey('homeAbout', { ...data.homeAbout, image: v })}
                category="about"
                aspect="wide"
                hint="Upload from device or paste a remote image URL. Shown on the home page next to the About description."
              />
            </div>
            <LabelField label="Short Description" className="sm:col-span-2">
              <textarea
                rows={4}
                value={data.homeAbout.description}
                onChange={(e) => setKey('homeAbout', { ...data.homeAbout, description: e.target.value })}
                className={`${baseInput} resize-y`}
              />
            </LabelField>
          </div>
          <SimpleStringListEditor
            title="Key Bullet Points (3–4 recommended)"
            values={data.homeAbout.keyPoints}
            onChange={(v) => setKey('homeAbout', { ...data.homeAbout, keyPoints: v })}
            accent="blue"
            icon={ListChecks}
          />
        </SectionCard>

        {/* ===== 2. /about Hero ===== */}
        <SectionCard
          id="sec-hero"
          icon={MessageSquare}
          gradient="from-slate-700 to-navy"
          title="About Page — Hero Banner"
          description="Top section with a large heading and intro on /about."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="Eyebrow / Badge" hint="Short uppercase text above the title">
              <input
                value={data.sectionHero.eyebrow}
                onChange={(e) => setKey('sectionHero', { ...data.sectionHero, eyebrow: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Page Title">
              <input
                value={data.sectionHero.title}
                onChange={(e) => setKey('sectionHero', { ...data.sectionHero, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Subtitle / Intro" className="sm:col-span-2">
              <textarea
                rows={3}
                value={data.sectionHero.subtitle}
                onChange={(e) => setKey('sectionHero', { ...data.sectionHero, subtitle: e.target.value })}
                className={`${baseInput} resize-y`}
              />
            </LabelField>
            <div className="sm:col-span-2">
              <ImageUploader
                label="Hero Background Image (optional)"
                value={data.sectionHero.backgroundImage}
                onChange={(v) => setKey('sectionHero', { ...data.sectionHero, backgroundImage: v })}
                category="about"
                aspect="wide"
                hint="Recommended size: 1920×700. If empty the /about page uses a nice navy→blue gradient instead."
              />
            </div>
          </div>
        </SectionCard>

        {/* ===== 2b. Stats Bar ===== */}
        <SectionCard
          id="sec-stats-bar"
          icon={BarChart3}
          gradient="from-navy to-slate-700"
          title="About Page — Stats Bar"
          description="Thin navy strip right under the hero with 3–4 big numbers (e.g. 40+ Countries)."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-800">Stat Tiles</h4>
              <button
                type="button"
                onClick={() => setKey('statsBar', { items: [...data.statsBar.items, { value: '', label: '' }] })}
                className="text-xs font-semibold text-geely-blue hover:text-navy"
              >
                + Add Stat
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.statsBar.items.map((s, i) => (
                <div key={i} className="relative border border-gray-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <button
                    onClick={() => setKey('statsBar', { items: data.statsBar.items.filter((_, idx) => idx !== i) })}
                    disabled={data.statsBar.items.length <= 1}
                    className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white text-red-600 hover:bg-red-50 flex items-center justify-center text-sm border border-gray-200 disabled:opacity-40"
                  >
                    ×
                  </button>
                  <LabelField label="Big value (e.g. 40+, 2025)">
                    <input value={s.value} onChange={(e) => {
                      const next = [...data.statsBar.items];
                      next[i] = { ...s, value: e.target.value };
                      setKey('statsBar', { items: next });
                    }} className={baseInput} />
                  </LabelField>
                  <LabelField label="Label below">
                    <input value={s.label} onChange={(e) => {
                      const next = [...data.statsBar.items];
                      next[i] = { ...s, label: e.target.value };
                      setKey('statsBar', { items: next });
                    }} className={baseInput} />
                  </LabelField>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ===== 2c. Design Philosophy / Overview ===== */}
        <SectionCard
          id="sec-design-philosophy"
          icon={Sparkles}
          gradient="from-blue-600 to-geely-blue"
          title="Design Philosophy"
          description="Overview section right after the stats bar describing Geely's design language, with an optional image."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="Eyebrow / Badge">
              <input
                value={data.designPhilosophy.eyebrow}
                onChange={(e) => setKey('designPhilosophy', { ...data.designPhilosophy, eyebrow: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Section Title">
              <input
                value={data.designPhilosophy.title}
                onChange={(e) => setKey('designPhilosophy', { ...data.designPhilosophy, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <div className="sm:col-span-2">
              <ImageUploader
                label="Design Philosophy Image (optional)"
                value={data.designPhilosophy.image}
                onChange={(v) => setKey('designPhilosophy', { ...data.designPhilosophy, image: v })}
                category="about"
                aspect="square"
                hint="If uploaded, displays next to the text. Leave empty for a centered text-only layout."
              />
            </div>
          </div>
          <ParagraphArrayEditor
            label="Paragraphs"
            values={data.designPhilosophy.paragraphs}
            onChange={(v) => setKey('designPhilosophy', { ...data.designPhilosophy, paragraphs: v })}
          />
        </SectionCard>

        {/* ===== 3. Partnership Story ===== */}
        <SectionCard
          id="sec-partnership"
          icon={Handshake}
          gradient="from-amber-500 to-orange-600"
          title="Partnership Story"
          description="The 2-column narrative explaining the Geely × Kerchanshe partnership agreement."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="Eyebrow / Badge">
              <input
                value={data.partnership.eyebrow}
                onChange={(e) => setKey('partnership', { ...data.partnership, eyebrow: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Section Title">
              <input
                value={data.partnership.title}
                onChange={(e) => setKey('partnership', { ...data.partnership, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <div className="sm:col-span-2">
              <ImageUploader
                label="Partnership Right Image (optional — replaces 4-card grid)"
                value={data.partnership.rightImage}
                onChange={(v) => setKey('partnership', { ...data.partnership, rightImage: v })}
                category="about"
                aspect="square"
                hint="If you upload an image here it displays on the right side instead of the 2×2 highlights grid. Leave empty to keep the 4 numbered highlights tiles."
              />
            </div>
          </div>
          <ParagraphArrayEditor
            label="Story Paragraphs"
            values={data.partnership.paragraphs}
            onChange={(v) => setKey('partnership', { ...data.partnership, paragraphs: v })}
          />
          {/* Highlights — 4 cards  */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Highlight Cards (2×2 grid on /about)
              </h4>
              <button
                type="button"
                onClick={() => setKey('partnership', { ...data.partnership, highlights: [...data.partnership.highlights, { value: '', label: '' }] })}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
              >
                + Add Highlight
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.partnership.highlights.map((h, i) => (
                <div key={i} className="relative border border-gray-200 rounded-xl p-3 bg-amber-50/30 space-y-2">
                  <button
                    onClick={() => setKey('partnership', { ...data.partnership, highlights: data.partnership.highlights.filter((_, idx) => idx !== i) })}
                    disabled={data.partnership.highlights.length <= 1}
                    className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white text-red-600 hover:bg-red-50 flex items-center justify-center text-sm border border-gray-200 disabled:opacity-40"
                  >
                    ×
                  </button>
                  <LabelField label="Big value (e.g. 2025, 100%)">
                    <input value={h.value} onChange={(e) => {
                      const next = [...data.partnership.highlights];
                      next[i] = { ...h, value: e.target.value };
                      setKey('partnership', { ...data.partnership, highlights: next });
                    }} className={baseInput} />
                  </LabelField>
                  <LabelField label="Label below">
                    <input value={h.label} onChange={(e) => {
                      const next = [...data.partnership.highlights];
                      next[i] = { ...h, label: e.target.value };
                      setKey('partnership', { ...data.partnership, highlights: next });
                    }} className={baseInput} />
                  </LabelField>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ===== 3b. Mission, Vision & Core Values ===== */}
        <SectionCard
          id="sec-mvv"
          icon={Target}
          gradient="from-indigo-600 to-blue-700"
          title="Mission, Vision & Core Values"
          description="Two mission/vision cards plus 3 core value cards, shown between the Partnership story and Zhejiang Geely section."
        >
          <LabelField label="Eyebrow / Badge">
            <input
              value={data.missionVisionValues.eyebrow}
              onChange={(e) => setKey('missionVisionValues', { ...data.missionVisionValues, eyebrow: e.target.value })}
              className={baseInput}
            />
          </LabelField>
          <ImageUploader
            label="Banner Image (optional)"
            value={data.missionVisionValues.image}
            onChange={(v) => setKey('missionVisionValues', { ...data.missionVisionValues, image: v })}
            category="about"
            aspect="wide"
            hint="Shown above the Mission/Vision cards when set."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <LabelField label="Mission Title">
                <input
                  value={data.missionVisionValues.mission.title}
                  onChange={(e) => setKey('missionVisionValues', { ...data.missionVisionValues, mission: { ...data.missionVisionValues.mission, title: e.target.value } })}
                  className={baseInput}
                />
              </LabelField>
              <LabelField label="Mission Text">
                <textarea
                  rows={4}
                  value={data.missionVisionValues.mission.text}
                  onChange={(e) => setKey('missionVisionValues', { ...data.missionVisionValues, mission: { ...data.missionVisionValues.mission, text: e.target.value } })}
                  className={`${baseInput} resize-y`}
                />
              </LabelField>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <LabelField label="Vision Title">
                <input
                  value={data.missionVisionValues.vision.title}
                  onChange={(e) => setKey('missionVisionValues', { ...data.missionVisionValues, vision: { ...data.missionVisionValues.vision, title: e.target.value } })}
                  className={baseInput}
                />
              </LabelField>
              <LabelField label="Vision Text">
                <textarea
                  rows={4}
                  value={data.missionVisionValues.vision.text}
                  onChange={(e) => setKey('missionVisionValues', { ...data.missionVisionValues, vision: { ...data.missionVisionValues.vision, text: e.target.value } })}
                  className={`${baseInput} resize-y`}
                />
              </LabelField>
            </div>
          </div>
          <FeatureCardsEditor
            title="Core Value Cards (3 recommended)"
            cards={data.missionVisionValues.values}
            onChange={(v) => setKey('missionVisionValues', { ...data.missionVisionValues, values: v })}
            gradient="from-indigo-500 to-blue-600"
            iconChoices={ICON_CHOICES}
            defaultIcon="Zap"
          />
        </SectionCard>

        {/* ===== 3c. History Timeline ===== */}
        <SectionCard
          id="sec-timeline"
          icon={BarChart3}
          gradient="from-slate-600 to-slate-800"
          title="History Timeline"
          description="A vertical milestone timeline near the end of /about (e.g. company founding, partnership signing, launch)."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="Eyebrow / Badge">
              <input
                value={data.historyTimeline.eyebrow}
                onChange={(e) => setKey('historyTimeline', { ...data.historyTimeline, eyebrow: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Section Title">
              <input
                value={data.historyTimeline.title}
                onChange={(e) => setKey('historyTimeline', { ...data.historyTimeline, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Section Subtitle" className="sm:col-span-2">
              <input
                value={data.historyTimeline.subtitle}
                onChange={(e) => setKey('historyTimeline', { ...data.historyTimeline, subtitle: e.target.value })}
                className={baseInput}
              />
            </LabelField>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-800">Milestones (in order)</h4>
              <button
                type="button"
                onClick={() => setKey('historyTimeline', { ...data.historyTimeline, milestones: [...data.historyTimeline.milestones, { year: '', title: '', description: '' }] })}
                className="text-xs font-semibold text-geely-blue hover:text-navy"
              >
                + Add Milestone
              </button>
            </div>
            <div className="space-y-3">
              {data.historyTimeline.milestones.map((m, i) => (
                <div key={i} className="relative border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-2.5">
                  <button
                    onClick={() => setKey('historyTimeline', { ...data.historyTimeline, milestones: data.historyTimeline.milestones.filter((_, idx) => idx !== i) })}
                    disabled={data.historyTimeline.milestones.length <= 1}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-md bg-white text-red-600 hover:bg-red-50 flex items-center justify-center text-sm border border-gray-200 disabled:opacity-40"
                  >
                    ×
                  </button>
                  <LabelField label="Year / Date label (e.g. 2003, April 2025, In Progress)">
                    <input value={m.year} onChange={(e) => {
                      const next = [...data.historyTimeline.milestones];
                      next[i] = { ...m, year: e.target.value };
                      setKey('historyTimeline', { ...data.historyTimeline, milestones: next });
                    }} className={baseInput} />
                  </LabelField>
                  <LabelField label="Milestone Title">
                    <input value={m.title} onChange={(e) => {
                      const next = [...data.historyTimeline.milestones];
                      next[i] = { ...m, title: e.target.value };
                      setKey('historyTimeline', { ...data.historyTimeline, milestones: next });
                    }} className={baseInput} />
                  </LabelField>
                  <LabelField label="Description">
                    <textarea rows={2} value={m.description} onChange={(e) => {
                      const next = [...data.historyTimeline.milestones];
                      next[i] = { ...m, description: e.target.value };
                      setKey('historyTimeline', { ...data.historyTimeline, milestones: next });
                    }} className={`${baseInput} resize-y`} />
                  </LabelField>
                  <ImageUploader
                    label="Milestone Image (optional)"
                    value={m.image ?? ''}
                    onChange={(v) => {
                      const next = [...data.historyTimeline.milestones];
                      next[i] = { ...m, image: v };
                      setKey('historyTimeline', { ...data.historyTimeline, milestones: next });
                    }}
                    category="about"
                    aspect="wide"
                  />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ===== 4. Geely Global ===== */}
        <SectionCard
          id="sec-geely"
          icon={Globe}
          gradient="from-slate-800 to-slate-600"
          title="About Zhejiang Geely Holding Group"
          description="Dark navy section with 4 feature cards describing the global parent company."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="Section Title" className="sm:col-span-2">
              <input
                value={data.geelyGlobal.title}
                onChange={(e) => setKey('geelyGlobal', { ...data.geelyGlobal, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Section Subtitle" className="sm:col-span-2">
              <textarea
                rows={2}
                value={data.geelyGlobal.subtitle}
                onChange={(e) => setKey('geelyGlobal', { ...data.geelyGlobal, subtitle: e.target.value })}
                className={`${baseInput} resize-y`}
              />
            </LabelField>
          </div>
          <FeatureCardsEditor
            title="Group Feature Cards"
            cards={data.geelyGlobal.features}
            onChange={(v) => setKey('geelyGlobal', { ...data.geelyGlobal, features: v })}
            gradient="from-geely-blue to-navy"
            iconChoices={ICON_CHOICES}
            defaultIcon="Globe"
          />
        </SectionCard>

        {/* ===== 5. Kerchanshe Group ===== */}
        <SectionCard
          id="sec-kerchanshe"
          icon={Building2}
          gradient="from-amber-600 to-yellow-500"
          title="Kerchanshe Group — Local Partner"
          description="Two-column section with paragraphs, business sectors, and 4 colorful stat cards."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="Eyebrow / Badge">
              <input
                value={data.kerchansheGroup.eyebrow}
                onChange={(e) => setKey('kerchansheGroup', { ...data.kerchansheGroup, eyebrow: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Section Title">
              <input
                value={data.kerchansheGroup.title}
                onChange={(e) => setKey('kerchansheGroup', { ...data.kerchansheGroup, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
          </div>
          <ParagraphArrayEditor
            label="Intro Paragraphs"
            values={data.kerchansheGroup.paragraphs}
            onChange={(v) => setKey('kerchansheGroup', { ...data.kerchansheGroup, paragraphs: v })}
          />
          <SimpleStringListEditor
            title="Business Sectors (bullet list)"
            values={data.kerchansheGroup.sectors}
            onChange={(v) => setKey('kerchansheGroup', { ...data.kerchansheGroup, sectors: v })}
            accent="amber"
            icon={Target}
          />
          {/* 4 Stats Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-800">Stats Cards (2×2 grid)</h4>
              <button
                type="button"
                onClick={() => setKey('kerchansheGroup', { ...data.kerchansheGroup, statsCards: [...data.kerchansheGroup.statsCards, { icon: 'Factory', title: '', description: '', gradient: 'from-amber-500 to-amber-600' }] })}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                + Add Card
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.kerchansheGroup.statsCards.map((c, i) => (
                <div key={i} className="relative border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-2.5">
                  <button
                    onClick={() => setKey('kerchansheGroup', { ...data.kerchansheGroup, statsCards: data.kerchansheGroup.statsCards.filter((_, idx) => idx !== i) })}
                    disabled={data.kerchansheGroup.statsCards.length <= 1}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-md bg-white text-red-600 hover:bg-red-50 flex items-center justify-center text-sm border border-gray-200 disabled:opacity-40"
                  >
                    ×
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <LabelField label="Icon">
                      <select
                        value={c.icon}
                        onChange={(e) => {
                          const next = [...data.kerchansheGroup.statsCards];
                          next[i] = { ...c, icon: e.target.value };
                          setKey('kerchansheGroup', { ...data.kerchansheGroup, statsCards: next });
                        }}
                        className={baseInput}
                      >
                        {ICON_CHOICES.map((ic) => (
                          <option key={ic.value} value={ic.value}>{ic.value}</option>
                        ))}
                      </select>
                    </LabelField>
                    <LabelField label="Gradient classes">
                      <input
                        value={c.gradient}
                        onChange={(e) => {
                          const next = [...data.kerchansheGroup.statsCards];
                          next[i] = { ...c, gradient: e.target.value };
                          setKey('kerchansheGroup', { ...data.kerchansheGroup, statsCards: next });
                        }}
                        className={baseInput}
                        placeholder="from-xxx to-xxx"
                      />
                    </LabelField>
                  </div>
                  <LabelField label="Card Title">
                    <input
                      value={c.title}
                      onChange={(e) => {
                        const next = [...data.kerchansheGroup.statsCards];
                        next[i] = { ...c, title: e.target.value };
                        setKey('kerchansheGroup', { ...data.kerchansheGroup, statsCards: next });
                      }}
                      className={baseInput}
                    />
                  </LabelField>
                  <LabelField label="Description">
                    <textarea
                      rows={2}
                      value={c.description}
                      onChange={(e) => {
                        const next = [...data.kerchansheGroup.statsCards];
                        next[i] = { ...c, description: e.target.value };
                        setKey('kerchansheGroup', { ...data.kerchansheGroup, statsCards: next });
                      }}
                      className={`${baseInput} resize-y`}
                    />
                  </LabelField>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ===== 6. Why Choose ===== */}
        <SectionCard
          id="sec-why"
          icon={Target}
          gradient="from-emerald-500 to-teal-600"
          title="Why Choose Geely Ethiopia"
          description="6 cards in a grid: the value proposition section."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="Section Title">
              <input
                value={data.whyChoose.title}
                onChange={(e) => setKey('whyChoose', { ...data.whyChoose, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="Section Subtitle">
              <input
                value={data.whyChoose.subtitle}
                onChange={(e) => setKey('whyChoose', { ...data.whyChoose, subtitle: e.target.value })}
                className={baseInput}
              />
            </LabelField>
          </div>
          <FeatureCardsEditor
            title="Value Proposition Cards (6 recommended — 3×2 grid)"
            cards={data.whyChoose.features}
            onChange={(v) => setKey('whyChoose', { ...data.whyChoose, features: v })}
            gradient="from-emerald-500 to-emerald-600"
            iconChoices={ICON_CHOICES}
            defaultIcon="Shield"
          />
        </SectionCard>

        {/* ===== Home Features (old /admin/content Features tab) ===== */}
        <SectionCard
          id="sec-home-features"
          icon={Sparkles}
          gradient="from-violet-500 to-indigo-600"
          title="Homepage Features Cards"
          description="The 4 large benefit cards shown on the home page (Safety, Technology, Comfort, Pricing). Each can also have an optional image."
        >
          <FeatureCardsEditor
            title="Home Feature Cards"
            cards={data.homeFeatures}
            onChange={(v) => setKey('homeFeatures', v)}
            gradient="from-violet-500 to-indigo-600"
            iconChoices={ICON_CHOICES}
            defaultIcon="Shield"
            showImageUploader
            uploadCategory="features"
          />
        </SectionCard>

        {/* ===== Home Stats (old /admin/content Stats tab) ===== */}
        <SectionCard
          id="sec-home-stats"
          icon={BarChart3}
          gradient="from-rose-500 to-pink-600"
          title="Homepage Statistics"
          description="4 big numbers shown near the hero or feature section on the landing page (e.g. 10,000+ Vehicles Sold). Add or remove rows as needed."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-600" /> Stats Tiles
              </h4>
              <button
                type="button"
                onClick={() => setKey('homeStats', [...data.homeStats, { label: 'New Stat', value: '0' }])}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
              >
                + Add Stat
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.homeStats.map((s, i) => (
                <div key={i} className="relative rounded-xl border border-gray-200 p-4 bg-rose-50/20 space-y-3">
                  <button
                    onClick={() =>
                      setKey(
                        'homeStats',
                        data.homeStats.filter((_, idx) => idx !== i)
                      )
                    }
                    disabled={data.homeStats.length <= 1}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-md bg-white text-red-600 hover:bg-red-50 flex items-center justify-center text-sm border border-gray-200 disabled:opacity-40"
                  >
                    ×
                  </button>
                  <LabelField label="Big Value">
                    <input
                      value={s.value}
                      onChange={(e) => {
                        const next = [...data.homeStats];
                        next[i] = { ...s, value: e.target.value };
                        setKey('homeStats', next);
                      }}
                      className={baseInput}
                    />
                  </LabelField>
                  <LabelField label="Label below">
                    <input
                      value={s.label}
                      onChange={(e) => {
                        const next = [...data.homeStats];
                        next[i] = { ...s, label: e.target.value };
                        setKey('homeStats', next);
                      }}
                      className={baseInput}
                    />
                  </LabelField>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ===== 7. CTA ===== */}
        <SectionCard
          id="sec-cta"
          icon={Sparkles}
          gradient="from-slate-800 to-blue-800"
          title="Final CTA Banner"
          description="Bottom of /about page. Gradient banner with a headline and two call-to-action buttons."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelField label="CTA Title" className="sm:col-span-2">
              <input
                value={data.cta.title}
                onChange={(e) => setKey('cta', { ...data.cta, title: e.target.value })}
                className={baseInput}
              />
            </LabelField>
            <LabelField label="CTA Subtitle" className="sm:col-span-2">
              <textarea
                rows={3}
                value={data.cta.subtitle}
                onChange={(e) => setKey('cta', { ...data.cta, subtitle: e.target.value })}
                className={`${baseInput} resize-y`}
              />
            </LabelField>
            <div>
              <h4 className="font-semibold text-sm text-gray-800 mb-2 text-emerald-700">✅ Primary Button</h4>
              <div className="space-y-2">
                <LabelField label="Label">
                  <input
                    value={data.cta.primaryButton.label}
                    onChange={(e) => setKey('cta', { ...data.cta, primaryButton: { ...data.cta.primaryButton, label: e.target.value } })}
                    className={baseInput}
                  />
                </LabelField>
                <LabelField label="Href (internal or external)">
                  <input
                    value={data.cta.primaryButton.href}
                    onChange={(e) => setKey('cta', { ...data.cta, primaryButton: { ...data.cta.primaryButton, href: e.target.value } })}
                    className={baseInput}
                  />
                </LabelField>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-800 mb-2 text-blue-700">⚪ Secondary Button</h4>
              <div className="space-y-2">
                <LabelField label="Label">
                  <input
                    value={data.cta.secondaryButton.label}
                    onChange={(e) => setKey('cta', { ...data.cta, secondaryButton: { ...data.cta.secondaryButton, label: e.target.value } })}
                    className={baseInput}
                  />
                </LabelField>
                <LabelField label="Href">
                  <input
                    value={data.cta.secondaryButton.href}
                    onChange={(e) => setKey('cta', { ...data.cta, secondaryButton: { ...data.cta.secondaryButton, href: e.target.value } })}
                    className={baseInput}
                  />
                </LabelField>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Mobile sticky save bar */}
        <div className="sm:hidden sticky bottom-4 flex items-center justify-end gap-2 pt-4">
          {savedAt && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-lg shadow-amber-500/30 font-semibold disabled:opacity-60"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving…' : 'Save All'}
          </button>
        </div>
    </div>
  );
}
