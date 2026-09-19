"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import type { VehicleRecord } from "@/lib/vehicleData";
import { WhatsAppInlineCTA } from "@/components/WhatsAppWidget";
import { validateIdDocumentNumber, validateTin } from "@/lib/idValidation";
import { withBasePath } from "@/lib/publicPath";
import { CheckCircle, FileText, DollarSign, AlertCircle, Clock, ShieldCheck, RotateCcw, Calculator, Search, Eye, UserCheck, Mail, Copy, Check, Upload } from "lucide-react";

const TIMEFRAME_LABELS: Record<string, string> = {
  '1-month': 'Within 1 month',
  '2-3-months': '2-3 months',
  '3-6-months': '3-6 months',
  '6-months-plus': 'More than 6 months',
};

// Same resolution order as the test-drive page's vehicle picker, so a
// vehicle missing a curated heroImageUrl still falls back to its first
// gallery image instead of showing a blank card.
function vehicleImageUrl(vehicle: VehicleRecord): string | null {
  const raw =
    vehicle.heroImageUrl ||
    (Array.isArray(vehicle.images) && typeof vehicle.images[0] === "string"
      ? (vehicle.images[0] as string)
      : null);
  if (!raw) return null;
  return withBasePath(raw);
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-geely-blue text-white text-xs font-bold">
      {n}
    </span>
  );
}

interface QuoteFormData {
  title: string;
  titleOther?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  customerTin?: string;
  nationalId: string;
  idDocumentType: string;
  vehicleId: string;
  quantity: number;
  referralSource: string;
  campaign: string;
  purchaseTimeframe: string;
  financingNeeded: string;
  tradeIn: string;
  tradeInDetails?: string;
  message: string;
  consent: boolean;
}

export default function QuotePage() {
  const searchParams = useSearchParams();
  const preselectedModel = searchParams.get("model");
  const requestedTrim = searchParams.get("trim");
  const requestedColor = searchParams.get("color");
  const configurationParam = searchParams.get("config");
  // Showroom QR walk-in flow: a visitor arriving here already registered
  // their name/phone/email against a ShowroomVisit row — prefill the form
  // from it instead of asking again.
  const visitId = searchParams.get("visitId") || "";
  const [configuration, setConfiguration] = useState<Record<string, unknown> | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailNotificationSent, setEmailNotificationSent] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quoteReference, setQuoteReference] = useState<string | null>(null);
  const [quotedVehicleId, setQuotedVehicleId] = useState<string | null>(null);
  const [referenceCopied, setReferenceCopied] = useState(false);
  // Digital ID capture (photo of the document) — optional, separate from
  // the form's own state since it's an async upload-then-store-URL step,
  // same pattern as TestDriveIdCapture.tsx's /api/upload/image flow.
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [idPhotoUploading, setIdPhotoUploading] = useState(false);
  const [idPhotoError, setIdPhotoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<QuoteFormData>({
    defaultValues: {
      title: "",
      vehicleId: preselectedModel || "",
      quantity: 1,
      referralSource: "",
      campaign: "",
      financingNeeded: "not-sure",
      tradeIn: "no",
      idDocumentType: "national_id",
    },
  });

  const watchTradeIn = watch("tradeIn");
  const watchTitle = watch("title");
  const watchVehicleId = watch("vehicleId");

  useEffect(() => {
    if (!configurationParam) return;
    try {
      const parsed = JSON.parse(configurationParam);
      if (parsed && typeof parsed === 'object') setConfiguration(parsed);
    } catch {
      setConfiguration(null);
    }
  }, [configurationParam]);

  useEffect(() => {
    if (!visitId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/visit/${encodeURIComponent(visitId)}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !active) return;
        const [firstName, ...lastNameParts] = String(data.fullName || "").split(" ");
        reset((current) => ({
          ...current,
          firstName: firstName || current.firstName,
          lastName: lastNameParts.join(" ") || current.lastName,
          phone: data.phone || current.phone,
          email: data.email || current.email,
        }));
      } catch {
        /* silent — the form is simply left blank */
      }
    })();
    return () => {
      active = false;
    };
  }, [visitId, reset]);

  useEffect(() => {
    let active = true;

    async function fetchVehicles() {
      try {
        const response = await fetch("/api/public/vehicles");
        if (!response.ok) return;

        const data = await response.json();
        if (active) {
          const list: VehicleRecord[] = Array.isArray(data) ? data : data?.vehicles || [];
          setVehicles(list);
          const configuredVehicle = configuration?.vehicle;
          const configuredModel = typeof configuredVehicle === 'string' ? configuredVehicle : '';
          const selected = list.find((vehicle) =>
            vehicle.id === preselectedModel || vehicle.slug === preselectedModel || vehicle.name === configuredModel
          );
          if (selected) reset((current) => ({ ...current, vehicleId: selected.id }));
        }
      } catch (error) {
        console.error("Failed to load vehicles:", error);
      } finally {
        if (active) {
          setVehiclesLoading(false);
        }
      }
    }

    void fetchVehicles();

    return () => {
      active = false;
    };
  }, [configuration, preselectedModel, reset]);

  const [contactInfo, setContactInfo] = useState<{ phone?: string; whatsapp?: string }>({});

  useEffect(() => {
    let active = true;

    async function fetchContact() {
      try {
        const res = await fetch('/api/public/contact-information', { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        const rawPhone =
          data?.phone?.primary ||
          data?.phone?.sales ||
          data?.phone ||
          '';

        const rawWhatsAppNum =
          data?.whatsapp?.replace ? data.whatsapp.replace(/\D/g, '') : '';
        const whatsappLink = rawWhatsAppNum
          ? `https://wa.me/${rawWhatsAppNum}`
          : data?.whatsapp?.startsWith?.('http')
          ? data.whatsapp
          : undefined;

        setContactInfo({ phone: rawPhone, whatsapp: whatsappLink });
      } catch {
        /* silent — defaults from useState are always set, user sees no breakage */
      }
    }

    void fetchContact();
    return () => {
      active = false;
    };
  }, []);

  const handleIdPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdPhotoUploading(true);
    setIdPhotoError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "quote-id");
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setIdPhotoUrl(data.url);
    } catch (err) {
      setIdPhotoError(err instanceof Error ? err.message : "Failed to upload ID photo. Please try again.");
    } finally {
      setIdPhotoUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (data: QuoteFormData) => {
    setSubmitError(null);
    try {
      const selectedVehicle = vehicles.find(v => v.id === data.vehicleId);
      
      const message = `
Requested trim: ${requestedTrim || 'Not specified'}
Requested color: ${requestedColor || 'Not specified'}
Quantity: ${data.quantity || 1}
Referral Source: ${data.referralSource || 'Not specified'}
Campaign: ${data.campaign || 'Not specified'}
Purchase Timeframe: ${TIMEFRAME_LABELS[data.purchaseTimeframe] || data.purchaseTimeframe}
Financing Needed: ${data.financingNeeded}
Trade-In: ${data.tradeIn}
${data.tradeInDetails ? `Trade-In Details: ${data.tradeInDetails}` : ''}
${data.message ? `Additional Message: ${data.message}` : ''}
      `.trim();

      // Save the quotation and send its SMTP notification from the quotation API.
      const quotationRequest = fetch('/api/quotations/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title === "other" ? (data.titleOther || undefined) : (data.title || undefined),
          customerName: `${data.firstName} ${data.lastName}`,
          phoneNumber: data.phone,
          email: data.email,
          nationalId: data.nationalId,
          customerAddress: data.address,
          customerTin: data.customerTin || undefined,
          idDocumentType: data.idDocumentType,
          idPhotoUrl: idPhotoUrl || undefined,
          vehicleModel: selectedVehicle?.name || data.vehicleId,
          quantity: data.quantity || 1,
          referralSource: data.referralSource || undefined,
          campaign: data.campaign || undefined,
          preferredDealer: null,
          financingInterest: data.financingNeeded === 'yes',
          tradeInInterest: data.tradeIn === 'yes',
          message,
          configuration: configuration || undefined,
          source: visitId ? 'qr-showroom' : (data.referralSource || 'website'),
          visitId: visitId || undefined,
        }),
      }).then(async res => {
        const result = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(result?.error || 'Failed to save quotation');
        }
        return result;
      });

      const quotationResult = await quotationRequest;
      // Customer delivery happens only after the sales quotation is priced and
      // manager-approved; do not show an SMTP warning for this initial lead.
      setEmailNotificationSent(null);
      setQuoteReference(quotationResult.reference || null);
      setQuotedVehicleId(data.vehicleId);

      if (visitId) {
        void fetch(`/api/visit/${encodeURIComponent(visitId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedAction: "quote" }),
        });
      }

      setIsSubmitted(true);
      reset();
      setIdPhotoUrl(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error('Failed to submit quote request:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit your quote request. Please try again.');
    }
  };

  if (isSubmitted) {
    const nextSteps = [
      {
        icon: Eye,
        title: "We review your request",
        description: "A sales consultant checks your requirements and prepares your pricing.",
      },
      {
        icon: UserCheck,
        title: "A manager approves pricing",
        description: "Final pricing is confirmed internally before anything is shared with you.",
      },
      {
        icon: Mail,
        title: "You get a secure payment link",
        description: "Only once it's approved, there's nothing to pay right now.",
      },
    ];

    const infoItems = [
      { icon: DollarSign, label: "Complete vehicle pricing breakdown" },
      { icon: Calculator, label: "Available financing options" },
      { icon: RotateCcw, label: "Trade-in valuation (if applicable)" },
      { icon: ShieldCheck, label: "Current promotions and offers" },
      { icon: FileText, label: "Warranty and service packages" },
    ];

    const copyReference = () => {
      if (!quoteReference) return;
      navigator.clipboard.writeText(quoteReference).then(() => {
        setReferenceCopied(true);
        setTimeout(() => setReferenceCopied(false), 2000);
      });
    };

    return (
      <MainLayout>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-navy to-geely-blue dark:from-midnight dark:to-navy text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,.12),transparent_45%)]" />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-20 text-center">
            <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-white" size={40} />
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">
              Quote Request Received!
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              Thank you for your interest in Geely Ethiopia. Our sales team will review your
              requirements and send you a detailed quotation within 24–48 hours.
            </p>

            {quoteReference && (
              <div className="mt-7 inline-flex items-center gap-3 rounded-xl bg-white/10 border border-white/20 pl-5 pr-2 py-2.5">
                <span className="text-xs uppercase tracking-wide text-white/60">Reference</span>
                <strong className="font-mono text-sm sm:text-base">{quoteReference}</strong>
                <button
                  onClick={copyReference}
                  aria-label="Copy reference number"
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 text-xs font-bold"
                >
                  {referenceCopied ? <Check size={14} /> : <Copy size={14} />}
                  {referenceCopied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="py-12 lg:py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10">
            {emailNotificationSent === false && (
              <div className="mb-8 rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-900/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
                Your quote was saved, but the confirmation email could not be sent. Please check
                the web server SMTP settings or contact Geely Ethiopia directly.
              </div>
            )}

            {/* What happens next — timeline */}
            <div className="mb-10">
              <p className="text-sm font-bold text-navy dark:text-ice uppercase tracking-wide mb-5 text-center">
                What happens next?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {nextSteps.map(({ icon: Icon, title, description }, idx) => (
                  <div
                    key={title}
                    className="relative rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-geely-blue text-white text-xs font-bold">
                        {idx + 1}
                      </span>
                      <Icon size={18} className="text-geely-blue dark:text-blue-bright" />
                    </div>
                    <p className="font-bold text-navy dark:text-ice text-sm mb-1">{title}</p>
                    <p className="text-xs text-steel dark:text-steel-light leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-steel dark:text-steel-light text-center mt-4 max-w-md mx-auto">
                Nothing is payable until a sales consultant confirms your final pricing.
              </p>
            </div>

            {/* What's included */}
            <div className="bg-ice dark:bg-midnight rounded-2xl p-6 mb-10">
              <p className="text-sm font-bold text-navy dark:text-ice uppercase tracking-wide mb-5 text-center">
                What&apos;s included in your quote
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {infoItems.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-xl bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line px-4 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-geely-blue/10 dark:bg-blue-bright/10">
                      <Icon size={15} className="text-geely-blue dark:text-blue-bright" />
                    </span>
                    <span className="text-sm text-steel dark:text-steel-light">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-gold text-[#2c2308] font-bold text-sm px-6 py-3.5 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Request Another Quote
              </button>
              <a
                href={quoteReference ? `/status?ref=${encodeURIComponent(quoteReference)}` : '/status'}
                className="flex items-center gap-2 border-2 border-navy dark:border-ice text-navy dark:text-ice font-bold text-sm px-6 py-3.5 rounded-lg hover:bg-ice dark:hover:bg-midnight transition-all"
              >
                <Search size={16} /> Check Your Status
              </a>
            </div>

            <div className="mt-10">
              <WhatsAppInlineCTA
                title="Prefer to talk now?"
                description="Chat with our sales team directly on WhatsApp about your quote request"
                inquiryType="quote"
                vehicleModel={vehicles.find((v) => v.id === quotedVehicleId)?.name}
              />
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
            GET YOUR PERSONALIZED QUOTE
          </div>
          <h1 className="disp text-4xl sm:text-5xl font-bold mb-4">
            Request a Quotation
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Get a detailed, personalized quote for your preferred Geely vehicle. Our team will provide you with complete pricing, financing options, and current promotions.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-12 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "Detailed Breakdown", body: "Transparent pricing with all costs clearly outlined" },
              { icon: DollarSign, title: "Best Price Guarantee", body: "Competitive pricing with current offers included" },
              { icon: CheckCircle, title: "No Obligation", body: "Free quote with no commitment required" },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line p-6 text-center hover:border-geely-blue hover:shadow-xl hover:shadow-active-blue/10 hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 bg-geely-blue/10 dark:bg-blue-bright/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="text-geely-blue dark:text-blue-bright" size={24} />
                </div>
                <h3 className="font-bold text-navy dark:text-ice mb-2">{title}</h3>
                <p className="text-xs text-steel dark:text-steel-light">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line shadow-lg overflow-hidden">
            <div className="bg-ice dark:bg-midnight p-6 border-b border-line dark:border-midnight-line">
              <h2 className="text-2xl font-bold text-navy dark:text-ice">Quote Request Form</h2>
              <p className="text-sm text-steel dark:text-steel-light mt-1">Complete the form below and we'll send you a detailed quote</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="flex items-center gap-2.5 text-lg font-bold text-navy dark:text-ice mb-4">
                  <StepBadge n={1} /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Title <span className="text-steel dark:text-steel-light font-normal">(optional)</span>
                    </label>
                    <select
                      {...register("title")}
                      className="w-full px-4 py-3 border border-line dark:bg-midnight dark:text-ice dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                    >
                      <option value="">Select title</option>
                      <option value="Ato">Ato</option>
                      <option value="Miss">Miss</option>
                      <option value="Dr">Dr</option>
                      <option value="other">Other</option>
                    </select>
                    {watchTitle === "other" && (
                      <input
                        type="text"
                        {...register("titleOther")}
                        className="w-full px-4 py-3 border border-line dark:bg-midnight dark:text-ice dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue mt-2"
                        placeholder="Enter title"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
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
                      placeholder="+251 99 338 9874"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Customer Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register("address", { required: "Address is required" })}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.address ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                      }`}
                      placeholder="Enter your city, area and street address"
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Customer TIN <span className="text-steel dark:text-steel-light font-normal">(optional, if you have one)</span>
                    </label>
                    <input
                      type="text"
                      {...register("customerTin", { validate: validateTin })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.customerTin ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                      }`}
                      placeholder="Taxpayer Identification Number"
                    />
                    {errors.customerTin && (
                      <p className="text-red-500 text-xs mt-1">{errors.customerTin.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      ID Document Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("idDocumentType", { required: "Please select a document type" })}
                      className="w-full px-4 py-3 border border-line dark:bg-midnight dark:text-ice dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                    >
                      <option value="national_id">National ID</option>
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver&apos;s License</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      ID / License Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("nationalId", {
                        required: "National ID or Driver's License number is required",
                        validate: (v) => validateIdDocumentNumber(v, watch("idDocumentType")),
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.nationalId ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                      }`}
                      placeholder="Enter your ID or license number"
                    />
                    {errors.nationalId && (
                      <p className="text-red-500 text-xs mt-1">{errors.nationalId.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      ID Document Photo <span className="text-steel dark:text-steel-light font-normal">(optional, speeds up verification)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {idPhotoUrl ? (
                        <img src={idPhotoUrl} alt="Uploaded ID document" className="w-24 h-16 object-cover rounded-lg border border-line dark:border-midnight-line" />
                      ) : (
                        <div className="w-24 h-16 rounded-lg border border-dashed border-line dark:border-midnight-line flex items-center justify-center text-[10px] text-steel dark:text-steel-light text-center px-1">
                          No photo yet
                        </div>
                      )}
                      <label className="inline-flex items-center gap-2 border-2 border-navy dark:border-ice text-navy dark:text-ice font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-ice dark:hover:bg-midnight transition-all cursor-pointer">
                        <Upload size={16} />
                        {idPhotoUploading ? "Uploading…" : idPhotoUrl ? "Replace Photo" : "Upload Photo"}
                        <input type="file" accept="image/*" onChange={handleIdPhotoChange} disabled={idPhotoUploading} className="hidden" />
                      </label>
                    </div>
                    {idPhotoError && <p className="text-red-500 text-xs mt-1">{idPhotoError}</p>}
                  </div>
                </div>
              </div>

              {/* Vehicle & Purchase Details */}
              <div>
                <h3 className="flex items-center gap-2.5 text-lg font-bold text-navy dark:text-ice mb-4">
                  <StepBadge n={2} /> Vehicle & Purchase Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Vehicle of Interest <span className="text-red-500">*</span>
                    </label>

                    {vehiclesLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse rounded-lg bg-ice dark:bg-midnight h-[110px]" />
                        ))}
                      </div>
                    ) : vehicles.length === 0 ? (
                      <p className="text-sm text-steel dark:text-steel-light">No vehicles available at the moment.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {vehicles.map((vehicle) => {
                          const img = vehicleImageUrl(vehicle);
                          const isActive = watchVehicleId === vehicle.id;
                          return (
                            <button
                              key={vehicle.id}
                              type="button"
                              onClick={() => setValue("vehicleId", vehicle.id, { shouldValidate: true })}
                              className={`relative rounded-lg overflow-hidden text-left transition-all ${
                                isActive
                                  ? "ring-2 ring-geely-blue ring-offset-2 dark:ring-offset-midnight-surface"
                                  : "ring-1 ring-black/10 dark:ring-white/10 hover:ring-black/30 dark:hover:ring-white/30"
                              }`}
                            >
                              <div className="aspect-[3/2] bg-ice dark:bg-midnight relative overflow-hidden">
                                {img ? (
                                  <img src={img} alt={vehicle.name} className="w-full h-full object-cover object-center" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-steel dark:text-steel-light text-xs">
                                    No image
                                  </div>
                                )}
                              </div>
                              <div className="px-3 py-2 bg-white dark:bg-midnight-surface">
                                <span className="font-bold text-navy dark:text-ice text-xs sm:text-sm line-clamp-1">
                                  {vehicle.name}
                                </span>
                              </div>
                              {isActive && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-geely-blue rounded-full flex items-center justify-center">
                                  <CheckCircle size={12} className="text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <input type="hidden" {...register("vehicleId", { required: "Please select a vehicle" })} />
                    {errors.vehicleId && (
                      <p className="text-red-500 text-xs mt-2">{errors.vehicleId.message}</p>
                    )}
                    {(requestedTrim || requestedColor) && (
                      <div className="mt-3 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 px-4 py-3 text-sm text-blue-900 dark:text-blue-200">
                        <p className="font-semibold">Requested configuration</p>
                        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-blue-800 dark:text-blue-300">
                          {requestedTrim && <span>Trim: {requestedTrim}</span>}
                          {requestedColor && <span>Color: {requestedColor}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      {...register("quantity", { valueAsNumber: true, min: { value: 1, message: "Minimum 1" } })}
                      className="w-full px-4 py-3 border border-line dark:bg-midnight dark:text-ice dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      How did you hear about us?
                    </label>
                    <select
                      {...register("referralSource")}
                      className="w-full px-4 py-3 border border-line dark:bg-midnight dark:text-ice dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                    >
                      <option value="">Select source</option>
                      <option value="website">Website</option>
                      <option value="social-media">Social Media</option>
                      <option value="referral">Friend / Family Referral</option>
                      <option value="advertisement">Advertisement</option>
                      <option value="event">Event / Exhibition</option>
                      <option value="showroom">Showroom Visit</option>
                      <option value="phone">Phone Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Campaign / Promotion (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("campaign")}
                      className="w-full px-4 py-3 border border-line dark:bg-midnight dark:text-ice dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="e.g. Ramadan Offer, EX5 Launch, Service Week"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      When do you plan to purchase? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("purchaseTimeframe", { required: "Please select a timeframe" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.purchaseTimeframe ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                      }`}
                    >
                      <option value="">Select timeframe</option>
                       <option value="Immediately">Immediately</option>
                      <option value="1-month">Within 1 month</option>
                      <option value="2-3-months">2-3 months</option>
                      <option value="3-6-months">3-6 months</option>
                      <option value="6-months-plus">More than 6 months</option>
                    </select>
                    {errors.purchaseTimeframe && (
                      <p className="text-red-500 text-xs mt-1">{errors.purchaseTimeframe.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Do you need financing? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("financingNeeded", { required: "Please select an option" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.financingNeeded ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                      }`}
                    >
                      <option value="yes">Yes, I need financing</option>
                      <option value="no">No, paying cash</option>
                      <option value="not-sure">Not sure yet</option>
                    </select>
                    {errors.financingNeeded && (
                      <p className="text-red-500 text-xs mt-1">{errors.financingNeeded.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Do you have a vehicle to trade in? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("tradeIn", { required: "Please select an option" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.tradeIn ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                      }`}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                    {errors.tradeIn && (
                      <p className="text-red-500 text-xs mt-1">{errors.tradeIn.message}</p>
                    )}
                  </div>

                  {watchTradeIn === "yes" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Trade-in Vehicle Details
                      </label>
                      <textarea
                        {...register("tradeInDetails")}
                        rows={3}
                        className="w-full px-4 py-3 border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg focus:outline-none focus:border-geely-blue"
                        placeholder="Please provide: Make, Model, Year, Mileage, Condition"
                      ></textarea>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      {...register("message")}
                      rows={4}
                      className="w-full px-4 py-3 border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Any specific requirements, questions, or preferred vehicle configuration?"
                    ></textarea>
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
                    I agree to be contacted by Geely Ethiopia regarding my quote request and consent to the collection of my personal information as per the{" "}
                    <a href="/privacy" className="text-geely-blue hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
                  {errors.consent && (
                    <p className="text-red-500 text-xs mt-1">{errors.consent.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                {submitError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-red-800 text-sm mb-1">Submission Error</p>
                      <p className="text-red-600 text-sm">{submitError}</p>
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-gold text-[#2c2308] font-bold text-base py-4 rounded-lg transition-all ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-opacity-90"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-navy border-t-transparent"></span>
                      Sending your quote request...
                    </span>
                  ) : (
                    "Request Quote"
                  )}
                </button>
                <p className="text-xs text-steel dark:text-steel-light text-center mt-3">
                  Your quote will be sent within 24-48 hours
                </p>
              </div>
            </div>
          </form>

          {/* Contact Alternative */}
          <div className="mt-8 text-center">
            <p className="text-sm text-steel dark:text-steel-light mb-3">Need immediate assistance?</p>
            <div className="flex gap-4 justify-center flex-wrap">
              {contactInfo.phone ? (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="inline-flex items-center gap-2 text-geely-blue font-bold hover:underline"
                >
                  {(() => {
                    // format +251XXXXXXXXX -> +251 XX XXX XXXX for display
                    const p = contactInfo.phone || '';
                    const m = p.replace(/\D/g, '').match(/^(?:251)?(\d{2})(\d{3})(\d{4})$/);
                    return m ? `Call +251 ${m[1]} ${m[2]} ${m[3]}` : `Call ${p}`;
                  })()}
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 text-steel dark:text-steel-light">Call us</span>
              )}

              {contactInfo.whatsapp ? (
                <a
                  href={contactInfo.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-geely-blue font-bold hover:underline"
                >
                  WhatsApp Us
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 text-steel dark:text-steel-light">WhatsApp</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
