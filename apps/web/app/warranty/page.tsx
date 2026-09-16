"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import imageLoader from "@/lib/imageLoader";
import { MainLayout } from "@/components/MainLayout";
import { CheckCircle, Shield, Clock, Wrench, Phone, Mail, MapPin, Award, Car } from "lucide-react";

interface WarrantyDocument {
  id: string;
  title: string;
  description: string;
  url: string;
  fileName: string;
  fileSize: number | null;
  uploadedAt: string | null;
}

interface WarrantyPageContent {
  hero: { eyebrow: string; title: string; subtitle: string };
  documents: WarrantyDocument[];
}

const FALLBACK_PAGE_CONTENT: WarrantyPageContent = {
  hero: {
    eyebrow: "VEHICLE WARRANTY",
    title: "Protection You Can Rely On",
    subtitle:
      "Geely's warranty policy covers manufacturing defects and workmanship issues under normal usage conditions. All repairs are performed by certified technicians using genuine Geely parts to maintain the integrity, safety, and performance of your vehicle.",
  },
  documents: [],
};

interface WarrantySettings {
  warranty: { vehicle: string; battery: string; paintwork: string; corrosion: string };
  serviceIntervals: { standard: string; electric: string };
}

const FALLBACK_WARRANTY: WarrantySettings = {
  warranty: {
    vehicle: "5 Years or 150,000 km (whichever comes first)",
    battery: "8 Years or 160,000 km (for EV battery packs)",
    paintwork: "3 Years or 100,000 km against perforation",
    corrosion: "12 Years Against Perforation Corrosion",
  },
  serviceIntervals: {
    standard: "Every 10,000 km or 6 months",
    electric: "Every 20,000 km or 12 months",
  },
};

interface CoverageItem {
  title: string;
  description: string;
}

const FALLBACK_COVERED: CoverageItem[] = [
  { title: "Powertrain Components", description: "Engine, transmission, drive axle, and all internal parts" },
  { title: "Electrical Systems", description: "All factory-installed electrical and electronic components" },
  { title: "Safety Systems", description: "Airbags, ABS, stability control, and all safety features" },
  { title: "Climate Control", description: "Air conditioning and heating systems" },
  { title: "Steering & Suspension", description: "Steering mechanism and suspension components" },
  { title: "Body & Paint", description: "3-year coverage against manufacturing defects and corrosion perforation" },
];

const FALLBACK_NOT_COVERED: CoverageItem[] = [
  { title: "Normal Wear & Tear", description: "Brake pads, wiper blades, tires, filters, and bulbs" },
  { title: "Misuse & Neglect", description: "Damage from accidents, abuse, or lack of maintenance" },
  { title: "Unauthorized Modifications", description: "Aftermarket parts or modifications not approved by Geely" },
  { title: "Environmental Damage", description: "Damage from natural disasters, fire, or vandalism" },
  { title: "Commercial Use", description: "Vehicles used for taxi, rental, or commercial purposes" },
  { title: "Cosmetic Issues", description: "Minor scratches, dents, or stone chips not affecting function" },
];

const FALLBACK_CONTACT = {
  phone: "+251 99 338 9874",
  phoneHref: "tel:+251993389874",
  email: "warranty@geelyethiopia.com",
};

export default function WarrantyPage() {
  const [content, setContent] = useState<WarrantyPageContent>(FALLBACK_PAGE_CONTENT);
  const [settings, setSettings] = useState<WarrantySettings>(FALLBACK_WARRANTY);
  const [contact, setContact] = useState(FALLBACK_CONTACT);
  const [whatsCovered, setWhatsCovered] = useState<CoverageItem[]>(FALLBACK_COVERED);
  const [whatsNotCovered, setWhatsNotCovered] = useState<CoverageItem[]>(FALLBACK_NOT_COVERED);

  useEffect(() => {
    fetch("/api/public/warranty-page")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setContent({
          hero: { ...FALLBACK_PAGE_CONTENT.hero, ...(d.hero ?? {}) },
          documents: Array.isArray(d.documents) ? d.documents.filter((doc: WarrantyDocument) => doc.url) : [],
        });
        if (Array.isArray(d.whatsCovered) && d.whatsCovered.length) setWhatsCovered(d.whatsCovered);
        if (Array.isArray(d.whatsNotCovered) && d.whatsNotCovered.length) setWhatsNotCovered(d.whatsNotCovered);
      })
      .catch(() => {});

    fetch("/api/public/vehicle-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.warranty && setSettings(d))
      .catch(() => {});

    fetch("/api/public/contact-information")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const phone = d?.phone?.service || d?.phone?.primary;
        const email = d?.email?.support || d?.email?.general;
        if (phone || email) {
          setContact((prev) => ({
            phone: phone || prev.phone,
            phoneHref: phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : prev.phoneHref,
            email: email || prev.email,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative min-h-[420px] md:h-[480px] bg-white overflow-hidden">
        <Image
          src="/images/vehicles/ex5/ex5-hero.jpg"
          alt="Geely vehicle on the road"
          loader={imageLoader}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-white/10 dark:from-midnight-surface dark:via-midnight-surface/75 dark:to-midnight-surface/10" />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 h-full flex flex-col justify-center py-16">
          <div className="text-[13px] tracking-[0.14em] text-geely-blue font-bold mb-3">
            {content.hero.eyebrow}
          </div>
          <h1 className="disp text-5xl font-bold mb-4 max-w-xl text-navy dark:text-ice">
            {content.hero.title}
          </h1>
          <p className="text-steel dark:text-steel-light text-base max-w-2xl">
            {content.hero.subtitle}
          </p>
        </div>
      </div>

      {/* Warranty Documents */}
      <section className="py-16 bg-white dark:bg-midnight-surface">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-navy dark:text-ice text-center mb-2">Download Warranty Documents</h2>
          <p className="text-center text-steel dark:text-steel-light text-sm mb-12 max-w-2xl mx-auto">
            Access the official warranty booklet for your Geely model. Select your vehicle below to download detailed coverage terms, conditions, and service information.
          </p>
          {content.documents.length > 0 ? (
            <div className="max-w-2xl mx-auto divide-y divide-line dark:divide-midnight-line">
              {content.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-6 py-5">
                  <div className="min-w-0">
                    <h3 className="font-bold text-navy dark:text-ice">{doc.title || "Warranty Document"}</h3>
                    {doc.description && (
                      <p className="text-sm text-steel dark:text-steel-light mt-1">{doc.description}</p>
                    )}
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-geely-blue font-semibold text-sm hover:underline"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-steel dark:text-steel-light">
              Warranty documents will be published here soon.
            </p>
          )}
        </div>
      </section>

      {/* Warranty Benefits */}
      <section className="py-12 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Vehicle Warranty</h3>
              <p className="text-xs text-steel dark:text-steel-light">{settings.warranty.vehicle}</p>
            </div>
            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">EV Battery Warranty</h3>
              <p className="text-xs text-steel dark:text-steel-light">{settings.warranty.battery}</p>
            </div>
            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wrench className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Factory-Backed</h3>
              <p className="text-xs text-steel dark:text-steel-light">
                Genuine parts and authorized service
              </p>
            </div>
            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">24/7 Support</h3>
              <p className="text-xs text-steel dark:text-steel-light">
                Always available when you need us
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Covered / Not Covered */}
      <section id="coverage" className="py-16 bg-white dark:bg-midnight-surface">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-navy dark:text-ice mb-6">What&apos;s Covered</h2>
              <div className="space-y-4">
                {whatsCovered.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h3 className="font-bold text-navy dark:text-ice mb-1">{item.title}</h3>
                      <p className="text-sm text-steel dark:text-steel-light">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-navy dark:text-ice mb-6">What&apos;s Not Covered</h2>
              <div className="space-y-4">
                {whatsNotCovered.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-5 h-5 border-2 border-red-500 rounded-full flex-shrink-0 mt-1"></div>
                    <div>
                      <h3 className="font-bold text-navy dark:text-ice mb-1">{item.title}</h3>
                      <p className="text-sm text-steel dark:text-steel-light">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Coverage & Service Intervals */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-navy dark:text-ice text-center mb-2">Warranty Coverage</h2>
          <p className="text-center text-steel dark:text-steel-light text-sm mb-12">Managed by our team and always kept current here</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-midnight-surface rounded-lg overflow-hidden border border-line dark:border-midnight-line hover:shadow-lg transition-all">
              <div className="bg-navy text-white p-5 flex items-center gap-3">
                <Car size={20} className="text-gold" />
                <h3 className="font-bold">Vehicle Warranty</h3>
              </div>
              <div className="p-5 text-sm text-steel dark:text-steel-light">{settings.warranty.vehicle}</div>
            </div>
            <div className="bg-white dark:bg-midnight-surface rounded-lg overflow-hidden border border-line dark:border-midnight-line hover:shadow-lg transition-all">
              <div className="bg-navy text-white p-5 flex items-center gap-3">
                <Award size={20} className="text-gold" />
                <h3 className="font-bold">EV Battery Warranty</h3>
              </div>
              <div className="p-5 text-sm text-steel dark:text-steel-light">{settings.warranty.battery}</div>
            </div>
            <div className="bg-white dark:bg-midnight-surface rounded-lg overflow-hidden border border-line dark:border-midnight-line hover:shadow-lg transition-all">
              <div className="bg-navy text-white p-5 flex items-center gap-3">
                <Shield size={20} className="text-gold" />
                <h3 className="font-bold">Paintwork Warranty</h3>
              </div>
              <div className="p-5 text-sm text-steel dark:text-steel-light">{settings.warranty.paintwork}</div>
            </div>
            <div className="bg-white dark:bg-midnight-surface rounded-lg overflow-hidden border border-line dark:border-midnight-line hover:shadow-lg transition-all">
              <div className="bg-navy text-white p-5 flex items-center gap-3">
                <Shield size={20} className="text-gold" />
                <h3 className="font-bold">Corrosion Warranty</h3>
              </div>
              <div className="p-5 text-sm text-steel dark:text-steel-light">{settings.warranty.corrosion}</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-navy dark:text-ice text-center mt-16 mb-8">Recommended Service Intervals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6 text-center">
              <Wrench className="text-geely-blue mx-auto mb-3" size={24} />
              <h3 className="font-bold text-navy dark:text-ice mb-1">Petrol / Hybrid</h3>
              <p className="text-sm text-steel dark:text-steel-light">{settings.serviceIntervals.standard}</p>
            </div>
            <div className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6 text-center">
              <Wrench className="text-geely-blue mx-auto mb-3" size={24} />
              <h3 className="font-bold text-navy dark:text-ice mb-1">Electric Vehicles</h3>
              <p className="text-sm text-steel dark:text-steel-light">{settings.serviceIntervals.electric}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Claim CTA */}
      <section className="py-16 bg-white dark:bg-midnight-surface">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-gradient-to-r from-geely-blue to-blue-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Need to File a Warranty Claim?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              If you&apos;re experiencing issues with your Geely vehicle covered under warranty, submit a claim online or contact our service team.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/warranty/claim"
                className="bg-white dark:bg-midnight-surface text-geely-blue font-bold text-base px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all"
              >
                File a Claim Online
              </Link>
              <a
                href={contact.phoneHref}
                className="border-2 border-white text-white font-bold text-base px-8 py-4 hover:bg-white hover:text-geely-blue transition-all"
              >
                Call Service Center
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-navy dark:text-ice text-center mb-12">Questions About Your Warranty?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Call Us</h3>
              <p className="text-sm text-steel dark:text-steel-light mb-2">Speak with our warranty team</p>
              <a href={contact.phoneHref} className="text-geely-blue font-semibold hover:underline">
                {contact.phone}
              </a>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Email Us</h3>
              <p className="text-sm text-steel dark:text-steel-light mb-2">Get detailed answers</p>
              <a href={`mailto:${contact.email}`} className="text-geely-blue font-semibold hover:underline">
                {contact.email}
              </a>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Visit Us</h3>
              <p className="text-sm text-steel dark:text-steel-light mb-2">Find your nearest dealer</p>
              <Link href="/dealers" className="text-geely-blue font-semibold hover:underline">
                Find Dealer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Let's Talk Now CTA */}
      <section className="py-20 bg-white dark:bg-midnight-surface text-center">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-navy dark:text-ice mb-4">Let&apos;s Talk Now</h2>
          <p className="text-steel dark:text-steel-light max-w-2xl mx-auto mb-8">
            Have a question or need support? Our dedicated team is ready to provide the guidance you need. Connect with us to experience the professional service, meticulous care, and cutting-edge innovation that define the Geely brand.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-geely-blue text-white font-bold text-base px-10 py-4 hover:bg-opacity-90 transition-all"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
