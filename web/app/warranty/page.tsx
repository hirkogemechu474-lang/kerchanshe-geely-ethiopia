"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/MainLayout";
import { CheckCircle, Shield, Clock, Wrench, FileText, Phone, Mail, MapPin } from "lucide-react";

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
          <div className="max-w-2xl mx-auto px-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h1 className="disp text-4xl font-bold text-navy mb-4">
              Warranty Claim Submitted!
            </h1>
            <p className="text-lg text-steel mb-8 leading-relaxed">
              Your warranty claim has been received. Our service team will review your case and contact you within 1-2 business days.
            </p>
            <div className="bg-ice p-6 rounded-lg mb-8">
              <p className="text-sm text-steel mb-2">
                <strong className="text-navy">What Happens Next:</strong>
              </p>
              <ul className="text-sm text-steel text-left space-y-2 max-w-md mx-auto">
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
                className="border border-line text-navy font-semibold text-sm px-8 py-4 rounded hover:bg-ice transition-all"
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
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            VEHICLE WARRANTY
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            Comprehensive Warranty Coverage
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Drive with confidence knowing your Geely is protected by our comprehensive warranty program. Quality, reliability, and peace of mind guaranteed.
          </p>
        </div>
      </div>

      {/* Warranty Benefits */}
      <section className="py-12 bg-ice">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">5-Year Coverage</h3>
              <p className="text-xs text-steel">
                Comprehensive protection for 5 years
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">150,000 km</h3>
              <p className="text-xs text-steel">
                Or 150,000 kilometers, whichever comes first
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wrench className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">Factory-Backed</h3>
              <p className="text-xs text-steel">
                Genuine parts and authorized service
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="text-geely-blue" size={24} />
              </div>
              <h3 className="font-bold text-navy mb-2">24/7 Support</h3>
              <p className="text-xs text-steel">
                Always available when you need us
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Details */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* What's Covered */}
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">What's Covered</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Powertrain Components</h3>
                    <p className="text-sm text-steel">Engine, transmission, drive axle, and all internal parts</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Electrical Systems</h3>
                    <p className="text-sm text-steel">All factory-installed electrical and electronic components</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Safety Systems</h3>
                    <p className="text-sm text-steel">Airbags, ABS, stability control, and all safety features</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Climate Control</h3>
                    <p className="text-sm text-steel">Air conditioning and heating systems</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Steering & Suspension</h3>
                    <p className="text-sm text-steel">Steering mechanism and suspension components</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Body & Paint</h3>
                    <p className="text-sm text-steel">3-year coverage against manufacturing defects and corrosion perforation</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Not Covered */}
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">What's Not Covered</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 border-2 border-red-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Normal Wear & Tear</h3>
                    <p className="text-sm text-steel">Brake pads, wiper blades, tires, filters, and bulbs</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 border-2 border-red-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Misuse & Neglect</h3>
                    <p className="text-sm text-steel">Damage from accidents, abuse, or lack of maintenance</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 border-2 border-red-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Unauthorized Modifications</h3>
                    <p className="text-sm text-steel">Aftermarket parts or modifications not approved by Geely</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 border-2 border-red-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Environmental Damage</h3>
                    <p className="text-sm text-steel">Damage from natural disasters, fire, or vandalism</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 border-2 border-red-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Commercial Use</h3>
                    <p className="text-sm text-steel">Vehicles used for taxi, rental, or commercial purposes</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 border-2 border-red-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">Cosmetic Issues</h3>
                    <p className="text-sm text-steel">Minor scratches, dents, or stone chips not affecting function</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warranty Plans */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">Warranty Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Warranty */}
            <div className="bg-white rounded-lg overflow-hidden border border-line hover:shadow-lg transition-all">
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Basic Warranty</h3>
                <div className="text-3xl font-bold">5 Years</div>
                <div className="text-sm opacity-90">or 150,000 km</div>
              </div>
              <div className="p-6">
                <p className="text-sm text-steel mb-4">Included with every new Geely vehicle</p>
                <ul className="space-y-2 text-sm text-steel">
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Full powertrain coverage</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>All electrical systems</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Safety systems</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>24/7 roadside assistance</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Nationwide dealer network</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Extended Warranty */}
            <div className="bg-white rounded-lg overflow-hidden border-2 border-geely-blue hover:shadow-xl transition-all relative">
              <div className="absolute top-0 right-0 bg-gold text-navy text-xs font-bold px-3 py-1 rounded-bl">
                POPULAR
              </div>
              <div className="bg-gradient-to-r from-geely-blue to-blue-600 text-white p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Extended Warranty</h3>
                <div className="text-3xl font-bold">7 Years</div>
                <div className="text-sm opacity-90">or 200,000 km</div>
              </div>
              <div className="p-6">
                <p className="text-sm text-steel mb-4">Extra peace of mind for longer</p>
                <ul className="space-y-2 text-sm text-steel">
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>+2 years extended coverage</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Transferable to new owner</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Priority service scheduling</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Higher resale value</span>
                  </li>
                </ul>
                <button className="w-full mt-6 bg-geely-blue text-white font-bold py-3 rounded hover:bg-opacity-90 transition-all">
                  Learn More
                </button>
              </div>
            </div>

            {/* Premium Warranty */}
            <div className="bg-white rounded-lg overflow-hidden border border-line hover:shadow-lg transition-all">
              <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Premium Warranty</h3>
                <div className="text-3xl font-bold">10 Years</div>
                <div className="text-sm opacity-90">or 300,000 km</div>
              </div>
              <div className="p-6">
                <p className="text-sm text-steel mb-4">Ultimate protection package</p>
                <ul className="space-y-2 text-sm text-steel">
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Everything in Extended</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>10-year coverage</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Wear & tear items covered</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>Courtesy vehicle included</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                    <span>VIP service treatment</span>
                  </li>
                </ul>
                <button className="w-full mt-6 border-2 border-geely-blue text-geely-blue font-bold py-3 rounded hover:bg-geely-blue hover:text-white transition-all">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="bg-gradient-to-r from-geely-blue to-blue-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Need to File a Warranty Claim?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              If you're experiencing issues with your Geely vehicle covered under warranty, submit a claim online or contact our service team.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => {
                  setShowClaimForm(true);
                  setTimeout(() => {
                    document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="bg-white text-geely-blue font-bold text-base px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all"
              >
                File a Claim Online
              </button>
              <a
                href="tel:+251911234567"
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
          <div className="max-w-4xl mx-auto px-10">
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

                {/* Vehicle Information */}
                <div>
                  <h3 className="text-lg font-bold text-navy mb-4">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2">
                        VIN (Vehicle Identification Number) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("vin", { required: "VIN is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.vin ? "border-red-500" : "border-line"
                        }`}
                        placeholder="17-character VIN"
                      />
                      {errors.vin && (
                        <p className="text-red-500 text-xs mt-1">{errors.vin.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("model", { required: "Model is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.model ? "border-red-500" : "border-line"
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
                      <label className="block text-sm font-semibold text-navy mb-2">
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
                          errors.year ? "border-red-500" : "border-line"
                        }`}
                        placeholder="2024"
                      />
                      {errors.year && (
                        <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2">
                        Purchase Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...register("purchaseDate", { required: "Purchase date is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.purchaseDate ? "border-red-500" : "border-line"
                        }`}
                      />
                      {errors.purchaseDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.purchaseDate.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-navy mb-2">
                        Current Mileage (km) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register("currentMileage", { required: "Mileage is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.currentMileage ? "border-red-500" : "border-line"
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
                  <h3 className="text-lg font-bold text-navy mb-4">Claim Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy mb-2">
                        Issue Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("issueCategory", { required: "Category is required" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.issueCategory ? "border-red-500" : "border-line"
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
                      <label className="block text-sm font-semibold text-navy mb-2">
                        Detailed Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register("issueDescription", { required: "Description is required" })}
                        rows={5}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.issueDescription ? "border-red-500" : "border-line"
                        }`}
                        placeholder="Describe the issue in detail: when it started, symptoms, any warning lights, etc."
                      ></textarea>
                      {errors.issueDescription && (
                        <p className="text-red-500 text-xs mt-1">{errors.issueDescription.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-navy mb-2">
                          When did this first occur? <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          {...register("firstOccurrence", { required: "Date is required" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.firstOccurrence ? "border-red-500" : "border-line"
                          }`}
                        />
                        {errors.firstOccurrence && (
                          <p className="text-red-500 text-xs mt-1">{errors.firstOccurrence.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-navy mb-2">
                          Have you visited a dealer? <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("dealerVisited", { required: "Please select" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.dealerVisited ? "border-red-500" : "border-line"
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
                        <label className="block text-sm font-semibold text-navy mb-2">
                          Proof of Purchase Available? <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("hasProofOfPurchase", { required: "Please select" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.hasProofOfPurchase ? "border-red-500" : "border-line"
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
                        <label className="block text-sm font-semibold text-navy mb-2">
                          Service Records Available? <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("hasServiceRecords", { required: "Please select" })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                            errors.hasServiceRecords ? "border-red-500" : "border-line"
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
                      <label className="block text-sm font-semibold text-navy mb-2">
                        Preferred Contact Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("preferredContactMethod", { required: "Please select" })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-geely-blue ${
                          errors.preferredContactMethod ? "border-red-500" : "border-line"
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
                  <p className="text-xs text-steel text-center mt-3">
                    Our service team will review your claim within 1-2 business days
                  </p>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">Questions About Your Warranty?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy mb-2">Call Us</h3>
              <p className="text-sm text-steel mb-2">Speak with our warranty team</p>
              <a href="tel:+251911234567" className="text-geely-blue font-semibold hover:underline">
                +251 91 123 4567
              </a>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy mb-2">Email Us</h3>
              <p className="text-sm text-steel mb-2">Get detailed answers</p>
              <a href="mailto:warranty@geelyethiopia.com" className="text-geely-blue font-semibold hover:underline">
                warranty@geelyethiopia.com
              </a>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy mb-2">Visit Us</h3>
              <p className="text-sm text-steel mb-2">Find your nearest dealer</p>
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
