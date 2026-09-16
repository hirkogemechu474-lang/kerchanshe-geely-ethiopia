"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import imageLoader from "@/lib/imageLoader";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/MainLayout";
import { CheckCircle } from "lucide-react";

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

export default function WarrantyClaimPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                onClick={() => setIsSubmitted(false)}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 hover:bg-opacity-90 transition-all"
              >
                Submit Another Claim
              </button>
              <a
                href="/service"
                className="border border-line dark:border-midnight-line text-navy dark:text-ice font-semibold text-sm px-8 py-4 rounded hover:bg-ice dark:hover:bg-midnight transition-all"
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
      <div className="relative min-h-[340px] md:h-[380px] bg-white overflow-hidden">
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
            WARRANTY CLAIM
          </div>
          <h1 className="disp text-5xl font-bold mb-4 max-w-xl text-navy dark:text-ice">
            File a Warranty Claim
          </h1>
          <p className="text-steel dark:text-steel-light text-base max-w-2xl">
            Complete the form below and our service team will review your case within 1-2 business days.{" "}
            <Link href="/warranty#coverage" className="text-geely-blue font-semibold hover:underline">
              View coverage details
            </Link>
          </p>
        </div>
      </div>

      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line shadow-lg overflow-hidden">
            <div className="bg-navy text-white p-6 border-b border-line dark:border-midnight-line">
              <h2 className="text-2xl font-bold">Claim Details</h2>
              <p className="text-sm text-[#d8e4f5] mt-1">Complete the form below and our service team will contact you</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Owner Information */}
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">Owner Information</h3>
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
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
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
                    <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">
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
                    I confirm that all information provided is accurate and agree to Geely Ethiopia&apos;s{" "}
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
                  className={`w-full bg-geely-blue text-white font-bold text-base py-4 transition-all ${
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
    </MainLayout>
  );
}
