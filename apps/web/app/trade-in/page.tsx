"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/MainLayout";
import type { VehicleRecord } from "@/lib/vehicleData";
import { validateGenericIdOrLicense } from "@/lib/idValidation";
import { CheckCircle, Car, DollarSign, FileText, TrendingUp, AlertCircle } from "lucide-react";

interface TradeInFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  
  // Current Vehicle
  currentMake: string;
  currentModel: string;
  currentYear: string;
  currentMileage: string;
  currentCondition: string;
  vin?: string;
  
  // Vehicle Details
  hasAccidents: string;
  hasModifications: string;
  serviceHistory: string;
  
  // New Vehicle Interest
  interestedModel: string;
  purchaseTimeframe: string;
  financingNeeded: string;
  
  additionalInfo?: string;
  consent: boolean;
}

export default function TradeInPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  // Vehicle condition photos — same upload-then-store-URL pattern as the
  // quote form's ID-photo capture (/api/upload/image), just multi-file.
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TradeInFormData>();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/public/vehicles");
        if (!response.ok) return;
        const data = await response.json();
        if (active) setVehicles(Array.isArray(data) ? data : data?.vehicles || []);
      } catch (error) {
        console.error("Failed to load vehicles:", error);
      } finally {
        if (active) setVehiclesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "trade-in");
        const res = await fetch("/api/upload/image", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        uploaded.push(data.url);
      }
      setPhotoUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Failed to upload photo(s). Please try again.");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const removePhoto = (url: string) => setPhotoUrls((prev) => prev.filter((u) => u !== url));

  const onSubmit = async (data: TradeInFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/public/trade-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, consentGiven: data.consent, photoUrls }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit your trade-in request");
      }

      setIsSubmitted(true);
      reset();
      setPhotoUrls([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Failed to submit trade-in request:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit your trade-in request");
    } finally {
      setIsSubmitting(false);
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
            <h1 className="disp text-4xl font-bold text-navy dark:text-ice mb-4">
              Trade-In Request Submitted!
            </h1>
            <p className="text-lg text-steel dark:text-steel-light mb-8 leading-relaxed">
              Thank you for your interest in trading in your vehicle. Our team will evaluate your vehicle and send you a preliminary quote within 24-48 hours.
            </p>
            <div className="bg-ice dark:bg-midnight p-6 rounded-lg mb-8">
              <p className="text-sm text-steel dark:text-steel-light mb-2">
                <strong className="text-navy dark:text-ice">Next Steps:</strong>
              </p>
              <ul className="text-sm text-steel dark:text-steel-light text-left space-y-2 max-w-md mx-auto">
                <li>✓ We'll review your vehicle details</li>
                <li>✓ Schedule an inspection at your convenience</li>
                <li>✓ Receive your final trade-in offer</li>
                <li>✓ Apply the value toward your new Geely</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 hover:bg-opacity-90 transition-all"
              >
                Submit Another Vehicle
              </button>
              <Link
                href="/models"
                className="border border-line dark:border-midnight-line text-navy dark:text-ice font-semibold text-sm px-8 py-4 rounded hover:bg-ice dark:hover:bg-midnight transition-all"
              >
                Browse Models
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
            TRADE-IN YOUR VEHICLE
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            Get the Best Value for Your Trade-In
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Trade in your current vehicle and upgrade to a new Geely. Get a competitive offer and apply it toward your new purchase.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-12 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Competitive Offers</h3>
              <p className="text-xs text-steel dark:text-steel-light">
                Get fair market value for your vehicle
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Car className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Any Make, Any Model</h3>
              <p className="text-xs text-steel">
                We accept all brands in good condition
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Simple Process</h3>
              <p className="text-xs text-steel">
                Easy paperwork and quick approval
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Instant Credit</h3>
              <p className="text-xs text-steel">
                Apply value directly to your new Geely
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
              <h2 className="text-2xl font-bold text-navy">Trade-In Valuation Request</h2>
              <p className="text-sm text-steel mt-1">Fill in the details below to get a quote for your vehicle</p>
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
                      placeholder="+251 99 338 9874"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      National ID / Driver&apos;s License <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("nationalId", {
                        required: "National ID or Driver's License number is required",
                        validate: validateGenericIdOrLicense,
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.nationalId ? "border-red-500" : "border-line"
                      }`}
                      placeholder="Enter your ID or license number"
                    />
                    {errors.nationalId && (
                      <p className="text-red-500 text-xs mt-1">{errors.nationalId.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Vehicle Information */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-4">Your Current Vehicle</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Make <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("currentMake", { required: "Make is required" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.currentMake ? "border-red-500" : "border-line"
                      }`}
                      placeholder="e.g., Toyota, Honda, Ford"
                    />
                    {errors.currentMake && (
                      <p className="text-red-500 text-xs mt-1">{errors.currentMake.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("currentModel", { required: "Model is required" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.currentModel ? "border-red-500" : "border-line"
                      }`}
                      placeholder="e.g., Corolla, Accord"
                    />
                    {errors.currentModel && (
                      <p className="text-red-500 text-xs mt-1">{errors.currentModel.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("currentYear", {
                        required: "Year is required",
                        min: { value: 2000, message: "Year must be 2000 or later" },
                        max: { value: 2027, message: "Invalid year" },
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.currentYear ? "border-red-500" : "border-line"
                      }`}
                      placeholder="2020"
                    />
                    {errors.currentYear && (
                      <p className="text-red-500 text-xs mt-1">{errors.currentYear.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Current Mileage (km) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("currentMileage", { required: "Mileage is required" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.currentMileage ? "border-red-500" : "border-line"
                      }`}
                      placeholder="e.g., 50000"
                    />
                    {errors.currentMileage && (
                      <p className="text-red-500 text-xs mt-1">{errors.currentMileage.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Vehicle Condition <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("currentCondition", { required: "Please select condition" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.currentCondition ? "border-red-500" : "border-line"
                      }`}
                    >
                      <option value="">Select condition</option>
                      <option value="excellent">Excellent - Like new</option>
                      <option value="good">Good - Minor wear</option>
                      <option value="fair">Fair - Normal wear</option>
                      <option value="poor">Poor - Needs work</option>
                    </select>
                    {errors.currentCondition && (
                      <p className="text-red-500 text-xs mt-1">{errors.currentCondition.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      VIN (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("vin")}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Vehicle Identification Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Any Accidents? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("hasAccidents", { required: "Please select" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.hasAccidents ? "border-red-500" : "border-line"
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="no">No accidents</option>
                      <option value="minor">Minor accident (repaired)</option>
                      <option value="major">Major accident (repaired)</option>
                    </select>
                    {errors.hasAccidents && (
                      <p className="text-red-500 text-xs mt-1">{errors.hasAccidents.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Any Modifications? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("hasModifications", { required: "Please select" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.hasModifications ? "border-red-500" : "border-line"
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="no">No modifications</option>
                      <option value="minor">Minor modifications</option>
                      <option value="major">Major modifications</option>
                    </select>
                    {errors.hasModifications && (
                      <p className="text-red-500 text-xs mt-1">{errors.hasModifications.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Service History <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("serviceHistory", { required: "Please select" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.serviceHistory ? "border-red-500" : "border-line"
                      }`}
                    >
                      <option value="">Select service history</option>
                      <option value="full">Full service history (authorized dealer)</option>
                      <option value="partial">Partial service history</option>
                      <option value="none">No service history available</option>
                    </select>
                    {errors.serviceHistory && (
                      <p className="text-red-500 text-xs mt-1">{errors.serviceHistory.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Vehicle Photos (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      disabled={photoUploading}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-geely-blue text-sm"
                    />
                    <p className="text-xs text-steel mt-1">
                      Photos of the exterior, interior, and any damage help us give you a more accurate offer.
                    </p>
                    {photoUploading && <p className="text-xs text-steel mt-1">Uploading…</p>}
                    {photoError && <p className="text-red-500 text-xs mt-1">{photoError}</p>}
                    {photoUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {photoUrls.map((url) => (
                          <div key={url} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Trade-in vehicle" className="h-20 w-20 rounded-lg object-cover border border-line" />
                            <button
                              type="button"
                              onClick={() => removePhoto(url)}
                              className="absolute -top-2 -right-2 bg-white border border-line rounded-full w-5 h-5 flex items-center justify-center text-xs text-steel hover:text-red-500"
                              aria-label="Remove photo"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* New Vehicle Interest */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-4">New Vehicle Interest</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Interested Geely Model <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("interestedModel", { required: "Please select a model" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.interestedModel ? "border-red-500" : "border-line"
                      }`}
                      disabled={vehiclesLoading}
                    >
                      <option value="">{vehiclesLoading ? "Loading models..." : "Select model"}</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.name}>
                          {vehicle.name.replace(/^Geely\s+/i, "").trim() || vehicle.name}
                        </option>
                      ))}
                      <option value="undecided">Undecided</option>
                    </select>
                    {errors.interestedModel && (
                      <p className="text-red-500 text-xs mt-1">{errors.interestedModel.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Purchase Timeframe <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("purchaseTimeframe", { required: "Please select timeframe" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.purchaseTimeframe ? "border-red-500" : "border-line"
                      }`}
                    >
                      <option value="">Select timeframe</option>
                      <option value="immediate">Immediate (within 1 week)</option>
                      <option value="soon">Soon (within 1 month)</option>
                      <option value="later">Later (1-3 months)</option>
                      <option value="exploring">Just exploring options</option>
                    </select>
                    {errors.purchaseTimeframe && (
                      <p className="text-red-500 text-xs mt-1">{errors.purchaseTimeframe.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Do you need financing? <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("financingNeeded", { required: "Please select" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.financingNeeded ? "border-red-500" : "border-line"
                      }`}
                    >
                      <option value="">Select option</option>
                      <option value="yes">Yes, I need financing</option>
                      <option value="no">No, cash purchase</option>
                      <option value="maybe">Maybe, I'd like to explore options</option>
                    </select>
                    {errors.financingNeeded && (
                      <p className="text-red-500 text-xs mt-1">{errors.financingNeeded.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
                      Additional Information
                    </label>
                    <textarea
                      {...register("additionalInfo")}
                      rows={4}
                      className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Any additional details about your vehicle or trade-in..."
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
                    I agree to be contacted by Geely Ethiopia regarding my trade-in and consent to the collection of my personal information as per the{" "}
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
                  className={`w-full bg-geely-blue text-white font-bold text-base py-4 transition-all ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-opacity-90"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Get Trade-In Quote"}
                </button>
                <p className="text-xs text-steel dark:text-steel-light text-center mt-3">
                  We'll respond within 24-48 hours with your preliminary quote
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>
    </MainLayout>
  );
}
