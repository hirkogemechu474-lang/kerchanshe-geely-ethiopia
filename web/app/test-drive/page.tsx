"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/MainLayout";
import type { VehicleRecord } from "@/lib/vehicleData";
import { useCRMSubmit } from "@/lib/useCRMSubmit";
import { WhatsAppInlineCTA } from "@/components/WhatsAppWidget";
import { Calendar, Clock, MapPin, CheckCircle, Car, AlertCircle } from "lucide-react";

interface TestDriveFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  message: string;
  consent: boolean;
}

export default function TestDrivePage() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get("visitId") || "";
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactPhone, setContactPhone] = useState("+251 11 000 0000");
  const { submitLead, loading, error, success } = useCRMSubmit();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TestDriveFormData>();

  // Showroom QR walk-in flow: a visitor arriving here already registered
  // their name/phone/email against a ShowroomVisit row — prefill the form
  // from it instead of asking again.
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
          setVehicles(Array.isArray(data) ? data : data?.vehicles || []);
        }
      } catch (error) {
        console.error("Failed to load vehicles:", error);
      } finally {
        if (active) {
          setVehiclesLoading(false);
        }
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
    void fetchContact();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: TestDriveFormData) => {
    try {
      const selectedVehicle = vehicles.find(v => v.id === data.vehicleId);
      
      await submitLead({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        leadType: 'test-drive',
        modelInterest: selectedVehicle?.name || data.vehicleId,
        vehicleId: data.vehicleId,
        preferredDealer: data.location,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        message: data.message,
        consentGiven: data.consent
      });

      if (visitId) {
        void fetch(`/api/visit/${encodeURIComponent(visitId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedAction: "test-drive" }),
        });
      }

      setIsSubmitted(true);
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error('Failed to submit test drive request:', err);
      // Error is handled by the hook
    }
  };

  const locations = [
    "Sarbet Showroom, Addis Ababa",
    "Bole Showroom, Addis Ababa",
    "Piassa Service Center, Addis Ababa",
    "Bahir Dar Showroom",
    "Hawassa Showroom",
    "Mekelle Showroom",
  ];

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
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h1 className="disp text-4xl font-bold text-navy mb-4">
              Test Drive Booked Successfully!
            </h1>
            <p className="text-lg text-steel mb-8 leading-relaxed">
              Thank you for booking a test drive with Geely Ethiopia. Our team will contact you within 24 hours to confirm your appointment and provide additional details.
            </p>
            <div className="bg-ice p-6 rounded-lg mb-8">
              <p className="text-sm text-steel mb-2">
                <strong className="text-navy">What happens next?</strong>
              </p>
              <ul className="text-sm text-steel text-left space-y-2 max-w-md mx-auto">
                <li>✓ You'll receive a confirmation email</li>
                <li>✓ Our team will call to confirm your preferred date and time</li>
                <li>✓ We'll prepare your selected vehicle for the test drive</li>
                <li>✓ Bring your valid driver's license on the day</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
              >
                Book Another Test Drive
              </button>
              <Link
                href="/models"
                className="border border-line text-navy font-semibold text-sm px-8 py-4 rounded hover:bg-ice transition-all"
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
      {/* Page Header */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            EXPERIENCE GEELY
          </div>
          <h1 className="disp text-4xl sm:text-5xl font-bold mb-4">
            Book a Test Drive
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Experience the quality, comfort, and performance of Geely vehicles firsthand. Book your test drive today and discover why Geely is trusted worldwide.
          </p>
        </div>
      </div>

      {/* Why Test Drive Section */}
      <section className="py-12 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Car className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Feel the Performance</h3>
              <p className="text-xs text-steel">
                Experience the power and handling on real roads
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Convenient Locations</h3>
              <p className="text-xs text-steel">
                Choose from 6 showrooms across Ethiopia
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Flexible Scheduling</h3>
              <p className="text-xs text-steel">
                Pick a date and time that works for you
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">No Obligation</h3>
              <p className="text-xs text-steel">
                Free test drive with no purchase required
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
              <h2 className="text-2xl font-bold text-navy">Complete Your Booking</h2>
              <p className="text-sm text-steel mt-1">Fill in the details below to schedule your test drive</p>
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

              {/* Test Drive Details */}
              <div>
                <h3 className="text-lg font-bold text-navy mb-4">Test Drive Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Select Vehicle <span className="text-red-500">*</span>
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
                      Showroom Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("location", { required: "Please select a location" })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                        errors.location ? "border-red-500" : "border-line"
                      }`}
                    >
                      <option value="">Choose a showroom</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    {errors.location && (
                      <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-navy mb-2">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      {...register("message")}
                      rows={4}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-geely-blue"
                      placeholder="Any specific requirements or questions?"
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
                    I agree to be contacted by Geely Ethiopia regarding my test drive booking and consent to the collection of my personal information as per the{" "}
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
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-red-800 text-sm mb-1">Submission Error</p>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-geely-blue text-white font-bold text-base py-4 rounded-lg transition-all ${
                    loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-opacity-90"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Submitting...
                    </span>
                  ) : (
                    "Book Test Drive"
                  )}
                </button>
                <p className="text-xs text-steel text-center mt-3">
                  By submitting this form, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </form>

          {/* Contact Alternative */}
          <div className="mt-8">
            <WhatsAppInlineCTA
              title="Prefer to chat? We're on WhatsApp!"
              description="Book your test drive instantly via WhatsApp - our team responds within minutes"
              inquiryType="test-drive"
            />
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-steel mb-3">
              Or call us directly
            </p>
            <a
              href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center gap-2 text-geely-blue font-bold hover:underline"
            >
              {contactPhone}
            </a>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
