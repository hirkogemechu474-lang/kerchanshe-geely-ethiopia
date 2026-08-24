"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/MainLayout";
import type { VehicleRecord } from "@/lib/vehicleData";
import { WhatsAppInlineCTA } from "@/components/WhatsAppWidget";
import { CheckCircle, FileText, DollarSign, AlertCircle } from "lucide-react";

const TIMEFRAME_LABELS: Record<string, string> = {
  immediate: 'Within 2 weeks',
  '1-month': 'Within 1 month',
  '2-3-months': '2-3 months',
  '3-6-months': '3-6 months',
  '6-months-plus': 'More than 6 months',
};

interface QuoteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId: string;
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
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quotedVehicleId, setQuotedVehicleId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<QuoteFormData>({
    defaultValues: {
      vehicleId: preselectedModel || "",
      financingNeeded: "not-sure",
      tradeIn: "no",
    },
  });

  const watchTradeIn = watch("tradeIn");

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

  const onSubmit = async (data: QuoteFormData) => {
    setSubmitError(null);
    try {
      const selectedVehicle = vehicles.find(v => v.id === data.vehicleId);
      
      const message = `
Requested trim: ${requestedTrim || 'Not specified'}
Requested color: ${requestedColor || 'Not specified'}
Purchase Timeframe: ${TIMEFRAME_LABELS[data.purchaseTimeframe] || data.purchaseTimeframe}
Financing Needed: ${data.financingNeeded}
Trade-In: ${data.tradeIn}
${data.tradeInDetails ? `Trade-In Details: ${data.tradeInDetails}` : ''}
${data.message ? `Additional Message: ${data.message}` : ''}
      `.trim();

      // Save the quotation and send its SMTP notification from the quotation API.
      const quotationRequest = fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: `${data.firstName} ${data.lastName}`,
          phoneNumber: data.phone,
          email: data.email,
          vehicleModel: selectedVehicle?.name || data.vehicleId,
          preferredDealer: null,
          financingInterest: data.financingNeeded === 'yes',
          tradeInInterest: data.tradeIn === 'yes',
          message,
          configuration: configuration || undefined,
          source: visitId ? 'qr-showroom' : 'website',
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
      setEmailNotificationSent(quotationResult.notificationSent ?? false);
      setQuoteId(quotationResult.quotation?.id || null);
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error('Failed to submit quote request:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit your quote request. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h1 className="disp text-4xl font-bold text-navy mb-4">
              Quote Request Received!
            </h1>
            <p className="text-lg text-steel mb-8 leading-relaxed">
              Thank you for your interest in Geely Ethiopia. Our sales team will review your requirements and send you a detailed quotation within 24-48 hours.
            </p>
            {emailNotificationSent === false && <p className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">Your quote was saved, but the confirmation email could not be sent. Please check the web server SMTP settings or contact Geely Ethiopia directly.</p>}
            {quoteId && <Link
              href={`/financing/apply?quote=${encodeURIComponent(quoteId)}${quotedVehicleId ? `&vehicle=${encodeURIComponent(quotedVehicleId)}` : ''}${visitId ? `&visitId=${encodeURIComponent(visitId)}` : ''}`}
              className="mb-8 inline-flex items-center justify-center rounded-lg bg-gold px-8 py-4 text-sm font-bold text-[#2c2308] hover:bg-opacity-90 transition-all"
            >
              Continue after quote to direct payment
            </Link>}
            <div className="bg-ice p-6 rounded-lg mb-8">
              <p className="text-sm text-steel mb-2">
                <strong className="text-navy">What's included in your quote?</strong>
              </p>
              <ul className="text-sm text-steel text-left space-y-2 max-w-md mx-auto">
                <li>✓ Complete vehicle pricing breakdown</li>
                <li>✓ Available financing options</li>
                <li>✓ Trade-in valuation (if applicable)</li>
                <li>✓ Current promotions and offers</li>
                <li>✓ Warranty and service packages</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
              >
                Request Another Quote
              </button>
              <a
                href="/financing"
                className="border border-line text-navy font-semibold text-sm px-8 py-4 rounded hover:bg-ice transition-all"
              >
                Calculate Financing
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
      <section className="py-12 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Detailed Breakdown</h3>
              <p className="text-xs text-steel">
                Transparent pricing with all costs clearly outlined
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Best Price Guarantee</h3>
              <p className="text-xs text-steel">
                Competitive pricing with current offers included
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">No Obligation</h3>
              <p className="text-xs text-steel">
                Free quote with no commitment required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-line shadow-lg overflow-hidden">
            <div className="bg-ice p-6 border-b border-line">
              <h2 className="text-2xl font-bold text-navy">Quote Request Form</h2>
              <p className="text-sm text-steel mt-1">Complete the form below and we'll send you a detailed quote</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("firstName", { required: "First name is required" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.firstName ? "border-red-500" : "border-line"
                      }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("lastName", { required: "Last name is required" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.lastName ? "border-red-500" : "border-line"
                      }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
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
                        errors.email ? "border-red-500" : "border-line"
                      }`}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
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
                        errors.phone ? "border-red-500" : "border-line"
                      }`}
                      placeholder="+251 91 234 5678"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle & Purchase Details */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-4">Vehicle & Purchase Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Vehicle of Interest <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("vehicleId", { required: "Please select a vehicle" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.vehicleId ? "border-red-500" : "border-line"
                      }`}
                      disabled={vehiclesLoading}
                    >
                      <option value="">{vehiclesLoading ? "Loading vehicles..." : "Choose a vehicle"}</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name}
                        </option>
                      ))}
                    </select>
                    {errors.vehicleId && (
                      <p className="text-red-500 text-xs mt-1">{errors.vehicleId.message}</p>
                    )}
                    {(requestedTrim || requestedColor) && (
                      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        <p className="font-semibold">Requested configuration</p>
                        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-blue-800">
                          {requestedTrim && <span>Trim: {requestedTrim}</span>}
                          {requestedColor && <span>Color: {requestedColor}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      When do you plan to purchase? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("purchaseTimeframe", { required: "Please select a timeframe" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.purchaseTimeframe ? "border-red-500" : "border-line"
                      }`}
                    >
                      <option value="">Select timeframe</option>
                      <option value="immediate">Within 2 weeks</option>
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
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Do you need financing? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("financingNeeded", { required: "Please select an option" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.financingNeeded ? "border-red-500" : "border-line"
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
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Do you have a vehicle to trade in? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("tradeIn", { required: "Please select an option" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.tradeIn ? "border-red-500" : "border-line"
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
                      <label className="block text-sm font-semibold text-navy mb-2">
                        Trade-in Vehicle Details
                      </label>
                      <textarea
                        {...register("tradeInDetails")}
                        rows={3}
                        className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-geely-blue"
                        placeholder="Please provide: Make, Model, Year, Mileage, Condition"
                      ></textarea>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      {...register("message")}
                      rows={4}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Any specific requirements, questions, or preferred vehicle configuration?"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Consent */}
              <div className="flex items-start gap-3 p-4 bg-ice rounded-lg">
                <input
                  type="checkbox"
                  {...register("consent", {
                    required: "You must agree to the terms to continue",
                  })}
                  className="mt-1 w-4 h-4 accent-geely-blue"
                />
                <div>
                  <label className="text-sm text-navy">
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
                <p className="text-xs text-steel text-center mt-3">
                  Your quote will be sent within 24-48 hours
                </p>
              </div>
            </div>
          </form>

          {/* Contact Alternative */}
          <div className="mt-8 text-center">
            <p className="text-sm text-steel mb-3">Need immediate assistance?</p>
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
                <span className="inline-flex items-center gap-2 text-steel">Call us</span>
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
                <span className="inline-flex items-center gap-2 text-steel">WhatsApp</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
