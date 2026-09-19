"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { MainLayout } from "@/components/MainLayout";
import { getDealers, type Dealer } from "@/lib/api";
import { validateGenericIdOrLicense } from "@/lib/idValidation";
import {
  CheckCircle, Wrench, Clock, Shield, User, Car, CalendarClock, ArrowRight, CalendarCheck,
  Droplet, Disc, Gauge, BatteryCharging, ScanLine, Cog, Wind, Zap, SprayCan, MoreHorizontal,
  MapPin, Phone, Navigation,
} from "lucide-react";

const SERVICE_TYPE_ICONS: Record<string, typeof Wrench> = {
  "Regular Maintenance": Wrench,
  "Oil Change": Droplet,
  "Brake Service": Disc,
  "Tire Service": Gauge,
  "Battery Service": BatteryCharging,
  "Engine Diagnostics": ScanLine,
  "Transmission Service": Cog,
  "Air Conditioning Service": Wind,
  "Electrical Service": Zap,
  "Body & Paint": SprayCan,
  "Warranty Service": Shield,
  Other: MoreHorizontal,
};

interface ServiceFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  vehicleModel: string;
  vehicleYear: string;
  mileage: string;
  vin?: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  description: string;
  consent: boolean;
}

export default function ServicePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [serviceCenters, setServiceCenters] = useState<Dealer[]>([]);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [vehicleModelOptions, setVehicleModelOptions] = useState<string[]>([]);

  const scrollToBookingForm = () => {
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Fetch service centers from CMS
  useEffect(() => {
    async function fetchCenters() {
      try {
        const data = await getDealers();
        setServiceCenters(data.filter(d => d.type === "service" || d.type === "both"));
      } catch (error) {
        console.error("Failed to fetch service centers:", error);
      }
    }
    fetchCenters();
  }, []);

  // Model suggestions only — a customer's own vehicle may be an older or
  // discontinued model no longer in the live catalog, so this stays a free
  // text field rather than a hard-locked picker like the quote/test-drive
  // pages use for vehicles being sold today.
  useEffect(() => {
    async function fetchVehicleNames() {
      try {
        const res = await fetch("/api/public/vehicles");
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.vehicles || [];
        setVehicleModelOptions([...new Set(list.map((v: { name: string }) => v.name))] as string[]);
      } catch {
        /* silent — the field still works as plain free text */
      }
    }
    fetchVehicleNames();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServiceFormData>();

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/public/service-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to submit service request.');
      if (result.notificationSent === false) {
        setSubmitError('Your appointment was saved, but the confirmation email could not be sent. Please contact Geely Ethiopia directly.');
      }
      setBookingReference(result.reference || result.bookingId || null);
      setIsSubmitted(true);
      reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit service request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceTypes = [
    "Regular Maintenance",
    "Oil Change",
    "Brake Service",
    "Tire Service",
    "Battery Service",
    "Engine Diagnostics",
    "Transmission Service",
    "Air Conditioning Service",
    "Electrical Service",
    "Body & Paint",
    "Warranty Service",
    "Other",
  ];

  const timeSlots = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
  ];

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
            </div>
            <h1 className="disp text-4xl font-bold text-navy dark:text-ice mb-4">
              Service Appointment Confirmed!
            </h1>
            <p className="text-lg text-steel dark:text-steel-light mb-8 leading-relaxed">
              Thank you for scheduling your service with Geely Ethiopia. We've received your appointment request and will send you a confirmation email shortly.
            </p>
            {bookingReference && (
              <p className="mb-6 text-base text-navy dark:text-ice">
                Service Request Reference: <span className="font-bold">{bookingReference}</span>
              </p>
            )}
            {submitError && <p className="mb-6 rounded-lg border border-yellow-200 dark:border-yellow-900/40 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">{submitError}</p>}
            <div className="bg-ice dark:bg-midnight p-6 rounded-lg mb-8">
              <p className="text-sm text-steel dark:text-steel-light mb-2">
                <strong className="text-navy dark:text-ice">What to bring:</strong>
              </p>
              <ul className="text-sm text-steel dark:text-steel-light text-left space-y-2 max-w-md mx-auto">
                <li>✓ Vehicle registration documents</li>
                <li>✓ Service history (if available)</li>
                <li>✓ Warranty documents (for warranty service)</li>
                <li>✓ Valid ID</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 hover:bg-opacity-90 transition-all"
              >
                Book Another Service
              </button>
              <a
                href="/parts"
                className="border border-line dark:border-midnight-line text-navy dark:text-ice font-semibold text-sm px-8 py-4 rounded hover:bg-ice dark:hover:bg-midnight transition-all"
              >
                Order Parts
              </a>
            </div>
            {bookingReference && (
              <p className="mt-6 text-sm text-steel">
                <a href={`/status?ref=${encodeURIComponent(bookingReference)}`} className="text-geely-blue font-semibold hover:underline">
                  Check your status
                </a>
              </p>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative min-h-[460px] md:h-[520px] bg-white dark:bg-midnight-surface overflow-hidden">
        <Image
          src="/uploads/seed/models/global/images/global-kv-1.jpg"
          alt="Geely vehicle ready for service"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20 dark:from-midnight-surface dark:via-midnight-surface/85 dark:to-midnight-surface/20" />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 h-full flex flex-col justify-center py-16">
          <div className="text-[13px] tracking-[0.14em] text-geely-blue font-bold mb-3">
            PROFESSIONAL SERVICE
          </div>
          <h1 className="disp text-5xl md:text-6xl font-bold mb-4 max-w-xl text-navy dark:text-ice">
            A Legacy That Moves With You
          </h1>
          <p className="text-geely-blue text-lg font-semibold mb-4">
            Support That Moves With You
          </p>
          <p className="text-steel dark:text-steel-light text-base max-w-2xl mb-8 leading-relaxed">
            Owning a Geely is a long-term relationship built on trust, quality, and care. Our maintenance plans, genuine parts, and nationwide support keep your vehicle running the way it was built to, wherever you are in Ethiopia.
          </p>
          <button
            onClick={scrollToBookingForm}
            className="bg-geely-blue text-white font-bold text-sm px-8 py-4 hover:bg-opacity-90 transition-all w-fit"
          >
            Book Service
          </button>
        </div>
      </div>

      {/* Certified Team */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
              <Image
                src="/uploads/seed/models/ex2/images/interior/interior-horizon-gray-front.jpg"
                alt="Advanced diagnostics inside a Geely cockpit"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-[13px] tracking-[0.14em] text-geely-blue font-bold mb-3">
                100% CERTIFIED TEAM
              </div>
              <h2 className="text-3xl font-bold text-navy dark:text-ice mb-4">
                Expert Hands, Trusted Care
              </h2>
              <p className="text-steel dark:text-steel-light mb-8 leading-relaxed">
                Our technicians are certified to global Geely standards and equipped with advanced diagnostic tools, so every visit is handled with precision, from routine maintenance to warranty service.
              </p>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center shrink-0">
                    <Wrench className="text-geely-blue" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy dark:text-ice mb-1">Certified Technicians</h3>
                    <p className="text-sm text-steel dark:text-steel-light">Factory-trained experts with specialized Geely knowledge</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center shrink-0">
                    <Shield className="text-geely-blue" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy dark:text-ice mb-1">Genuine Parts</h3>
                    <p className="text-sm text-steel dark:text-steel-light">Only authentic Geely parts to maintain your warranty</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="text-geely-blue" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy dark:text-ice mb-1">Express Service</h3>
                    <p className="text-sm text-steel dark:text-steel-light">Quick turnaround for routine maintenance</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="text-geely-blue" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy dark:text-ice mb-1">Warranty Coverage</h3>
                    <p className="text-sm text-steel dark:text-steel-light">Full warranty support and documentation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Types We Offer */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-10">
            <div className="text-[13px] tracking-[0.14em] text-geely-blue font-bold mb-3">
              WHAT WE OFFER
            </div>
            <h2 className="text-3xl font-bold text-navy dark:text-ice">Service Types We Offer</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {serviceTypes.map((type) => {
              const Icon = SERVICE_TYPE_ICONS[type] || MoreHorizontal;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={scrollToBookingForm}
                  className="group flex flex-col items-center text-center gap-3 bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line p-5 hover:border-geely-blue hover:shadow-xl hover:shadow-active-blue/10 hover:-translate-y-1 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-geely-blue/10 dark:bg-blue-bright/10 flex items-center justify-center">
                    <Icon className="text-geely-blue dark:text-blue-bright" size={22} />
                  </div>
                  <span className="text-sm font-bold text-navy dark:text-ice">{type}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Find a Service Center */}
      {serviceCenters.length > 0 && (
        <section className="py-16 bg-ice dark:bg-midnight">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center mb-10">
              <div className="text-[13px] tracking-[0.14em] text-geely-blue font-bold mb-3">
                NATIONWIDE SUPPORT
              </div>
              <h2 className="text-3xl font-bold text-navy dark:text-ice">Find a Service Center</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {serviceCenters.map((center) => {
                const mapsUrl = center.coordinates?.latitude != null && center.coordinates?.longitude != null
                  ? `https://www.google.com/maps/search/?api=1&query=${center.coordinates.latitude},${center.coordinates.longitude}`
                  : undefined;
                const addressLine = [center.address?.area, center.address?.city || center.city].filter(Boolean).join(', ');
                return (
                  <div key={center.id} className="bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line p-6">
                    <h3 className="font-bold text-navy dark:text-ice text-lg mb-3">{center.name}</h3>
                    <div className="space-y-2 text-sm text-steel dark:text-steel-light">
                      {addressLine && (
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-geely-blue shrink-0 mt-0.5" />
                          <span>{addressLine}</span>
                        </div>
                      )}
                      {center.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-geely-blue shrink-0" />
                          <a href={`tel:${center.phone}`} className="hover:text-geely-blue transition-colors">{center.phone}</a>
                        </div>
                      )}
                    </div>
                    {center.services && center.services.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {center.services.slice(0, 4).map((s) => (
                          <span key={s} className="text-xs font-semibold text-geely-blue bg-geely-blue/10 dark:bg-blue-bright/10 dark:text-blue-bright px-2.5 py-1 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-geely-blue dark:text-blue-bright hover:underline mt-4"
                      >
                        <Navigation size={14} /> Get Directions
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Booking CTA */}
      <section className="relative overflow-hidden text-white py-24">
        <Image
          src="/uploads/seed/models/ex2/images/lifestyle/lifestyle-1.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative max-w-[1280px] mx-auto px-4 text-center">
          <div className="text-[13px] tracking-[0.14em] text-white/70 font-bold mb-3">
            SCHEDULE YOUR VISIT
          </div>
          <h2 className="disp text-3xl md:text-4xl font-bold mb-4">Ready to Book Your Service?</h2>
          <p className="text-[#d8e4f5] max-w-xl mx-auto mb-8 leading-relaxed">
            Tell us about your vehicle and preferred time, and our team will confirm your appointment within 24 hours.
          </p>
          <button
            onClick={scrollToBookingForm}
            className="inline-flex items-center gap-2 bg-white text-navy px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
          >
            <CalendarCheck size={20} />
            Book a Service
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Form Section */}
      <section id="booking-form" className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line shadow-xl overflow-hidden">
            {submitError && <div className="mx-6 mt-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">{submitError}</div>}
            <div className="bg-ice dark:bg-midnight p-6 border-b border-line dark:border-midnight-line">
              <h2 className="text-2xl font-bold text-navy dark:text-ice">Book Your Service</h2>
              <p className="text-sm text-steel dark:text-steel-light mt-1">Fill in the details below to schedule your service appointment</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Personal Information */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-geely-blue text-white flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <h3 className="text-lg font-bold text-navy dark:text-ice">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("firstName", { required: "First name is required" })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.firstName ? "border-red-500" : "border-line dark:border-midnight-line"
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
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.lastName ? "border-red-500" : "border-line dark:border-midnight-line"
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
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.email ? "border-red-500" : "border-line dark:border-midnight-line"
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
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.phone ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                      placeholder="+251 99 338 9874"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      National ID / Driver&apos;s License <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("nationalId", {
                        required: "National ID or Driver's License number is required",
                        validate: validateGenericIdOrLicense,
                      })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.nationalId ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                      placeholder="Enter your ID or license number"
                    />
                    {errors.nationalId && (
                      <p className="text-red-500 text-xs mt-1">{errors.nationalId.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="pt-6 border-t border-line dark:border-midnight-line">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-geely-blue text-white flex items-center justify-center shrink-0">
                    <Car size={16} />
                  </div>
                  <h3 className="text-lg font-bold text-navy dark:text-ice">Vehicle Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Vehicle Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="vehicle-model-options"
                      {...register("vehicleModel", { required: "Vehicle model is required" })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.vehicleModel ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                      placeholder="e.g., Geely Coolray"
                    />
                    <datalist id="vehicle-model-options">
                      {vehicleModelOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    {errors.vehicleModel && (
                      <p className="text-red-500 text-xs mt-1">{errors.vehicleModel.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("vehicleYear", {
                        required: "Year is required",
                        min: { value: 2015, message: "Year must be 2015 or later" },
                        max: { value: 2027, message: "Invalid year" },
                      })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.vehicleYear ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                      placeholder="2024"
                    />
                    {errors.vehicleYear && (
                      <p className="text-red-500 text-xs mt-1">{errors.vehicleYear.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Current Mileage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("mileage", { required: "Mileage is required" })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.mileage ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                      placeholder="e.g., 25000"
                    />
                    {errors.mileage && (
                      <p className="text-red-500 text-xs mt-1">{errors.mileage.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      VIN (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("vin")}
                      className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue"
                      placeholder="Vehicle Identification Number"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="pt-6 border-t border-line dark:border-midnight-line">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-geely-blue text-white flex items-center justify-center shrink-0">
                    <CalendarClock size={16} />
                  </div>
                  <h3 className="text-lg font-bold text-navy dark:text-ice">Service Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Service Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("serviceType", { required: "Please select a service type" })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.serviceType ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                    >
                      <option value="">Choose service type</option>
                      {serviceTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.serviceType && (
                      <p className="text-red-500 text-xs mt-1">{errors.serviceType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register("preferredDate", {
                        required: "Please select a date",
                        validate: (value) => {
                          const selectedDate = new Date(value);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return selectedDate >= today || "Date must be today or in the future";
                        },
                      })}
                      min={new Date().toISOString().split("T")[0]}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.preferredDate ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                    />
                    {errors.preferredDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.preferredDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Preferred Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("preferredTime", { required: "Please select a time slot" })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.preferredTime ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                    >
                      <option value="">Choose a time slot</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                    {errors.preferredTime && (
                      <p className="text-red-500 text-xs mt-1">{errors.preferredTime.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Service Center <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("location", { required: "Please select a location" })}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue ${
                        errors.location ? "border-red-500" : "border-line dark:border-midnight-line"
                      }`}
                    >
                      <option value="">Choose a service center</option>
                      {serviceCenters.map((center) => (
                        <option key={center.id} value={center.name}>
                          {center.name} - {center.city}
                        </option>
                      ))}
                    </select>
                    {errors.location && (
                      <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Description of Issue / Service Needed
                    </label>
                    <textarea
                      {...register("description")}
                      rows={4}
                      className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg bg-white dark:bg-midnight text-navy dark:text-ice transition-colors focus:outline-none focus:ring-4 focus:ring-geely-blue/10 focus:border-geely-blue"
                      placeholder="Please describe any issues or specific service requirements..."
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
                    I agree to be contacted by Geely Ethiopia regarding my service appointment and consent to the collection of my personal information as per the{" "}
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-geely-blue text-white font-bold text-base py-4 shadow-lg shadow-geely-blue/20 transition-all ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-opacity-90"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Schedule Service"}
                </button>
                <p className="text-xs text-steel dark:text-steel-light text-center mt-3">
                  We'll confirm your appointment within 24 hours
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>
    </MainLayout>
  );
}
