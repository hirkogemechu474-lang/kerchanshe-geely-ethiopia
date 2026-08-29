"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/MainLayout";
import { CheckCircle, Shield, Clock, Wrench, FileText, Phone, Mail, MapPin, Award, Car, Download } from "lucide-react";

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
  whatsCovered: CoverageItem[];
  whatsNotCovered: CoverageItem[];
  cta: { title: string; description: string };
  documents: WarrantyDocument[];
}

const FALLBACK_PAGE_CONTENT: WarrantyPageContent = {
  hero: {
    eyebrow: "VEHICLE WARRANTY",
    title: "Comprehensive Warranty Coverage",
    subtitle:
      "Drive with confidence knowing your Geely is protected by our comprehensive warranty program. Quality, reliability, and peace of mind guaranteed.",
  },
  whatsCovered: [
    { title: "Powertrain Components", description: "Engine, transmission, drive axle, and all internal parts" },
    { title: "Electrical Systems", description: "All factory-installed electrical and electronic components" },
    { title: "Safety Systems", description: "Airbags, ABS, stability control, and all safety features" },
    { title: "Climate Control", description: "Air conditioning and heating systems" },
    { title: "Steering & Suspension", description: "Steering mechanism and suspension components" },
    { title: "Body & Paint", description: "3-year coverage against manufacturing defects and corrosion perforation" },
  ],
  whatsNotCovered: [
    { title: "Normal Wear & Tear", description: "Brake pads, wiper blades, tires, filters, and bulbs" },
    { title: "Misuse & Neglect", description: "Damage from accidents, abuse, or lack of maintenance" },
    { title: "Unauthorized Modifications", description: "Aftermarket parts or modifications not approved by Geely" },
    { title: "Environmental Damage", description: "Damage from natural disasters, fire, or vandalism" },
    { title: "Commercial Use", description: "Vehicles used for taxi, rental, or commercial purposes" },
    { title: "Cosmetic Issues", description: "Minor scratches, dents, or stone chips not affecting function" },
  ],
  cta: {
    title: "Need to File a Warranty Claim?",
    description:
      "If you're experiencing issues with your Geely vehicle covered under warranty, submit a claim online or contact our service team.",
  },
  documents: [],
};

const FALLBACK_CONTACT = {
  phone: "+251 91 123 4567",
  phoneHref: "tel:+251911234567",
  email: "warranty@geelyethiopia.com",
};

interface WarrantyClaimData {
  // Owner Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Vehicle Information
  vin: string;
  model: string;
  year: string;
  purchaseDate: string;
  currentMileage: string;
  
  // Claim Details
  issueCategory: string;
  issueDescription: string;
  firstOccurrence: string;
  dealerVisited: string;
  
  // Documents
  hasProofOfPurchase: string;
  hasServiceRecords: string;
  
  preferredContactMethod: string;
  consent: boolean;
}

export default function WarrantyPage() {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<WarrantySettings>(FALLBACK_WARRANTY);
  const [contact, setContact] = useState(FALLBACK_CONTACT);
  const [content, setContent] = useState<WarrantyPageContent>(FALLBACK_PAGE_CONTENT);

  useEffect(() => {
    fetch("/api/public/vehicle-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.warranty && setSettings(d))
      .catch(() => {});

    fetch("/api/public/warranty-page")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setContent({
          hero: { ...FALLBACK_PAGE_CONTENT.hero, ...(d.hero ?? {}) },
          whatsCovered: Array.isArray(d.whatsCovered) && d.whatsCovered.length ? d.whatsCovered : FALLBACK_PAGE_CONTENT.whatsCovered,
          whatsNotCovered: Array.isArray(d.whatsNotCovered) && d.whatsNotCovered.length ? d.whatsNotCovered : FALLBACK_PAGE_CONTENT.whatsNotCovered,
          cta: { ...FALLBACK_PAGE_CONTENT.cta, ...(d.cta ?? {}) },
          documents: Array.isArray(d.documents) ? d.documents.filter((doc: WarrantyDocument) => doc.url) : [],
        });
      })
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WarrantyClaimData>();

  const onSubmit = async (data: WarrantyClaimData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    console.log("Warranty Claim Submission:", data);
    setIsSubmitted(true);
    setIsSubmitting(false);
    setShowClaimForm(false);
    reset();

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h1 className="disp text-4xl font-bold text-navy dark:text-ice mb-4">
              Warranty Claim Submitted!
            </h1>
            <p className="text-lg text-steel dark:text-steel-light mb-8 leading-relaxed">
              Your warranty claim has been received. Our service team will review your case and contact you within 1-2 business days.
            </p>
            <div className="bg-ice dark:bg-midnight p-6 rounded-lg mb-8">
              <p className="text-sm text-steel dark:text-steel-light mb-2">
                <strong className="text-navy dark:text-ice">What Happens Next:</strong>
              </p>
              <ul className="text-sm text-steel dark:text-steel-light text-left space-y-2 max-w-md mx-auto">
                <li>✓ Claim review by warranty specialist</li>
                <li>✓ Vehicle inspection scheduling</li>
                <li>✓ Approval notification</li>
                <li>✓ Authorized repair at nearest dealer</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setShowClaimForm(true);
                }}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
              >
                Submit Another Claim
              </button>
              <a
                href="/service"
                className="border border-line dark:border-midnight-line text-navy dark:text-ice font-semibold text-sm px-8 py-4 rounded hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight transition-all"
              >
                Book Service
              </a>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            {content.hero.eyebrow}
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            {content.hero.title}
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            {content.hero.subtitle}
          </p>
        </div>
      </div>

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

      {/* Warranty Details */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* What's Covered */}
            <div>
              <h2 className="text-3xl font-bold text-navy dark:text-ice mb-6">What's Covered</h2>
              <div className="space-y-4">
                {content.whatsCovered.map((item, index) => (
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

            {/* What's Not Covered */}
            <div>
              <h2 className="text-3xl font-bold text-navy dark:text-ice mb-6">What's Not Covered</h2>
              <div className="space-y-4">
                {content.whatsNotCovered.map((item, index) => (
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

      {/* Warranty Documents */}
      {content.documents.length > 0 && (
        <section className="py-16 bg-white dark:bg-midnight-surface">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <h2 className="text-3xl font-bold text-navy dark:text-ice text-center mb-2">Warranty Documents</h2>
            <p className="text-center text-steel dark:text-steel-light text-sm mb-12">
              Download the full terms, conditions, and claim guidance
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {content.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-ice dark:bg-midnight rounded-xl border border-line dark:border-midnight-line p-6 hover:border-geely-blue hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-opacity-20 transition-all">
                      <FileText className="text-geely-blue" size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-navy dark:text-ice leading-snug">{doc.title || "Warranty Document"}</h3>
                      {doc.fileSize && (
                        <p className="text-xs text-steel dark:text-steel-light mt-0.5">PDF · {(doc.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                      )}
                    </div>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-steel dark:text-steel-light mb-4 flex-1">{doc.description}</p>
                  )}
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-geely-blue">
                    <Download size={16} />
                    Download PDF
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-gradient-to-r from-geely-blue to-blue-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">{content.cta.title}</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              {content.cta.description}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => {
                  setShowClaimForm(true);
                  setTimeout(() => {
                    document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="bg-white dark:bg-midnight-surface text-geely-blue font-bold text-base px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all"
              >
                File a Claim Online
              </button>
              <a
                href={contact.phoneHref}
                className="border-2 border-white text-white font-bold text-base px-8 py-4 rounded-lg hover:bg-white hover:text-geely-blue transition-all"
              >
                Call Service Center
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Claim Form */}
      {showClaimForm && (
        <section id="claim-form" className="py-16 bg-ice">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-line shadow-lg overflow-hidden">
              <div className="bg-navy text-white p-6 border-b border-line">
                <h2 className="text-2xl font-bold">File a Warranty Claim</h2>
                <p className="text-sm text-[#d8e4f5] mt-1">Complete the form below and our service team will contact you</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Owner Information */}
                <div>
                  <h3 className="text-lg font-bold text-navy mb-4">Owner Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("firstName", { required: "First name is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.firstName ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("lastName", { required: "Last name is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.lastName ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.email ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        {...register("phone", {
                          required: "Phone number is required",
                          pattern: {
                            value: /^[0-9+\-\s()]+$/,
                            message: "Invalid phone number",
                          },
                        })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.phone ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="+251 91 234 5678"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2">
                        VIN (Vehicle Identification Number) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("vin", { required: "VIN is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.vin ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="17-character VIN"
                      />
                      {errors.vin && (
                        <p className="text-red-500 text-xs mt-1">{errors.vin.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("model", { required: "Model is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.model ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                      >
                        <option value="">Select model</option>
                        <option value="coolray">Coolray</option>
                        <option value="emgrand">Emgrand</option>
                        <option value="monjaro">Monjaro</option>
                        <option value="azkarra">Azkarra</option>
                        <option value="okavango">Okavango</option>
                      </select>
                      {errors.model && (
                        <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register("year", {
                          required: "Year is required",
                          min: { value: 2015, message: "Year must be 2015 or later" },
                          max: { value: 2027, message: "Invalid year" },
                        })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.year ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="2024"
                      />
                      {errors.year && (
                        <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Purchase Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...register("purchaseDate", { required: "Purchase date is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.purchaseDate ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                      />
                      {errors.purchaseDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.purchaseDate.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Current Mileage (km) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register("currentMileage", { required: "Mileage is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.currentMileage ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="e.g., 25000"
                      />
                      {errors.currentMileage && (
                        <p className="text-red-500 text-xs mt-1">{errors.currentMileage.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Claim Details */}
                <div>
                  <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">Claim Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2">
                        Issue Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("issueCategory", { required: "Category is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.issueCategory ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                      >
                        <option value="">Select category</option>
                        <option value="engine">Engine/Powertrain</option>
                        <option value="transmission">Transmission</option>
                        <option value="electrical">Electrical System</option>
                        <option value="brakes">Brakes</option>
                        <option value="suspension">Suspension/Steering</option>
                        <option value="climate">Climate Control</option>
                        <option value="safety">Safety Systems</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.issueCategory && (
                        <p className="text-red-500 text-xs mt-1">{errors.issueCategory.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Detailed Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register("issueDescription", { required: "Description is required" })}
                        rows={5}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.issueDescription ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="Describe the issue in detail: when it started, symptoms, any warning lights, etc."
                      ></textarea>
                      {errors.issueDescription && (
                        <p className="text-red-500 text-xs mt-1">{errors.issueDescription.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                          When did this first occur? <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          {...register("firstOccurrence", { required: "Date is required" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.firstOccurrence ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                          }`}
                        />
                        {errors.firstOccurrence && (
                          <p className="text-red-500 text-xs mt-1">{errors.firstOccurrence.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                          Have you visited a dealer? <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("dealerVisited", { required: "Please select" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.dealerVisited ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                          }`}
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes, issue inspected</option>
                          <option value="no">No, not yet</option>
                        </select>
                        {errors.dealerVisited && (
                          <p className="text-red-500 text-xs mt-1">{errors.dealerVisited.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                          Proof of Purchase Available? <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("hasProofOfPurchase", { required: "Please select" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.hasProofOfPurchase ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                          }`}
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes, I have it</option>
                          <option value="no">No, need to obtain</option>
                        </select>
                        {errors.hasProofOfPurchase && (
                          <p className="text-red-500 text-xs mt-1">{errors.hasProofOfPurchase.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                          Service Records Available? <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("hasServiceRecords", { required: "Please select" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.hasServiceRecords ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                          }`}
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes, full records</option>
                          <option value="partial">Partial records</option>
                          <option value="no">No records</option>
                        </select>
                        {errors.hasServiceRecords && (
                          <p className="text-red-500 text-xs mt-1">{errors.hasServiceRecords.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Preferred Contact Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("preferredContactMethod", { required: "Please select" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.preferredContactMethod ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                      >
                        <option value="">Select</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="either">Either</option>
                      </select>
                      {errors.preferredContactMethod && (
                        <p className="text-red-500 text-xs mt-1">{errors.preferredContactMethod.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3 p-4 bg-ice dark:bg-midnight rounded-lg">
                  <input
                    type="checkbox"
                    {...register("consent", {
                      required: "You must agree to the terms to continue",
                    })}
                    className="mt-1 w-4 h-4 accent-geely-blue"
                  />
                  <div>
                    <label className="text-sm text-navy dark:text-ice">
                      <span className="text-red-500">* </span>
                      I confirm that all information provided is accurate and agree to Geely Ethiopia's{" "}
                      <a href="/privacy" className="text-geely-blue hover:underline">
                        Privacy Policy
                      </a>{" "}
                      and warranty terms.
                    </label>
                    {errors.consent && (
                      <p className="text-red-500 text-xs mt-1">{errors.consent.message}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-geely-blue text-white font-bold text-base py-4 rounded-lg transition-all ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-opacity-90"
                    }`}
                  >
                    {isSubmitting ? "Submitting Claim..." : "Submit Warranty Claim"}
                  </button>
                  <p className="text-xs text-steel dark:text-steel-light text-center mt-3">
                    Our service team will review your claim within 1-2 business days
                  </p>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 bg-white dark:bg-midnight-surface">
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
    </MainLayout>
  );
}
