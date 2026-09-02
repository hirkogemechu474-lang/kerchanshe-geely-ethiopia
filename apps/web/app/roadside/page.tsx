"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { MainLayout } from "@/components/MainLayout";
import { 
  CheckCircle, Phone, Clock, MapPin, Wrench, Fuel, 
  Battery, Key, AlertTriangle, Truck, Shield, Zap 
} from "lucide-react";

interface RoadsideRequestData {
  // Contact Information
  firstName: string;
  lastName: string;
  phone: string;
  alternatePhone?: string;
  
  // Location
  currentLocation: string;
  landmark?: string;
  city: string;
  
  // Vehicle Information
  model: string;
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

export default function RoadsidePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RoadsideRequestData>();

  const hasMembership = watch("hasMembership");

  const onSubmit = async (data: RoadsideRequestData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    console.log("Roadside Assistance Request:", data);
    setIsSubmitted(true);
    setIsSubmitting(false);
    setShowRequestForm(false);
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
              Help is on the Way!
            </h1>
            <p className="text-lg text-steel dark:text-steel-light mb-8 leading-relaxed">
              Your roadside assistance request has been received. Our team will arrive at your location within 30-45 minutes.
            </p>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-red-800">
                <strong>Emergency?</strong> Call us immediately: <a href="tel:+251911234567" className="font-bold underline">+251 91 123 4567</a>
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setShowRequestForm(true);
                }}
                className="bg-geely-blue text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
              >
                New Request
              </button>
              <Link
                href="/"
                className="border border-line dark:border-midnight-line text-navy dark:text-ice font-semibold text-sm px-8 py-4 rounded hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight transition-all"
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
                href="tel:+251911234567" 
                className="flex items-center gap-2 bg-white dark:bg-midnight-surface text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all"
              >
                <Phone size={20} />
                +251 91 123 4567
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
            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Towing Service</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                Free towing to nearest authorized dealer (up to 100km)
              </p>
            </div>

            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Battery className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Battery Jump-Start</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                Quick battery boost to get you back on the road
              </p>
            </div>

            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Flat Tire Change</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                Professional tire change with your spare
              </p>
            </div>

            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fuel className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Fuel Delivery</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                Emergency fuel delivery to your location
              </p>
            </div>

            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Lockout Service</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                Help when you're locked out of your vehicle
              </p>
            </div>

            <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy dark:text-ice mb-2">Minor Repairs</h3>
              <p className="text-sm text-steel dark:text-steel-light">
                On-site minor mechanical repairs
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy mb-2">GPS Location</h3>
              <p className="text-sm text-steel">
                Real-time tracking of assistance team
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-geely-blue" size={28} />
              </div>
              <h3 className="font-bold text-navy mb-2">Accident Support</h3>
              <p className="text-sm text-steel">
                Coordination with insurance and police
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="font-bold text-navy mb-2">Call or Request Online</h3>
              <p className="text-sm text-steel">
                Contact us via phone or submit a request form
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="font-bold text-navy mb-2">Share Your Location</h3>
              <p className="text-sm text-steel">
                Tell us where you are and what the problem is
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="font-bold text-navy mb-2">We Dispatch Help</h3>
              <p className="text-sm text-steel">
                Nearest technician is sent to your location
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-geely-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="font-bold text-navy mb-2">Get Back on Road</h3>
              <p className="text-sm text-steel">
                We resolve your issue quickly and safely
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-6">Nationwide Coverage</h2>
              <p className="text-steel mb-6">
                Our roadside assistance network covers all major cities and highways throughout Ethiopia. No matter where you are, help is just a call away.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Major Cities</h3>
                    <p className="text-sm text-steel">Addis Ababa, Dire Dawa, Mekelle, Hawassa, Bahir Dar, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Highway Coverage</h3>
                    <p className="text-sm text-steel">All major routes including Addis-Adama, Addis-Jimma, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-navy mb-1">Response Time</h3>
                    <p className="text-sm text-steel">Average 30-45 minutes in urban areas, 60-90 minutes elsewhere</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-navy mb-4">Service Statistics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-navy">Average Response Time</span>
                    <span className="text-sm font-bold text-geely-blue">35 min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-geely-blue h-2 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-navy">Customer Satisfaction</span>
                    <span className="text-sm font-bold text-geely-blue">98%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-geely-blue h-2 rounded-full" style={{ width: "98%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-navy">Issues Resolved On-Site</span>
                    <span className="text-sm font-bold text-geely-blue">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-geely-blue h-2 rounded-full" style={{ width: "87%" }}></div>
                  </div>
                </div>
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
                href="tel:+251911234567"
                className="bg-white dark:bg-midnight-surface text-geely-blue font-bold text-base px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all inline-flex items-center gap-2"
              >
                <Phone size={20} />
                Call Now: +251 91 123 4567
              </a>
              <button
                onClick={() => {
                  setShowRequestForm(true);
                  setTimeout(() => {
                    document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="border-2 border-white text-white font-bold text-base px-8 py-4 rounded-lg hover:bg-white dark:hover:bg-midnight-surface dark:hover:bg-midnight-surface dark:hover:bg-midnight-surface hover:text-geely-blue transition-all"
              >
                Submit Request Online
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form */}
      {showRequestForm && (
        <section id="request-form" className="py-16 bg-ice dark:bg-midnight">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line shadow-lg overflow-hidden">
              <div className="bg-red-600 text-white p-6 border-b border-line dark:border-midnight-line">
                <h2 className="text-2xl font-bold">Request Roadside Assistance</h2>
                <p className="text-sm opacity-90 mt-1">Fill out this form and help will be on the way</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">Contact Information</h3>
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
                        className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                        placeholder="+251 91 234 5679"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">Your Location</h3>
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
                        className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
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
                  <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">What's the Problem?</h3>
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
                  <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">Membership Information</h3>
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
                          className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
                          placeholder="Enter membership number"
                        />
                      </div>
                    )}
                  </div>
                  {hasMembership === "no" && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
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
      )}

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
