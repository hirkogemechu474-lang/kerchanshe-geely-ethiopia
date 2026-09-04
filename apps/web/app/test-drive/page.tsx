"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/MainLayout";
import type { VehicleRecord } from "@/services/vehicleService";
import { WhatsAppInlineCTA } from "@/components/WhatsAppWidget";
import { withBasePath } from "@/lib/publicPath";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

interface TestDriveFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  vehicleId: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  consentPrivacy: boolean;
  consentEmail: boolean;
  consentPhone: boolean;
}

function vehicleImageUrl(vehicle: VehicleRecord): string | null {
  const raw =
    vehicle.heroImageUrl ||
    (Array.isArray(vehicle.images) && typeof vehicle.images[0] === "string"
      ? vehicle.images[0]
      : null);
  if (!raw) return null;
  return withBasePath(raw);
}

export default function TestDrivePage() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get("visitId") || "";
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [locations, setLocations] = useState<string[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactPhone, setContactPhone] = useState("+251 11 000 0000");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<TestDriveFormData>({
    defaultValues: { vehicleId: "" },
  });

  const selectedVehicleId = watch("vehicleId");

  useEffect(() => {
    if (!visitId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/visit/${encodeURIComponent(visitId)}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !active) return;
        const [firstName, ...lastNameParts] = String(
          data.fullName || ""
        ).split(" ");
        reset((current) => ({
          ...current,
          firstName: firstName || current.firstName,
          lastName: lastNameParts.join(" ") || current.lastName,
          phone: data.phone || current.phone,
          email: data.email || current.email,
        }));
      } catch {
        /* silent */
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
          setVehicles(Array.isArray(data) ? data : data?.vehicles || []);
        }
      } catch (err) {
        console.error("Failed to load vehicles:", err);
      } finally {
        if (active) setVehiclesLoading(false);
      }
    }

    async function fetchLocations() {
      try {
        const response = await fetch("/api/public/dealers");
        if (!response.ok) return;
        const data = await response.json();
        const dealers = Array.isArray(data) ? data : data?.data || [];
        const withTestDrives = dealers.filter(
          (d: any) => d?.facilities?.testDriveArea
        );
        const rawNames = (withTestDrives.length > 0 ? withTestDrives : dealers).map(
          (d: any) => `${d.name}, ${d.city}` as string
        );
        const names = [...new Set<string>(rawNames)];
        if (active) setLocations(names);
      } catch (err) {
        console.error("Failed to load showroom locations:", err);
      } finally {
        if (active) setLocationsLoading(false);
      }
    }

    async function fetchContact() {
      try {
        const response = await fetch("/api/public/contact-information");
        if (!response.ok) return;
        const data = await response.json();
        if (active && data?.phone?.primary) {
          setContactPhone(data.phone.primary);
        }
      } catch {
        /* keep default phone */
      }
    }

    void fetchVehicles();
    void fetchLocations();
    void fetchContact();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: TestDriveFormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/public/test-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          nationalId: data.nationalId,
          vehicleId: data.vehicleId,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          location: data.location,
          message: null,
          consentGiven: data.consentPrivacy,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.error || "Failed to submit. Please try again.");
        return;
      }

      if (visitId) {
        void fetch(`/api/visit/${encodeURIComponent(visitId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedAction: "test-drive",
            testDriveId: result.testDriveId,
          }),
        });
      }

      setIsSubmitted(true);
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Failed to submit test drive request:", err);
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = [
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
          <div className="max-w-xl mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-100">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-steel mb-8 leading-relaxed">
              Thank you for booking a test drive with Geely Ethiopia. Our team
              will contact you within 24 hours to confirm your appointment.
            </p>
            <div className="bg-ice p-6 rounded-lg mb-8 text-left max-w-md mx-auto">
              <p className="font-bold text-navy text-sm mb-3">
                What happens next?
              </p>
              <ul className="text-sm text-steel space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                  You will receive a confirmation email
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                  Our team will call to confirm your preferred date and time
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                  We will prepare your selected vehicle for the test drive
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                  Bring your valid driver&apos;s license on the day
                </li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-navy text-white font-bold text-sm px-8 py-3 rounded-sm hover:bg-ink transition-colors"
              >
                Book Another Test Drive
              </button>
              <Link
                href="/models"
                className="border border-line text-navy font-semibold text-sm px-8 py-3 rounded-sm hover:bg-ice transition-colors"
              >
                Explore Models
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Heading */}
      <div className="pt-[120px] md:pt-[152px] pb-10 md:pb-[60px] px-4">
        <div className="max-w-[960px] mx-auto text-center">
          <h1 className="text-4xl sm:text-[56px] md:text-[64px] font-bold text-navy leading-none mb-6">
            Book a Test Drive
          </h1>
          <p className="text-steel text-base max-w-2xl mx-auto">
            Experience the quality, comfort, and performance of Geely vehicles
            firsthand. Select your preferred model and schedule your test drive
            today.
          </p>
        </div>
      </div>

      {/* Form */}
      <section className="pb-16 md:pb-[120px] px-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-[960px] mx-auto"
        >
          {/* Section 1: Choose Model */}
          <div className="mb-10 md:mb-[60px]">
            <h2 className="text-lg md:text-xl font-bold text-navy mb-6">
              Choose Model
            </h2>

            {vehiclesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg bg-ice h-[180px]"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vehicles.map((vehicle) => {
                  const img = vehicleImageUrl(vehicle);
                  const isActive = selectedVehicleId === vehicle.id;
                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() =>
                        setValue("vehicleId", vehicle.id, {
                          shouldValidate: true,
                        })
                      }
                      className={`relative rounded-lg overflow-hidden text-left transition-all ${
                        isActive
                          ? "ring-2 ring-navy ring-offset-2"
                          : "ring-1 ring-black/10 hover:ring-black/30"
                      }`}
                    >
                      <div className="aspect-[2/1] bg-ice relative overflow-hidden">
                        {img ? (
                          <img
                            src={img}
                            alt={vehicle.name}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-steel text-sm">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 bg-white">
                        <span className="font-bold text-navy text-sm">
                          {vehicle.name}
                        </span>
                      </div>
                      {isActive && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-navy rounded-full flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {!vehiclesLoading && vehicles.length === 0 && (
              <p className="text-steel text-sm">
                No vehicles available at the moment.
              </p>
            )}
            {errors.vehicleId && (
              <p className="text-red-500 text-xs mt-2">
                {errors.vehicleId.message}
              </p>
            )}
            <input
              type="hidden"
              {...register("vehicleId", {
                required: "Please select a vehicle",
              })}
            />
          </div>

          {/* Section 2: Find Location */}
          <div className="mb-10 md:mb-[60px]">
            <h2 className="text-lg md:text-xl font-bold text-navy mb-6">
              Find Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Showroom Location <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("location", {
                    required: "Please select a location",
                  })}
                  className={`w-full px-4 py-3.5 border rounded text-sm focus:outline-none focus:border-navy transition-colors appearance-none bg-white ${
                    errors.location
                      ? "border-red-500"
                      : "border-[#bdbfbf]"
                  }`}
                  disabled={locationsLoading}
                >
                  <option value="">
                    {locationsLoading
                      ? "Loading showrooms..."
                      : "Select a showroom"}
                  </option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                {errors.location && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.location.message}
                  </p>
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
                      return (
                        selectedDate >= today ||
                        "Date must be today or in the future"
                      );
                    },
                  })}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full px-4 py-3.5 border rounded text-sm focus:outline-none focus:border-navy transition-colors ${
                    errors.preferredDate
                      ? "border-red-500"
                      : "border-[#bdbfbf]"
                  }`}
                />
                {errors.preferredDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.preferredDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Preferred Time <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("preferredTime", {
                    required: "Please select a time slot",
                  })}
                  className={`w-full px-4 py-3.5 border rounded text-sm focus:outline-none focus:border-navy transition-colors appearance-none bg-white ${
                    errors.preferredTime
                      ? "border-red-500"
                      : "border-[#bdbfbf]"
                  }`}
                >
                  <option value="">Select a time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.preferredTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.preferredTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 mt-4 text-xs text-steel">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                The date and time are references. Our support team will reach
                out to you to finalize your booking.
              </span>
            </div>
          </div>

          {/* Section 3: Contact Information */}
          <div className="mb-10 md:mb-[60px]">
            <h2 className="text-lg md:text-xl font-bold text-navy mb-6">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                  className={`w-full px-4 py-3.5 border rounded text-sm focus:outline-none focus:border-navy transition-colors ${
                    errors.firstName
                      ? "border-red-500"
                      : "border-[#bdbfbf]"
                  }`}
                  placeholder="First Name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                  className={`w-full px-4 py-3.5 border rounded text-sm focus:outline-none focus:border-navy transition-colors ${
                    errors.lastName
                      ? "border-red-500"
                      : "border-[#bdbfbf]"
                  }`}
                  placeholder="Last Name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: "Invalid phone number",
                    },
                  })}
                  className={`w-full px-4 py-3.5 border rounded text-sm focus:outline-none focus:border-navy transition-colors ${
                    errors.phone
                      ? "border-red-500"
                      : "border-[#bdbfbf]"
                  }`}
                  placeholder="+251 99 338 9874"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
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
                  className={`w-full px-4 py-3.5 border rounded text-sm focus:outline-none focus:border-navy transition-colors ${
                    errors.email
                      ? "border-red-500"
                      : "border-[#bdbfbf]"
                  }`}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-navy mb-2">
                  National ID / Driver&apos;s License <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("nationalId", {
                    required: "National ID or Driver's License number is required",
                  })}
                  className={`w-full px-4 py-3.5 border rounded text-sm focus:outline-none focus:border-navy transition-colors ${
                    errors.nationalId
                      ? "border-red-500"
                      : "border-[#bdbfbf]"
                  }`}
                  placeholder="Enter your ID or license number"
                />
                {errors.nationalId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.nationalId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="mt-6 space-y-3">
              <label className="flex items-start gap-3 text-sm text-navy cursor-pointer">
                <input
                  type="checkbox"
                  {...register("consentPrivacy", {
                    required:
                      "You must agree to the privacy policy to continue",
                  })}
                  className="mt-0.5 w-4 h-4 rounded border-[#bdbfbf] accent-navy shrink-0"
                />
                <span>
                  I acknowledge and agree to the Geely Ethiopia{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-geely-blue hover:underline"
                  >
                    Privacy Policy
                  </a>
                  . By submitting this contact form, I acknowledge that my
                  personal data will be processed in accordance with the
                  Privacy Policy.{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.consentPrivacy && (
                <p className="text-red-500 text-xs ml-7">
                  {errors.consentPrivacy.message}
                </p>
              )}

              <label className="flex items-start gap-3 text-sm text-navy cursor-pointer">
                <input
                  type="checkbox"
                  {...register("consentEmail")}
                  className="mt-0.5 w-4 h-4 rounded border-[#bdbfbf] accent-navy shrink-0"
                />
                <span>
                  Yes, I agree to receive information and offers about
                  products and services from Geely Ethiopia via email. I can
                  withdraw this consent at any time.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-navy cursor-pointer">
                <input
                  type="checkbox"
                  {...register("consentPhone")}
                  className="mt-0.5 w-4 h-4 rounded border-[#bdbfbf] accent-navy shrink-0"
                />
                <span>
                  I agree to be contacted with more information and offers
                  about Geely products and services through phone call. This
                  consent can be withdrawn at any time.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 max-w-md mx-auto">
                <AlertCircle
                  className="text-red-500 shrink-0 mt-0.5"
                  size={20}
                />
                <div>
                  <p className="font-semibold text-red-800 text-sm mb-1">
                    Submission Error
                  </p>
                  <p className="text-red-600 text-sm">{submitError}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`bg-navy text-white font-bold text-base px-12 py-3.5 rounded-sm transition-colors ${
                submitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-ink"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Submitting...
                </span>
              ) : (
                "Book a Test Drive"
              )}
            </button>
          </div>
        </form>

        {/* WhatsApp Alternative */}
        <div className="max-w-[960px] mx-auto mt-10">
          <WhatsAppInlineCTA
            title="Prefer to chat? We're on WhatsApp!"
            description="Book your test drive instantly via WhatsApp - our team responds within minutes"
            inquiryType="test-drive"
          />
        </div>

        <div className="max-w-[960px] mx-auto mt-6 text-center">
          <p className="text-sm text-steel mb-2">Or call us directly</p>
          <a
            href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-2 text-geely-blue font-bold hover:underline"
          >
            {contactPhone}
          </a>
        </div>
      </section>

      {/* Why Wait CTA Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/90" />
        <div className="relative flex flex-col md:flex-row items-stretch">
          <div className="flex-1 flex flex-col justify-center px-8 py-16 md:py-24 md:px-[7.5%] text-left">
            <h2
              className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent"
            >
              WHY WAIT?
            </h2>
            <p className="text-white text-lg md:text-xl font-bold mb-8 max-w-md">
              Experience the future of driving with Geely. Book your test drive
              today and discover innovation, comfort, and performance.
            </p>
            <div>
              <Link
                href="/test-drive"
                className="inline-block bg-white text-navy font-bold text-sm px-8 py-3.5 rounded-sm hover:bg-gray-100 transition-colors"
              >
                Book a Test Drive
              </Link>
            </div>
          </div>
          <div className="hidden md:block md:flex-[0_0_40%] relative min-h-[300px]">
            <img
              src="/images/vehicles/coolray-studio.png"
              alt="Geely vehicle"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
