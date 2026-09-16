"use client";

import { useState, useEffect } from "react";
import { Wrench, Calendar, Clock, MapPin, Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ServiceBooking {
  id: string;
  reference: string | null;
  serviceType: string;
  vehicleInfo: string;
  date: string;
  timeSlot: string | null;
  status: string;
  technician: string | null;
  location: string | null;
  createdAt: string;
  jobCard: { id: string; jobCardNo: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function ServiceHistoryPage() {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [lookupMode, setLookupMode] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        if (user?.phone) {
          const historyRes = await fetch(`/api/public/service-history/${encodeURIComponent(user.phone)}`);
          if (historyRes.ok) {
            const data = await historyRes.json();
            setBookings(data.bookings || []);
            setLoading(false);
            return;
          }
        }
      }
      setLookupMode(true);
    } catch {
      setLookupMode(true);
    }
    setLoading(false);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setLookupError("");
    try {
      const res = await fetch(`/api/public/service-history/${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setLookupMode(false);
      } else {
        setLookupError("No service history found for this phone number.");
      }
    } catch {
      setLookupError("Failed to look up service history.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-geely-blue" />
      </div>
    );
  }

  if (lookupMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-navy to-geely-blue text-white py-10">
          <div className="max-w-3xl mx-auto px-4">
            <Link href="/account" className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Account
            </Link>
            <h1 className="text-3xl font-bold">Service History</h1>
            <p className="mt-1 text-blue-100">View your past and upcoming service appointments</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <form onSubmit={handleLookup} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-geely-blue" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Find Your Service History</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your phone number to view your service appointments</p>
            {lookupError && <p className="text-sm text-red-600 mb-4">{lookupError}</p>}
            <div className="flex gap-3 max-w-sm mx-auto">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 99 338 9874"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-geely-blue"
              />
              <button
                type="submit"
                className="bg-geely-blue text-white font-bold px-6 py-3 hover:bg-opacity-90"
              >
                Look Up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-navy to-geely-blue text-white py-10">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/account" className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Account
          </Link>
          <h1 className="text-3xl font-bold">Service History</h1>
          <p className="mt-1 text-blue-100">Your past and upcoming service appointments</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">No Service History</h2>
            <p className="text-sm text-gray-500 mb-6">You haven't booked any services yet.</p>
            <Link
              href="/service"
              className="inline-flex items-center gap-2 bg-geely-blue text-white font-bold px-6 py-3 hover:bg-opacity-90"
            >
              <Wrench className="w-4 h-4" /> Book a Service
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{b.serviceType}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-800"}`}>
                        {b.status.replace("_", " ")}
                      </span>
                    </div>
                    {b.reference && (
                      <p className="text-xs text-gray-500">Ref: {b.reference}</p>
                    )}
                  </div>
                  {b.jobCard && (
                    <span className="text-xs text-gray-400">Job: {b.jobCard.jobCardNo}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(b.date).toLocaleDateString("en-ET", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  {b.timeSlot && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {b.timeSlot}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    {b.vehicleInfo}
                  </div>
                  {b.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {b.location}
                    </div>
                  )}
                </div>

                {b.technician && (
                  <p className="text-xs text-gray-500 mt-3">Technician: {b.technician}</p>
                )}

                {b.reference && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Link
                      href={`/status?ref=${encodeURIComponent(b.reference)}`}
                      className="text-sm text-geely-blue hover:underline font-medium inline-flex items-center gap-1"
                    >
                      Check Status <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
