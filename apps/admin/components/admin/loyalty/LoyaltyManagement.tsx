"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Star, TrendingUp, Award, Search, Plus, Minus, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface LoyaltyAccount {
  id: string;
  customerId: string;
  points: number;
  tier: string;
  createdAt: string;
  customer: { id: string; fullName: string; phone: string; email: string | null };
  transactions: { points: number; reason: string; sourceType: string | null; createdAt: string }[];
}

interface Analytics {
  totalAccounts: number;
  totalPointsIssued: number;
  tierDistribution: Record<string, { count: number; totalPoints: number }>;
  recentTransactions: any[];
}

interface TierBenefits {
  [tier: string]: { label: string; description: string }[];
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: "bg-orange-100 text-orange-800",
  SILVER: "bg-gray-100 text-gray-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  VIP: "bg-purple-100 text-purple-800",
};

export default function LoyaltyManagement() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tierFilter, setTierFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; account: LoyaltyAccount | null }>({ open: false, account: null });
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [tierBenefits, setTierBenefits] = useState<TierBenefits>({});

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/loyalty/analytics");
      if (res.ok) setAnalytics(await res.json());
    } catch (e) { console.error("Failed to fetch analytics:", e); }
  }, []);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (tierFilter !== "ALL") params.set("tier", tierFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/loyalty?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
        setTotal(data.total);
      }
    } catch (e) { console.error("Failed to fetch accounts:", e); }
    setLoading(false);
  }, [page, tierFilter, search]);

  const fetchTierBenefits = useCallback(async () => {
    try {
      const res = await fetch("/api/loyalty/tier-benefits");
      if (res.ok) setTierBenefits(await res.json());
    } catch (e) { console.error("Failed to fetch tier benefits:", e); }
  }, []);

  useEffect(() => { fetchAnalytics(); fetchTierBenefits(); }, [fetchAnalytics, fetchTierBenefits]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleAdjust = async () => {
    if (!adjustModal.account || !adjustPoints || !adjustReason) return;
    setAdjusting(true);
    try {
      const res = await fetch("/api/loyalty/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: adjustModal.account.customerId,
          points: parseInt(adjustPoints),
          reason: adjustReason,
        }),
      });
      if (res.ok) {
        setAdjustModal({ open: false, account: null });
        setAdjustPoints("");
        setAdjustReason("");
        fetchAccounts();
        fetchAnalytics();
      }
    } catch (e) { console.error("Adjust failed:", e); }
    setAdjusting(false);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Analytics Tiles */}
      {analytics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalAccounts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Points Issued</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalPointsIssued.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">VIP Members</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.tierDistribution?.VIP?.count || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Points/Member</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalAccounts > 0 ? Math.round(analytics.totalPointsIssued / analytics.totalAccounts) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Benefits */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tier Benefits</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {["VIP", "GOLD", "SILVER", "BRONZE"].map((tier) => (
            <div key={tier}>
              <button
                onClick={() => setExpandedTier(expandedTier === tier ? null : tier)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[tier]}`}>{tier}</span>
                  <span className="text-sm text-gray-600">
                    {tierBenefits[tier]?.length || 0} benefits
                  </span>
                  <span className="text-sm text-gray-400">
                    ({analytics?.tierDistribution?.[tier]?.count || 0} members)
                  </span>
                </div>
                {expandedTier === tier ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedTier === tier && tierBenefits[tier] && (
                <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tierBenefits[tier].map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <div>
                        <span className="font-medium text-gray-900">{b.label}</span>
                        <span className="text-gray-500 ml-1">— {b.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Loyalty Accounts</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Tiers</option>
              <option value="VIP">VIP</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="BRONZE">Bronze</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No loyalty accounts found.</td></tr>
              ) : accounts.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{a.customer.fullName}</div>
                    <div className="text-xs text-gray-500">{a.customer.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[a.tier]}`}>{a.tier}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.points.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {a.transactions[0] ? new Date(a.transactions[0].createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setAdjustModal({ open: true, account: a })}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Adjust Points
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Points Modal */}
      {adjustModal.open && adjustModal.account && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Adjust Loyalty Points</h3>
              <p className="text-sm text-gray-500 mt-1">
                {adjustModal.account.customer.fullName} — {adjustModal.account.points.toLocaleString()} current points
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points (positive = add, negative = deduct)</label>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 500 or -200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bonus for referral, Correction"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => { setAdjustModal({ open: false, account: null }); setAdjustPoints(""); setAdjustReason(""); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjusting || !adjustPoints || !adjustReason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {adjusting ? "Saving..." : "Apply Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
