"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/MainLayout";
import {
  CheckCircle, Phone, Clock, MapPin, Wrench, Fuel,
  Battery, Key, AlertTriangle, Truck, Shield, Zap, Search, Copy, Check,
} from "lucide-react";

interface RoadsideRequestData {
  // Contact Information
  firstName: string;
  lastName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;

  // Location
  currentLocation: string;
  landmark?: string;
  city: string;

  // Vehicle Information
  vehicleModel: string;
  plateNumber: string;
  color: string;

  // Issue Details
  issueType: string;
  issueDescription: string;
  isVehicleSafe: string;
  passengersCount: string;

  // Membership
  hasMembership: string;
  membershipNumber?: string;

  consent: boolean;
}

const EMERGENCY_PHONE = "+251 99 338 9874";

export default function RoadsidePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const [vehicleModelOptions, setVehicleModelOptions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RoadsideRequestData>();

  const hasMembership = watch("hasMembership");

  const scrollToRequestForm = () => {
    document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Model suggestions only — same reasoning as the /service page: a
  // customer's own vehicle may be an older model no longer in the live
  // catalog, so this stays free text rather than a hard picker.
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

  const onSubmit = async (data: RoadsideRequestData) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/public/roadside-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to submit your request.");
      if (result.notificationSent === false) {
        setSubmitError("Your request was saved, but our team could not be notified automatically — please also call the emergency hotline below.");
      }
      setReference(result.reference || null);
      setIsSubmitted(true);
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit your request. Please call the emergency hotline below.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReference = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference).then(() => {
      setReferenceCopied(true);
      setTimeout(() => setReferenceCopied(false), 2000);
    });
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
            </div>
            <h1 className="disp text-4xl font-bold text-navy dark:text-ice mb-4">
              Help is on the Way!
            </h1>
            <p className="text-lg text-steel dark:text-steel-light mb-6 leading-relaxed">
              Your roadside assistance request has been received. Our team will arrive at your location within 30-45 minutes.
            </p>

            {reference && (
              <div className="mb-6 inline-flex items-center gap-3 rounded-xl bg-ice dark:bg-midnight border border-line dark:border-midnight-line pl-5 pr-2 py-2.5">
                <span className="text-xs uppercase tracking-wide text-steel dark:text-steel-light">Reference</span>
                <strong className="font-mono text-sm sm:text-base text-navy dark:text-ice">{reference}</strong>
                <button
                  onClick={copyReference}
                  aria-label="Copy reference number"
                  className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-midnight-surface hover:bg-opacity-80 transition-colors px-3 py-1.5 text-xs font-bold text-navy dark:text-ice"
                >
                  {referenceCopied ? <Check size={14} /> : <Copy size={14} />}
                  {referenceCopied ? "Copied" : "Copy"}
                </button>
              </div>
            )}

            {submitError && (
              <p className="mb-6 rounded-lg border border-yellow-200 dark:border-yellow-900/40 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
                {submitError}
              </p>
            )}

            <div className="bg-ice dark:bg-midnight p-6 rounded-lg mb-8">
              <p className="text-sm text-steel dark:text-steel-light mb-3">
                <strong className="text-navy dark:text-ice">What to Do While You Wait:</strong>
              </p>
              <ul className="text-sm text-steel dark:text-steel-light text-left space-y-2 max-w-md mx-auto">
                <li>✓ Keep your phone charged and accessible</li>
                <li>✓ Stay in a safe location</li>
                <li>✓ Have your vehicle documents ready</li>
                <li>✓ Our team will call you shortly</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-8">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Emergency?</strong> Call us immediately: <a href={`tel:${EMERGENCY_PHONE}`} className="font-bold underline">{EMERGENCY_PHONE}</a>
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setReference(null);
                }}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 hover:bg-opacity-90 transition-all"
              >
                New Request
              </button>
              {reference && (
                <a
                  href={`/status?ref=${encodeURIComponent(reference)}`}
                  className="flex items-center gap-2 border-2 border-navy dark:border-ice text-navy dark:text-ice font-bold text-sm px-8 py-4 rounded-lg hover:bg-ice dark:hover:bg-midnight transition-all"
                >
                  <Search size={16} /> Check Status
                </a>
              )}
              <Link
                href="/"
                className="border border-line dark:border-midnight-line text-navy dark:text-ice font-semibold text-sm px-8 py-4 rounded hover:bg-ice dark:hover:bg-midnight transition-all"
              >
                Back to Home
              </Link>
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
            24/7 ROADSIDE ASSISTANCE
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            We're Here When You Need Us
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Round-the-clock emergency support for all Geely vehicles. From flat tires to towing, we've got you covered anywhere in Ethiopia.
          </p>
        </div>
      </div>

      {/* Emergency Contact Bar */}
      <div className="bg-red-600 text-white py-4">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} />
              <span className="font-bold text-lg">Need Immediate Help?</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href={`tel:${EMERGENCY_PHONE}`}
                className="flex items-center gap-2 bg-white dark:bg-midnight-surface text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all"
              >
                <Phone size={20} />
                {EMERGENCY_PHONE}
              </a>
              <span className="text-sm opacity-90">Available 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-navy dark:text-ice text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: "Towing Service", body: "Free towing to nearest authorized dealer (up to 100km)" },
              { icon: Battery, title: "Battery Jump-Start", body: "Quick battery boost to get you back on the road" },
              { icon: Wrench, title: "Flat Tire Change", body: "Professional tire change with your spare" },
              { icon: Fuel, title: "Fuel Delivery", body: "Emergency fuel delivery to your location" },
              { icon: Key, title: "Lockout Service", body: "Help when you're locked out of your vehicle" },
              { icon: Zap, title: "Minor Repairs", body: "On-site minor mechanical repairs" },
              { icon: MapPin, title: "GPS Location", body: "Real-time tracking of assistance team" },
              { icon: Shield, title: "Accident Support", body: "Coordination with insurance and police" },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line p-6 text-center hover:border-geely-blue hover:shadow-xl hover:shadow-active-blue/10 hover:-translate-y-1 transition-all"
              >
                <div className="w-16 h-16 bg-geely-blue/10 dark:bg-blue-bright/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-geely-blue dark:text-blue-bright" size={28} />
                </div>
                <h3 className="font-bold text-navy dark:text-ice mb-2">{title}</h3>
                <p className="text-sm text-steel dark:text-steel-light">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-navy dark:text-ice text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: "Call or Request Online", body: "Contact us via phone or submit a request form" },
              { title: "Share Your Location", body: "Tell us where you are and what the problem is" },
              { title: "We Dispatch Help", body: "Nearest technician is sent to your location" },
              { title: "Get Back on Road", body: "We resolve your issue quickly and safely" },
            ].map(({ title, body }, idx) => (
              <div key={title} className="text-center">
                <div className="w-16 h-16 bg-geely-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-navy dark:text-ice mb-2">{title}</h3>
                <p className="text-sm text-steel dark:text-steel-light">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy dark:text-ice mb-6">Nationwide Coverage</h2>
              <p className="text-steel dark:text-steel-light mb-6">
                Our roadside assistance network covers all major cities and highways throughout Ethiopia. No matter where you are, help is just a call away.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy dark:text-ice mb-1">Major Cities</h3>
                    <p className="text-sm text-steel dark:text-steel-light">Addis Ababa, Dire Dawa, Mekelle, Hawassa, Bahir Dar, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy dark:text-ice mb-1">Highway Coverage</h3>
                    <p className="text-sm text-steel dark:text-steel-light">All major routes including Addis-Adama, Addis-Jimma, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy dark:text-ice mb-1">Response Time</h3>
                    <p className="text-sm text-steel dark:text-steel-light">Average 30-45 minutes in urban areas, 60-90 minutes elsewhere</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-midnight-surface p-8 rounded-2xl border border-line dark:border-midnight-line shadow-lg">
              <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">Service Statistics</h3>
              <div className="space-y-6">
                {[
                  { label: "Average Response Time", value: "35 min", pct: 85 },
                  { label: "Customer Satisfaction", value: "98%", pct: 98 },
                  { label: "Issues Resolved On-Site", value: "87%", pct: 87 },
                ].map(({ label, value, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-navy dark:text-ice">{label}</span>
                      <span className="text-sm font-bold text-geely-blue dark:text-blue-bright">{value}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-midnight rounded-full h-2">
                      <div className="bg-geely-blue dark:bg-blue-bright h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-gradient-to-r from-geely-blue to-blue-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Need Assistance Right Now?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Don't wait! Get help immediately by calling our 24/7 hotline or submit a request online.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href={`tel:${EMERGENCY_PHONE}`}
                className="bg-white dark:bg-midnight-surface text-geely-blue font-bold text-base px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all inline-flex items-center gap-2"
              >
                <Phone size={20} />
                Call Now: {EMERGENCY_PHONE}
              </a>
              <button
                onClick={scrollToRequestForm}
                className="border-2 border-white text-white font-bold text-base px-8 py-4 hover:bg-white hover:text-geely-blue transition-all"
              >
                Submit Request Online
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section id="request-form" className="py-16 bg-ice dark:bg-midnight">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
            {submitError && <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">{submitError}</div>}
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line shadow-xl overflow-hidden">
              <div className="bg-red-600 text-white p-6 border-b border-line dark:border-midnight-line">
                <h2 className="text-2xl font-bold">Request Roadside Assistance</h2>
                <p className="text-sm opacity-90 mt-1">Fill out this form and help will be on the way</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="flex items-center gap-2.5 text-lg font-bold text-navy dark:text-ice mb-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-geely-blue text-white text-xs font-bold">1</span>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Alternate Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        {...register("alternatePhone")}
                        className="w-full px-4 py-3 border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg focus:outline-none focus:border-geely-blue"
                        placeholder="+251 91 234 5679"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Email <span className="text-steel dark:text-steel-light font-normal">(optional, to receive a confirmation)</span>
                      </label>
                      <input
                        type="email"
                        {...register("email", {
                          pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" },
                        })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.email ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="flex items-center gap-2.5 text-lg font-bold text-navy dark:text-ice mb-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-geely-blue text-white text-xs font-bold">2</span>
                    Your Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Current Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("currentLocation", { required: "Location is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.currentLocation ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="e.g., Bole Road near Total Gas Station"
                      />
                      {errors.currentLocation && (
                        <p className="text-red-500 text-xs mt-1">{errors.currentLocation.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Nearest Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        {...register("landmark")}
                        className="w-full px-4 py-3 border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg focus:outline-none focus:border-geely-blue"
                        placeholder="e.g., Ethiopian Airlines Building"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("city", { required: "City is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.city ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                      >
                        <option value="">Select city</option>
                        <option value="addis-ababa">Addis Ababa</option>
                        <option value="dire-dawa">Dire Dawa</option>
                        <option value="mekelle">Mekelle</option>
                        <option value="hawassa">Hawassa</option>
                        <option value="bahir-dar">Bahir Dar</option>
                        <option value="adama">Adama</option>
                        <option value="jimma">Jimma</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className="flex items-center gap-2.5 text-lg font-bold text-navy dark:text-ice mb-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-geely-blue text-white text-xs font-bold">3</span>
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        list="roadside-vehicle-model-options"
                        {...register("vehicleModel", { required: "Model is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.vehicleModel ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="e.g., Geely Coolray"
                      />
                      <datalist id="roadside-vehicle-model-options">
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
                        Plate Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("plateNumber", { required: "Plate number is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.plateNumber ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="e.g., 3-12345"
                      />
                      {errors.plateNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.plateNumber.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Color <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("color", { required: "Color is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.color ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="e.g., White"
                      />
                      {errors.color && (
                        <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Issue Details */}
                <div>
                  <h3 className="flex items-center gap-2.5 text-lg font-bold text-navy dark:text-ice mb-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-geely-blue text-white text-xs font-bold">4</span>
                    What's the Problem?
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Issue Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("issueType", { required: "Issue type is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.issueType ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                      >
                        <option value="">Select issue type</option>
                        <option value="flat-tire">Flat Tire</option>
                        <option value="dead-battery">Dead Battery</option>
                        <option value="out-of-fuel">Out of Fuel</option>
                        <option value="engine-problem">Engine Problem</option>
                        <option value="locked-out">Locked Out</option>
                        <option value="accident">Accident</option>
                        <option value="overheating">Overheating</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.issueType && (
                        <p className="text-red-500 text-xs mt-1">{errors.issueType.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Detailed Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register("issueDescription", { required: "Description is required" })}
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.issueDescription ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                        placeholder="Please describe the situation in detail..."
                      ></textarea>
                      {errors.issueDescription && (
                        <p className="text-red-500 text-xs mt-1">{errors.issueDescription.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                          Is the vehicle in a safe location? <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("isVehicleSafe", { required: "Please select" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.isVehicleSafe ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                          }`}
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes, safely parked</option>
                          <option value="no">No, in traffic/dangerous spot</option>
                        </select>
                        {errors.isVehicleSafe && (
                          <p className="text-red-500 text-xs mt-1">{errors.isVehicleSafe.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                          Number of Passengers <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("passengersCount", { required: "Please select" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.passengersCount ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                          }`}
                        >
                          <option value="">Select</option>
                          <option value="0">Just me</option>
                          <option value="1">2 people</option>
                          <option value="2">3 people</option>
                          <option value="3">4 people</option>
                          <option value="4+">5 or more</option>
                        </select>
                        {errors.passengersCount && (
                          <p className="text-red-500 text-xs mt-1">{errors.passengersCount.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Membership */}
                <div>
                  <h3 className="flex items-center gap-2.5 text-lg font-bold text-navy dark:text-ice mb-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-geely-blue text-white text-xs font-bold">5</span>
                    Membership Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                        Do you have a roadside assistance membership? <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("hasMembership", { required: "Please select" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.hasMembership ? "border-red-500" : "border-line dark:bg-midnight dark:text-ice dark:border-midnight-line"
                        }`}
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      {errors.hasMembership && (
                        <p className="text-red-500 text-xs mt-1">{errors.hasMembership.message}</p>
                      )}
                    </div>

                    {hasMembership === "yes" && (
                      <div>
                        <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                          Membership Number
                        </label>
                        <input
                          type="text"
                          {...register("membershipNumber")}
                          className="w-full px-4 py-3 border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg focus:outline-none focus:border-geely-blue"
                          placeholder="Enter membership number"
                        />
                      </div>
                    )}
                  </div>
                  {hasMembership === "no" && (
                    <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-lg p-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Note:</strong> Service fees will apply. Standard rates: Towing (500 ETB), Jump-start (200 ETB), Tire change (150 ETB).
                      </p>
                    </div>
                  )}
                </div>

                {/* Consent */}
                <div className="flex items-start gap-3 p-4 bg-ice dark:bg-midnight rounded-lg">
                  <input
                    type="checkbox"
                    {...register("consent", {
                      required: "You must agree to continue",
                    })}
                    className="mt-1 w-4 h-4 accent-geely-blue"
                  />
                  <div>
                    <label className="text-sm text-navy dark:text-ice">
                      <span className="text-red-500">* </span>
                      I authorize Geely Ethiopia to dispatch roadside assistance to my location and agree to pay applicable service fees if not covered by membership.
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
                    className={`w-full bg-red-600 text-white font-bold text-base py-4 rounded-lg transition-all ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-red-700"
                    }`}
                  >
                    {isSubmitting ? "Dispatching Help..." : "Request Assistance Now"}
                  </button>
                  <p className="text-xs text-steel dark:text-steel-light text-center mt-3">
                    Help will arrive within 30-45 minutes (urban areas)
                  </p>
                </div>
              </div>
            </form>
          </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-navy dark:text-ice text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-ice dark:bg-midnight p-6 rounded-lg">
              <h3 className="font-bold text-navy dark:text-ice mb-2">Is roadside assistance available 24/7?</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                Yes! Our service is available 24 hours a day, 7 days a week, including holidays.
              </p>
            </div>
            <div className="bg-ice dark:bg-midnight p-6 rounded-lg">
              <h3 className="font-bold text-navy dark:text-ice mb-2">How much does it cost?</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                Free for warranty vehicles and members. Non-members pay standard fees based on service type.
              </p>
            </div>
            <div className="bg-ice dark:bg-midnight p-6 rounded-lg">
              <h3 className="font-bold text-navy dark:text-ice mb-2">How long until help arrives?</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                Average 30-45 minutes in urban areas, 60-90 minutes in rural areas depending on location.
              </p>
            </div>
            <div className="bg-ice dark:bg-midnight p-6 rounded-lg">
              <h3 className="font-bold text-navy dark:text-ice mb-2">Do you service all vehicle brands?</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                We primarily service Geely vehicles, but can provide basic assistance to other brands.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
