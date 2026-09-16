"use client";

import { useState, useEffect } from "react";
import { Star, Award, TrendingUp, Gift, ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LoyaltyData {
  exists: boolean;
  points: number;
  tier: string;
  benefits: { label: string; description: string }[];
  transactions: { points: number; reason: string; sourceType: string | null; createdAt: string }[];
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: "from-orange-400 to-orange-600",
  SILVER: "from-gray-400 to-gray-600",
  GOLD: "from-yellow-400 to-yellow-600",
  VIP: "from-purple-500 to-purple-700",
};

const TIER_BG: Record<string, string> = {
  BRONZE: "bg-orange-50 border-orange-200",
  SILVER: "bg-gray-50 border-gray-200",
  GOLD: "bg-yellow-50 border-yellow-200",
  VIP: "bg-purple-50 border-purple-200",
};

export default function LoyaltyPortal() {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [lookupMode, setLookupMode] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    // Try to fetch from session first
    fetchLoyalty();
  }, []);

  const fetchLoyalty = async () => {
    setLoading(true);
    try {
      // Try to get from session-based endpoint
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        if (user?.phone) {
          const loyaltyRes = await fetch(`/api/public/loyalty/${encodeURIComponent(user.phone)}`);
          if (loyaltyRes.ok) {
            setLoyalty(await loyaltyRes.json());
            setLoading(false);
            return;
          }
        }
      }
      // If not logged in or no phone, show lookup mode
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
      const res = await fetch(`/api/public/loyalty/${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setLoyalty(data);
        setLookupMode(false);
      } else {
        setLookupError("No loyalty account found for this phone number.");
      }
    } catch {
      setLookupError("Failed to look up loyalty account.");
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
            <h1 className="text-3xl font-bold">Loyalty Program</h1>
            <p className="mt-1 text-blue-100">Check your loyalty points and tier status</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <form onSubmit={handleLookup} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-geely-blue" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Find Your Loyalty Account</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your phone number to check your points and tier</p>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-navy to-geely-blue text-white py-10">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/account" className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Account
          </Link>
          <h1 className="text-3xl font-bold">Loyalty Program</h1>
          <p className="mt-1 text-blue-100">Your rewards for being part of the Geely family</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Points & Tier Card */}
        <div className={`rounded-2xl bg-gradient-to-r ${TIER_COLORS[loyalty?.tier || 'BRONZE']} p-8 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-100 text-sm font-medium">Your Tier</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                <Award className="w-8 h-8" />
                {loyalty?.tier || "BRONZE"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm font-medium">Total Points</p>
              <p className="text-4xl font-bold">{(loyalty?.points || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Tier Progress</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{
                  width: `${Math.min(100, ((loyalty?.points || 0) / 7000) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-100 mt-1">
              <span>0</span>
              <span>VIP at 7,000 pts</span>
            </div>
          </div>
        </div>

        {/* Current Benefits */}
        {loyalty?.benefits && loyalty.benefits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-geely-blue" /> Your Benefits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loyalty.benefits.map((b, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${TIER_BG[loyalty?.tier || 'BRONZE']}`}>
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.label}</p>
                    <p className="text-xs text-gray-500">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Points History</h2>
          </div>
          {!loyalty?.transactions || loyalty.transactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No points activity yet.</p>
              <p className="text-xs text-gray-400 mt-1">Points are earned when you purchase a vehicle or service your car.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {loyalty.transactions.map((t, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.reason}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString("en-ET", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {t.sourceType && <span className="ml-2 text-gray-400">({t.sourceType})</span>}
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ml-4 ${t.points > 0 ? "text-green-600" : "text-red-500"}`}>
                    {t.points > 0 ? "+" : ""}{t.points.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
