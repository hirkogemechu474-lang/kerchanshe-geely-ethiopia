"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  Landmark,
  Phone,
  ShieldCheck,
  ExternalLink,
  Building2,
  Wallet,
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { withBasePath } from "@/lib/publicPath";
import {
  mergeFinancingPageContent,
  type FinancingPageContent,
} from "@/lib/financingPageContent";

interface Vehicle {
  id: string;
  name: string;
  finalPrice?: number | null;
  basePrice?: number | null;
  hidePrice?: boolean;
  heroImageUrl?: string | null;
}

interface Bank {
  id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  phoneNumber?: string | null;
  shortDescription?: string | null;
  _count?: { financingPrograms?: number };
}

const bankLogoHref = (url: string): string => {
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return withBasePath(url);
};

function BankLogo({ bank, className = "" }: { bank: Bank; className?: string }) {
  if (!bank.logoUrl) {
    return (
      <span className={`flex items-center justify-center ${className}`}>
        <Landmark className="w-10 h-10 text-geely-blue/50" />
      </span>
    );
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return (
    /* eslint-disable-next-line jsx-a11y/alt-text */
    <img
      src={bankLogoHref(bank.logoUrl)}
      alt={bank.name}
      className={`object-contain ${className}`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export default function PurchasePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [content, setContent] = useState<FinancingPageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [vehiclesResponse, banksResponse, contentResponse] = await Promise.all([
          fetch("/api/public/vehicles"),
          fetch("/api/public/financing-banks"),
          fetch("/api/public/financing-page-content"),
        ]);
        const vehiclesData = await vehiclesResponse.json().catch(() => []);
        const banksData = await banksResponse.json().catch(() => []);
        const contentData = await contentResponse.json().catch(() => null);
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData?.vehicles || []);
        setBanks(
          Array.isArray(banksData)
            ? banksData.filter(
                (bank: Bank) => (bank._count?.financingPrograms ?? 1) > 0
              )
            : []
        );
        setContent(mergeFinancingPageContent(contentData));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (!content) {
    return (
      <MainLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-pulse text-steel dark:text-steel-light">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  const { hero, banksSection, vehiclesSection, stepsSection, benefitsSection, contactStrip } = content;
  const featuredBank = banks[0];

  return (
    <MainLayout>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-navy text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-mesh-blue opacity-90" aria-hidden="true" />
        <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-4 py-1.5 mb-6">
              <Landmark className="w-4 h-4 text-gold" />
              <span className="text-[12px] tracking-[0.18em] text-white font-semibold uppercase">
                {hero.badge}
              </span>
            </div>
            <h1 className="disp text-4xl md:text-6xl font-bold leading-[1.05] mb-6">
              {hero.titleLine1}
              <span className="block text-gold">{hero.titleLine2}</span>
            </h1>
            <p className="text-[#d8e4f5] text-lg leading-relaxed max-w-2xl mb-9">
              {hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <a
                href="#banks"
                className="inline-flex items-center gap-2 bg-gold text-[#2c2308] font-bold px-8 py-4 rounded-xl hover:bg-opacity-90 hover:shadow-lg hover:shadow-gold/20 transition-all"
              >
                {hero.primaryCtaLabel} <ArrowRight size={20} />
              </a>
              <a
                href="#vehicles"
                className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/25 font-bold px-8 py-4 hover:bg-white/15 transition-all"
              >
                {hero.secondaryCtaLabel} <CreditCard size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bank statistics strip ───────────────────────────────────── */}
      <section className="border-b border-line dark:border-midnight-line bg-white dark:bg-midnight-surface">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-active-blue/10 text-geely-blue flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy dark:text-ice">
                {loading ? "..." : banks.length}
              </div>
              <div className="text-sm text-steel dark:text-steel-light">
                Partner financing banks
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-active-blue/10 text-geely-blue flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy dark:text-ice">
                {loading ? "..." : vehicles.length}
              </div>
              <div className="text-sm text-steel dark:text-steel-light">
                Available Geely models
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-active-blue/10 text-geely-blue flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy dark:text-ice">Secure</div>
              <div className="text-sm text-steel dark:text-steel-light">
                Authenticated bank payment
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Select Your Bank (WesBank-style logo grid) ──────────────── */}
      <section id="banks" className="py-20 bg-ice dark:bg-midnight transition-colors scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="max-w-2xl mb-10">
            <div className="text-[13px] tracking-[0.2em] text-geely-blue font-bold mb-3 uppercase">
              {banksSection.kicker}
            </div>
            <h2 className="disp text-3xl md:text-4xl font-bold text-navy dark:text-ice mb-4">
              {banksSection.title}
            </h2>
            <p className="text-steel dark:text-steel-light leading-relaxed">
              {banksSection.subtitle}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line animate-pulse"
                />
              ))}
            </div>
          ) : banks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-12 text-center">
              <Landmark className="w-10 h-10 text-steel mx-auto mb-4" />
              <p className="text-steel dark:text-steel-light font-medium">
                {banksSection.emptyStateTitle}
              </p>
              <p className="text-sm text-steel dark:text-steel-light mt-1">
                {banksSection.emptyStateBody}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {banks.map((bank) => (
                <Link
                  key={bank.id}
                  href={bank.websiteUrl || (vehicles[0] ? `/quote?model=${vehicles[0].id}` : "/quote")}
                  target={bank.websiteUrl ? "_blank" : undefined}
                  rel={bank.websiteUrl ? "noopener noreferrer" : undefined}
                  className="group bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line p-6 flex flex-col items-center justify-center gap-4 text-center hover:border-geely-blue hover:shadow-xl hover:shadow-active-blue/10 hover:-translate-y-1 transition-all min-h-[150px]"
                >
                  <div className="h-14 w-full flex items-center justify-center">
                    <BankLogo bank={bank} className="max-h-12 max-w-[140px]" />
                  </div>
                  <div>
                    <div className="font-bold text-navy dark:text-ice">
                      {bank.name}
                    </div>
                    {bank.shortDescription && (
                      <div className="text-xs text-steel dark:text-steel-light mt-1 line-clamp-2">
                        {bank.shortDescription}
                      </div>
                    )}
                    <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-geely-blue opacity-0 group-hover:opacity-100 transition-opacity">
                      {bank.websiteUrl ? "Visit Website" : "Begin application"} <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 rounded-2xl bg-navy text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">
                  {banksSection.helpPanelTitle}
                </h3>
                <p className="text-[#b9cbe4] text-sm max-w-xl">
                  {banksSection.helpPanelBody}
                </p>
              </div>
            </div>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-gold text-[#2c2308] font-bold px-7 py-3.5 rounded-xl hover:bg-opacity-90 transition-all whitespace-nowrap"
            >
              {banksSection.helpPanelCtaLabel} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Select Your Geely (vehicles) ────────────────────────────── */}
      <section id="vehicles" className="py-20 bg-white dark:bg-midnight-surface scroll-mt-24 transition-colors">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="max-w-2xl mb-10">
            <div className="text-[13px] tracking-[0.2em] text-geely-blue font-bold mb-3 uppercase">
              {vehiclesSection.kicker}
            </div>
            <h2 className="disp text-3xl md:text-4xl font-bold text-navy dark:text-ice mb-3">
              {vehiclesSection.title}
            </h2>
            <p className="text-steel dark:text-steel-light">
              {vehiclesSection.subtitle}
            </p>
          </div>

          {vehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line dark:border-midnight-line p-12 text-center text-steel dark:text-steel-light">
              {vehiclesSection.emptyState}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vehicles.map((vehicle) => {
                return (
                  <div
                    key={vehicle.id}
                    className="bg-ice dark:bg-midnight rounded-2xl border border-line dark:border-midnight-line overflow-hidden hover:shadow-xl transition-all group"
                  >
                    <div className="h-44 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center overflow-hidden">
                      {vehicle.heroImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={withBasePath(vehicle.heroImageUrl)}
                          alt={vehicle.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-steel dark:text-steel-light text-sm">
                          {vehicle.name}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-navy dark:text-ice text-lg mb-2">
                        {vehicle.name}
                      </h3>
                      <Link
                        href={`/financing/apply?vehicle=${vehicle.id}`}
                        className="block text-center bg-geely-blue text-white font-bold text-sm py-3 hover:bg-navy transition-all"
                      >
                        {vehiclesSection.ctaLabel}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="py-20 bg-ice dark:bg-midnight transition-colors">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <div className="text-[13px] tracking-[0.2em] text-geely-blue font-bold mb-3 uppercase">
              {stepsSection.kicker}
            </div>
            <h2 className="disp text-3xl md:text-4xl font-bold text-navy dark:text-ice mb-3">
              {stepsSection.title}
            </h2>
            <p className="text-steel dark:text-steel-light max-w-2xl mx-auto">
              {stepsSection.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stepsSection.steps.map((step, index) => (
              <div
                key={index}
                className="bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line p-7 hover:shadow-lg transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-geely-blue text-white flex items-center justify-center font-bold text-lg mb-5">
                  {index + 1}
                </div>
                <h3 className="font-bold text-navy dark:text-ice text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-steel dark:text-steel-light leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ────────────────────────────────────────────────── */}
      <section className="bg-navy text-white py-16">
        <div className="max-w-[1000px] mx-auto px-6 md:px-10">
          <h2 className="disp text-2xl md:text-3xl font-bold text-center mb-8">
            {benefitsSection.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {benefitsSection.benefits.map((benefit, index) => (
              <div key={index}>
                {index === 0 ? (
                  <ShieldCheck className="text-gold mx-auto mb-3" size={30} />
                ) : index === 1 ? (
                  <CheckCircle className="text-gold mx-auto mb-3" size={30} />
                ) : (
                  <CreditCard className="text-gold mx-auto mb-3" size={30} />
                )}
                <h3 className="font-bold mb-1">{benefit.title}</h3>
                <p className="text-sm text-[#b9cbe4]">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact strip ───────────────────────────────────────────── */}
      {contactStrip.enabled && (
        <section className="border-t border-black/[0.06] dark:border-midnight-line bg-white dark:bg-midnight-surface">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-navy dark:text-ice mb-1">
                {contactStrip.title}
              </h3>
              <p className="text-sm text-steel dark:text-steel-light">
                {contactStrip.body}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-geely-blue text-white font-bold px-6 py-3 hover:bg-navy transition-all"
              >
                {contactStrip.callLabel} <Phone size={17} />
              </a>
              <a
                href="/quote"
                className="inline-flex items-center justify-center gap-2 border border-geely-blue text-geely-blue font-bold px-6 py-3 hover:bg-active-blue/10 transition-all"
              >
                {contactStrip.ctaLabel} <ExternalLink size={17} />
              </a>
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
