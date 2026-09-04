"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import imageLoader from "@/lib/imageLoader";
import { MainLayout } from "@/components/MainLayout";
import { getDealers, type Dealer } from "@/lib/api";
import { CheckCircle, Wrench, Clock, Shield } from "lucide-react";

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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={40} />
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
            {submitError && <p className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">{submitError}</p>}
            <div className="bg-ice dark:bg-midnight p-6 rounded-lg mb-8">
              <p className="text-sm text-steel dark:text-steel-light mb-2">
                <strong className="text-navy">What to bring:</strong>
              </p>
              <ul className="text-sm text-steel text-left space-y-2 max-w-md mx-auto">
                <li>✓ Vehicle registration documents</li>
                <li>✓ Service history (if available)</li>
                <li>✓ Warranty documents (for warranty service)</li>
                <li>✓ Valid ID</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
              >
                Book Another Service
              </button>
              <a
                href="/parts"
                className="border border-line dark:border-midnight-line text-navy font-semibold text-sm px-8 py-4 rounded hover:bg-ice transition-all"
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
      <div className="relative min-h-[420px] md:h-[480px] bg-white overflow-hidden">
        <Image
          src="/images/vehicles/atlas-real.jpg"
          alt="Geely vehicle ready for service"
          loader={imageLoader}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-white/10 dark:from-midnight-surface dark:via-midnight-surface/75 dark:to-midnight-surface/10" />
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
            Owning a Geely is a long-term relationship built on trust, quality, and care. Our maintenance plans, genuine parts, and nationwide support keep your vehicle running the way it was built to &mdash; wherever you are in Ethiopia.
          </p>
          <button
            onClick={() => document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-geely-blue text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all w-fit"
          >
            Book Service
          </button>
        </div>
      </div>

      {/* Certified Team */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-lg overflow-hidden shadow-lg aspect-[4/3] bg-black">
              <Image
                src="/images/vehicles/coolray-studio.png"
                alt="Geely vehicle at a certified service center"
                loader={imageLoader}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain"
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
                Our technicians are certified to global Geely standards and equipped with advanced diagnostic tools, so every visit is handled with precision &mdash; from routine maintenance to warranty service.
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

      {/* Form Section */}
      <section id="booking-form" className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-line shadow-lg overflow-hidden">
            {submitError && <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}
            <div className="bg-ice p-6 border-b border-line">
              <h2 className="text-2xl font-bold text-navy">Book Your Service</h2>
              <p className="text-sm text-steel mt-1">Fill in the details below to schedule your service appointment</p>
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

              {/* Vehicle Information */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Vehicle Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("vehicleModel", { required: "Vehicle model is required" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.vehicleModel ? "border-red-500" : "border-line"
                      }`}
                      placeholder="e.g., Geely Coolray"
                    />
                    {errors.vehicleModel && (
                      <p className="text-red-500 text-xs mt-1">{errors.vehicleModel.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("vehicleYear", {
                        required: "Year is required",
                        min: { value: 2015, message: "Year must be 2015 or later" },
                        max: { value: 2027, message: "Invalid year" },
                      })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.vehicleYear ? "border-red-500" : "border-line"
                      }`}
                      placeholder="2024"
                    />
                    {errors.vehicleYear && (
                      <p className="text-red-500 text-xs mt-1">{errors.vehicleYear.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Current Mileage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("mileage", { required: "Mileage is required" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.mileage ? "border-red-500" : "border-line"
                      }`}
                      placeholder="e.g., 25000"
                    />
                    {errors.mileage && (
                      <p className="text-red-500 text-xs mt-1">{errors.mileage.message}</p>
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
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-4">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Service Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("serviceType", { required: "Please select a service type" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.serviceType ? "border-red-500" : "border-line"
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
                    <label className="block text-sm font-semibold text-navy mb-2">
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
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.preferredDate ? "border-red-500" : "border-line"
                      }`}
                    />
                    {errors.preferredDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.preferredDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Preferred Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("preferredTime", { required: "Please select a time slot" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.preferredTime ? "border-red-500" : "border-line"
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
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Service Center <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("location", { required: "Please select a location" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.location ? "border-red-500" : "border-line"
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
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Description of Issue / Service Needed
                    </label>
                    <textarea
                      {...register("description")}
                      rows={4}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Please describe any issues or specific service requirements..."
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
                  className={`w-full bg-geely-blue text-white font-bold text-base py-4 rounded-lg transition-all ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-opacity-90"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Schedule Service"}
                </button>
                <p className="text-xs text-steel text-center mt-3">
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
