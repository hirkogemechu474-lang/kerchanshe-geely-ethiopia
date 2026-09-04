'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FinancingSettingsEditor } from '@/components/admin/financing/FinancingSettingsEditor';
import {
  Wallet,
  Banknote,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Eye,
  EyeOff,
  LayoutDashboard,
  X,
  AlertCircle,
  Settings,
} from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  branchAddress: string | null;
  shortDescription: string | null;
  isActive: boolean;
  displayOrder: number;
  _count: {
    financingPrograms: number;
  };
}

type ProgramStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface FinancingProgram {
  id: string;
  name: string;
  bankId: string;
  bank?: { name: string };
  interestRate: number;
  downPayment: number;
  minDp: number;
  maxDp: number;
  tenureMonths: number;
  minTM: number;
  maxTM: number;
  processingFee: number;
  procFeeMin: number;
  procFeeMax: number;
  insurance: number;
  appliesToAllVehicles: boolean;
  vehicleId: string | null;
  vehicle?: { name: string };
  vehicleCategoryId: string | null;
  vehicleCategory?: { name: string };
  applyEnabled: boolean;
  applyUrl: string | null;
  applyLabel: string | null;
  directPayEnabled: boolean;
  directPayUrl: string | null;
  directPayLabel: string | null;
  visitShowroomEnabled: boolean;
  visitShowroomUrl: string | null;
  visitShowroomLabel: string | null;
  scheduleEnabled: boolean;
  scheduleUrl: string | null;
  badgeText: string | null;
  highlightBadge: boolean;
  finePrint: string | null;
  eligibilityNote: string | null;
  displayOrder: number;
  status: ProgramStatus;
}

interface VehicleOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

type BankForm = Omit<Bank, '_count'> & {};
type ProgramForm = Omit<FinancingProgram, 'bank' | 'vehicle' | 'vehicleCategory'> & {};

// ─── Field-name mapping between UI (short names) and API/schema (canonical names) ───
// The Prisma schema & API routes use canonical names (e.g. downPaymentPercent,
// minDownPaymentPercent, processingFeePercent). The UI form uses short names
// (e.g. downPayment, minDp, processingFee). These mappers bridge the two.
const fromApi = (p: any): ProgramForm => ({
  ...p,
  downPayment: p.downPaymentPercent,
  minDp: p.minDownPaymentPercent,
  maxDp: p.maxDownPaymentPercent,
  minTM: p.minTenureMonths,
  maxTM: p.maxTenureMonths,
  processingFee: p.processingFeePercent,
  procFeeMin: p.processingFeeMin,
  procFeeMax: p.processingFeeMax,
  insurance: p.insurancePercent,
});

const toApi = (p: any) => ({
  ...p,
  downPaymentPercent: p.downPayment,
  minDownPaymentPercent: p.minDp,
  maxDownPaymentPercent: p.maxDp,
  minTenureMonths: p.minTM,
  maxTenureMonths: p.maxTM,
  processingFeePercent: p.processingFee,
  processingFeeMin: p.procFeeMin,
  processingFeeMax: p.procFeeMax,
  insurancePercent: p.insurance,
});

const emptyBank = (): BankForm => ({
  id: '',
  name: '',
  slug: '',
  logoUrl: '',
  websiteUrl: '',
  phoneNumber: '',
  email: '',
  branchAddress: '',
  shortDescription: '',
  isActive: true,
  displayOrder: 0,
});

const emptyProgram = (): ProgramForm => ({
  id: '',
  name: '',
  bankId: '',
  interestRate: 12.5,
  downPayment: 20,
  minDp: 10,
  maxDp: 80,
  tenureMonths: 60,
  minTM: 12,
  maxTM: 84,
  processingFee: 2.5,
  procFeeMin: 5000,
  procFeeMax: 30000,
  insurance: 5,
  appliesToAllVehicles: true,
  vehicleId: null,
  vehicleCategoryId: null,
  applyEnabled: true,
  applyUrl: '',
  applyLabel: 'Apply Now',
  directPayEnabled: false,
  directPayUrl: '',
  directPayLabel: 'Pay Online',
  visitShowroomEnabled: true,
  visitShowroomUrl: '',
  visitShowroomLabel: 'Visit Showroom',
  scheduleEnabled: true,
  scheduleUrl: '',
  badgeText: '',
  highlightBadge: false,
  finePrint: '',
  eligibilityNote: '',
  displayOrder: 0,
  status: 'DRAFT',
});

export default function FinancingManagementPage() {
  const [activeTab, setActiveTab] = useState<'banks' | 'programs' | 'settings'>(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t === 'settings' || t === 'programs' || t === 'banks') return t;
    }
    return 'banks';
  });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [programs, setPrograms] = useState<FinancingProgram[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankForm | null>(null);
  const [bankErrors, setBankErrors] = useState<Record<string, string>>({});

  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramForm | null>(null);
  const [programErrors, setProgramErrors] = useState<Record<string, string>>({});

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  const removeToast = (id: string) => setToasts(t => t.filter(x => x.id !== id));

  const loadBanks = useCallback(async () => {
    try {
      const res = await fetch('/api/financing/banks');
      if (res.ok) {
        const data = await res.json();
        setBanks(Array.isArray(data) ? data : data.banks || []);
      }
    } catch {
      console.error('Failed to load banks');
    }
  }, []);

  const loadPrograms = useCallback(async () => {
    try {
      const res = await fetch('/api/financing/programs');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.programs || [];
        setPrograms(list.map(fromApi));
      }
    } catch {
      console.error('Failed to load programs');
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.vehicles || [];
        setVehicles(list.map((v: any) => ({ id: v.id, name: v.name || v.modelName || v.title || 'Vehicle' })));
      } else {
        const pub = await fetch('/api/public/vehicles');
        if (pub.ok) {
          const pd = await pub.json();
          const list = Array.isArray(pd) ? pd : pd.vehicles || [];
          setVehicles(list.map((v: any) => ({ id: v.id, name: v.name || v.modelName || v.title || 'Vehicle' })));
        }
      }
    } catch {
      console.error('Failed to load vehicles');
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.categories || [];
        setCategories(list.map((c: any) => ({ id: c.id, name: c.name })));
      } else {
        const pub = await fetch('/api/public/categories');
        if (pub.ok) {
          const pd = await pub.json();
          const list = Array.isArray(pd) ? pd : pd.categories || [];
          setCategories(list.map((c: any) => ({ id: c.id, name: c.name })));
        }
      }
    } catch {
      console.error('Failed to load categories');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadBanks(), loadPrograms(), loadVehicles(), loadCategories()]);
      setLoading(false);
    })();
  }, [loadBanks, loadPrograms, loadVehicles, loadCategories]);

  const openNewBank = () => {
    setEditingBank(emptyBank());
    setBankErrors({});
    setBankModalOpen(true);
  };

  const openEditBank = (b: Bank) => {
    setEditingBank({ ...b });
    setBankErrors({});
    setBankModalOpen(true);
  };

  const closeBankModal = () => {
    setBankModalOpen(false);
    setEditingBank(null);
    setBankErrors({});
  };

  const validateBank = (b: BankForm) => {
    const errs: Record<string, string> = {};
    if (!b.name.trim()) errs.name = 'Bank name is required';
    if (!b.slug.trim()) errs.slug = 'Slug is required';
    setBankErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveBank = async () => {
    if (!editingBank || !validateBank(editingBank)) return;
    setSubmitting(true);
    try {
      const isEdit = !!editingBank.id;
      const url = isEdit ? `/api/financing/banks/${editingBank.id}` : '/api/financing/banks';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBank),
      });
      if (res.ok) {
        addToast('success', isEdit ? 'Bank updated successfully' : 'Bank created successfully');
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
        await loadBanks();
        closeBankModal();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast('error', data.error || 'Failed to save bank');
      }
    } catch {
      addToast('error', 'Failed to save bank');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBank = async (id: string) => {
    if (!confirm('Delete this bank? Associated programs may be affected.')) return;
    try {
      const res = await fetch(`/api/financing/banks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Bank deleted');
        setBanks(banks.filter(b => b.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        addToast('error', data.error || 'Failed to delete bank');
      }
    } catch {
      addToast('error', 'Failed to delete bank');
    }
  };

  const toggleBankActive = async (b: Bank) => {
    const updated = { ...b, isActive: !b.isActive };
    try {
      const res = await fetch(`/api/financing/banks/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setBanks(banks.map(x => x.id === b.id ? updated : x));
        addToast('success', updated.isActive ? 'Bank activated' : 'Bank deactivated');
      } else {
        addToast('error', 'Failed to update bank');
      }
    } catch {
      addToast('error', 'Failed to update bank');
    }
  };

  const openNewProgram = () => {
    const np = emptyProgram();
    if (banks.length > 0) np.bankId = banks[0].id;
    setEditingProgram(np);
    setProgramErrors({});
    setProgramModalOpen(true);
  };

  const openEditProgram = (p: FinancingProgram) => {
    setEditingProgram({ ...p });
    setProgramErrors({});
    setProgramModalOpen(true);
  };

  const closeProgramModal = () => {
    setProgramModalOpen(false);
    setEditingProgram(null);
    setProgramErrors({});
  };

  const validateProgram = (p: ProgramForm) => {
    const errs: Record<string, string> = {};
    if (!p.name.trim()) errs.name = 'Program name is required';
    if (!p.bankId) errs.bankId = 'Bank is required';
    if (p.interestRate < 0) errs.interestRate = 'Must be >= 0';
    if (p.downPayment < 0 || p.downPayment > 100) errs.downPayment = 'Must be 0-100';
    if (p.minDp < 0 || p.minDp > 100) errs.minDp = 'Must be 0-100';
    if (p.maxDp < 0 || p.maxDp > 100) errs.maxDp = 'Must be 0-100';
    if (p.minDp > p.maxDp) errs.rangeDp = 'Min DP > Max DP';
    if (p.tenureMonths < 1) errs.tenureMonths = 'Must be >= 1';
    if (p.minTM < 1) errs.minTM = 'Must be >= 1';
    if (p.minTM > p.maxTM) errs.rangeTM = 'Min tenure > Max tenure';
    if (p.processingFee < 0) errs.processingFee = 'Must be >= 0';
    if (p.procFeeMin < 0) errs.procFeeMin = 'Must be >= 0';
    if (p.procFeeMin > p.procFeeMax) errs.procFeeRange = 'Min fee > Max fee';
    if (p.insurance < 0) errs.insurance = 'Must be >= 0';
    setProgramErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveProgram = async (forceStatus?: ProgramStatus) => {
    if (!editingProgram || !validateProgram(editingProgram)) return;
    setSubmitting(true);
    try {
      const toSave = forceStatus ? { ...editingProgram, status: forceStatus } : editingProgram;
      const isEdit = !!toSave.id;
      const url = isEdit ? `/api/financing/programs/${toSave.id}` : '/api/financing/programs';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApi(toSave)),
      });
      if (res.ok) {
        addToast('success', isEdit ? 'Program updated successfully' : 'Program created successfully');
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
        await loadPrograms();
        closeProgramModal();
      } else {
        const data = await res.json().catch(() => ({}));
        addToast('error', data.error || 'Failed to save program');
      }
    } catch {
      addToast('error', 'Failed to save program');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm('Delete this financing program?')) return;
    try {
      const res = await fetch(`/api/financing/programs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Program deleted');
        setPrograms(programs.filter(p => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        addToast('error', data.error || 'Failed to delete program');
      }
    } catch {
      addToast('error', 'Failed to delete program');
    }
  };

  const toggleProgramStatus = async (p: FinancingProgram) => {
    const newStatus: ProgramStatus = p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const updated = { ...p, status: newStatus };
    try {
      const res = await fetch(`/api/financing/programs/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApi(updated)),
      });
      if (res.ok) {
        setPrograms(programs.map(x => x.id === p.id ? updated : x));
        addToast('success', newStatus === 'PUBLISHED' ? 'Program published' : 'Program moved to drafts');
      } else {
        addToast('error', 'Failed to update program status');
      }
    } catch {
      addToast('error', 'Failed to update program status');
    }
  };

  const statusBadge = (s: ProgramStatus) => {
    if (s === 'PUBLISHED') return 'bg-green-100 text-green-700';
    if (s === 'ARCHIVED') return 'bg-gray-100 text-gray-600';
    return 'bg-amber-100 text-amber-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <LayoutDashboard className="animate-spin w-5 h-5" /> Loading financing data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg border flex items-start gap-3 animate-in fade-in slide-in-from-right ${
              t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> :
             t.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> :
             <LayoutDashboard className="w-5 h-5 shrink-0 mt-0.5" />}
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
          <h1 className="text-2xl font-bold">Vehicle Purchases &amp; Payments</h1>
          <p className="text-gray-600">Configure supported bank payment channels and manage the direct purchase experience</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savedAt && (
            <span className="text-xs text-green-600 flex items-center gap-1 mr-1">
              <CheckCircle2 className="w-4 h-4" /> Saved {savedAt}
            </span>
          )}
          {activeTab === 'banks' && (
            <button
              onClick={openNewBank}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus size={18} /> Add Payment Bank
            </button>
          )}
          {activeTab === 'programs' && (
            <button
              onClick={openNewProgram}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus size={18} /> Add Purchase Option
            </button>
          )}
          {activeTab === 'banks' && (
            <button
              onClick={() => setActiveTab('programs')}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Banknote size={18} /> View Purchase Options
            </button>
          )}
          {activeTab === 'programs' && (
            <button
              onClick={() => setActiveTab('banks')}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Wallet size={18} /> View Payment Banks
            </button>
          )}
          <Link
            href="/admin/financing/content"
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <LayoutDashboard size={18} /> Public Page Content
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'banks'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Wallet size={16} /> Payment Banks
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'banks' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
          }`}>{banks.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'programs'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Banknote size={16} /> Purchase Options
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'programs' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
          }`}>{programs.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Settings size={16} /> Settings
        </button>
      </div>

      {/* BANKS TAB */}
      {activeTab === 'banks' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {banks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-base mb-2">No banks added yet</p>
                      <p className="text-sm mb-4">Add your first banking partner to create financing programs</p>
                      <button
                        onClick={openNewBank}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-geely-blue text-white rounded-lg hover:bg-navy text-sm"
                      >
                        <Plus size={16} /> Add Your First Bank
                      </button>
                    </td>
                  </tr>
                ) : (
                  banks.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-geely-blue to-navy text-white flex items-center justify-center shrink-0">
                            {b.logoUrl ? (
                              <img src={b.logoUrl} alt={b.name} className="w-full h-full rounded-lg object-contain bg-white" />
                            ) : (
                              <Wallet className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{b.name}</div>
                            {b.shortDescription && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{b.shortDescription}</div>
                            )}
                            {b.websiteUrl && (
                              <a href={b.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-geely-blue hover:underline truncate">
                                {b.websiteUrl}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-geely-blue bg-blue-50 px-2 py-1 rounded">{b.slug}</code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-0.5">
                          {b.phoneNumber && <div>📞 {b.phoneNumber}</div>}
                          {b.email && <div>✉️ {b.email}</div>}
                          {b.branchAddress && <div className="truncate max-w-xs">📍 {b.branchAddress}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {b._count.financingPrograms}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{b.displayOrder}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => toggleBankActive(b)} className="transition-colors">
                          {b.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <ToggleRight className="w-4 h-4" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <ToggleLeft className="w-4 h-4" /> Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleBankActive(b)}
                            title={b.isActive ? 'Deactivate' : 'Activate'}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            {b.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => openEditBank(b)}
                            title="Edit"
                            className="p-2 text-geely-blue hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteBank(b.id)}
                            title="Delete"
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROGRAMS TAB */}
      {activeTab === 'programs' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Option</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTAs</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                      <Banknote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-base mb-2">No purchase payment options yet</p>
                      <p className="text-sm mb-4">Create a payment option and assign it to a bank and vehicle</p>
                      <button
                        onClick={openNewProgram}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-geely-blue text-white rounded-lg hover:bg-navy text-sm"
                      >
                        <Plus size={16} /> Create First Purchase Option
                      </button>
                    </td>
                  </tr>
                ) : (
                  programs.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate">{p.name}</span>
                            {p.highlightBadge && p.badgeText && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                                ⭐ {p.badgeText}
                              </span>
                            )}
                            {!p.highlightBadge && p.badgeText && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {p.badgeText}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">Order: {p.displayOrder}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        {p.bank?.name || banks.find(b => b.id === p.bankId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-0.5">
                          <div className="font-medium text-gray-900">Direct bank payment</div>
                          <div className="text-xs text-gray-500">
                            Customer pays the published purchase amount
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {p.appliesToAllVehicles ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" /> All vehicles
                          </span>
                        ) : p.vehicle ? (
                          <span className="text-geely-blue font-medium">{p.vehicle.name}</span>
                        ) : p.vehicleCategory ? (
                          <span className="text-indigo-600 font-medium">📂 {p.vehicleCategory.name}</span>
                        ) : (
                          <span className="text-gray-400">Specific</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(p.status)}`}>
                          {p.status === 'PUBLISHED' ? <Eye className="w-3 h-3" /> : p.status === 'ARCHIVED' ? <EyeOff className="w-3 h-3" /> : <LayoutDashboard className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <div title={p.applyEnabled ? 'Apply enabled' : 'Apply disabled'} className={`p-1 rounded ${p.applyEnabled ? 'text-green-600 bg-green-50' : 'text-gray-300 bg-gray-50'}`}>
                            {p.applyEnabled ? <CheckCircle2 size={14} /> : <X size={14} />}
                          </div>
                          <div title={p.directPayEnabled ? 'Direct pay enabled' : 'Direct pay disabled'} className={`p-1 rounded ${p.directPayEnabled ? 'text-green-600 bg-green-50' : 'text-gray-300 bg-gray-50'}`}>
                            {p.directPayEnabled ? <CheckCircle2 size={14} /> : <X size={14} />}
                          </div>
                          <div title={p.scheduleEnabled ? 'Schedule enabled' : 'Schedule disabled'} className={`p-1 rounded ${p.scheduleEnabled ? 'text-green-600 bg-green-50' : 'text-gray-300 bg-gray-50'}`}>
                            {p.scheduleEnabled ? <CheckCircle2 size={14} /> : <X size={14} />}
                          </div>
                          <div title={p.visitShowroomEnabled ? 'Visit showroom enabled' : 'Visit showroom disabled'} className={`p-1 rounded ${p.visitShowroomEnabled ? 'text-green-600 bg-green-50' : 'text-gray-300 bg-gray-50'}`}>
                            {p.visitShowroomEnabled ? <CheckCircle2 size={14} /> : <X size={14} />}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleProgramStatus(p)}
                            title={p.status === 'PUBLISHED' ? 'Move to drafts' : 'Publish'}
                            className={`p-2 rounded transition-colors ${
                              p.status === 'PUBLISHED'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {p.status === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => openEditProgram(p)}
                            title="Edit"
                            className="p-2 text-geely-blue hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteProgram(p.id)}
                            title="Delete"
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <FinancingSettingsEditor />
      )}

      {/* BANK MODAL */}
      {bankModalOpen && editingBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-geely-blue to-navy text-white flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{editingBank.id ? 'Edit Bank' : 'New Bank'}</h2>
                  <p className="text-sm text-gray-500">Configure bank details</p>
                </div>
              </div>
              <button onClick={closeBankModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bank Name {bankErrors.name && <span className="text-red-500 text-xs ml-1">• {bankErrors.name}</span>}
                  </label>
                  <input
                    value={editingBank.name}
                    onChange={e => setEditingBank({ ...editingBank, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="Commercial Bank of Ethiopia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Slug {bankErrors.slug && <span className="text-red-500 text-xs ml-1">• {bankErrors.slug}</span>}
                  </label>
                  <input
                    value={editingBank.slug}
                    onChange={e => setEditingBank({ ...editingBank, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="cbe-bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={editingBank.displayOrder}
                    onChange={e => setEditingBank({ ...editingBank, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                  <textarea
                    rows={2}
                    value={editingBank.shortDescription || ''}
                    onChange={e => setEditingBank({ ...editingBank, shortDescription: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent resize-none"
                    placeholder="Brief description about this bank"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo URL</label>
                  <input
                    value={editingBank.logoUrl || ''}
                    onChange={e => setEditingBank({ ...editingBank, logoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Website URL</label>
                  <input
                    value={editingBank.websiteUrl || ''}
                    onChange={e => setEditingBank({ ...editingBank, websiteUrl: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    value={editingBank.phoneNumber || ''}
                    onChange={e => setEditingBank({ ...editingBank, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="+251 ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editingBank.email || ''}
                    onChange={e => setEditingBank({ ...editingBank, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="info@bank.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch Address</label>
                  <input
                    value={editingBank.branchAddress || ''}
                    onChange={e => setEditingBank({ ...editingBank, branchAddress: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="Addis Ababa, Churchill Ave"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setEditingBank({ ...editingBank, isActive: !editingBank.isActive })}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {editingBank.isActive ? <ToggleRight className="w-10 h-10 text-geely-blue" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
                  </button>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Active on Website</div>
                    <div className="text-xs text-gray-500">Inactive banks won&apos;t appear on the public site</div>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeBankModal}
                className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveBank}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
              >
                <Save size={18} />
                {submitting ? 'Saving...' : 'Save Bank'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROGRAM MODAL */}
      {programModalOpen && editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{editingProgram.id ? 'Edit Purchase Option' : 'New Purchase Option'}</h2>
                  <p className="text-sm text-gray-500">Configure how customers can pay for selected vehicles through this bank</p>
                </div>
              </div>
              <button onClick={closeProgramModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section: Core */}
              <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 text-white flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Core Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Program Name {programErrors.name && <span className="text-red-500 text-xs ml-1">• {programErrors.name}</span>}
                    </label>
                    <input
                      value={editingProgram.name}
                      onChange={e => setEditingProgram({ ...editingProgram, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Standard Auto Loan 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      value={editingProgram.displayOrder}
                      onChange={e => setEditingProgram({ ...editingProgram, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Bank {programErrors.bankId && <span className="text-red-500 text-xs ml-1">• {programErrors.bankId}</span>}
                    </label>
                    <select
                      value={editingProgram.bankId}
                      onChange={e => setEditingProgram({ ...editingProgram, bankId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      <option value="">Select a bank...</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Loan Terms */}
              <div className="hidden bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Legacy Payment Fields</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Interest Rate (%) {programErrors.interestRate && <span className="text-red-500 text-xs ml-1">• {programErrors.interestRate}</span>}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProgram.interestRate}
                      onChange={e => setEditingProgram({ ...editingProgram, interestRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Default DP (%) {programErrors.downPayment && <span className="text-red-500 text-xs ml-1">• {programErrors.downPayment}</span>}
                    </label>
                    <input
                      type="number"
                      value={editingProgram.downPayment}
                      onChange={e => setEditingProgram({ ...editingProgram, downPayment: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Default Tenure (mo) {programErrors.tenureMonths && <span className="text-red-500 text-xs ml-1">• {programErrors.tenureMonths}</span>}
                    </label>
                    <input
                      type="number"
                      value={editingProgram.tenureMonths}
                      onChange={e => setEditingProgram({ ...editingProgram, tenureMonths: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Min DP (%) {programErrors.minDp && <span className="text-red-500 text-xs ml-1">• {programErrors.minDp}</span>}
                      {programErrors.rangeDp && <span className="text-red-500 text-xs ml-1">• {programErrors.rangeDp}</span>}
                    </label>
                    <input
                      type="number"
                      value={editingProgram.minDp}
                      onChange={e => setEditingProgram({ ...editingProgram, minDp: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Max DP (%) {programErrors.maxDp && <span className="text-red-500 text-xs ml-1">• {programErrors.maxDp}</span>}
                    </label>
                    <input
                      type="number"
                      value={editingProgram.maxDp}
                      onChange={e => setEditingProgram({ ...editingProgram, maxDp: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Insurance (%) {programErrors.insurance && <span className="text-red-500 text-xs ml-1">• {programErrors.insurance}</span>}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProgram.insurance}
                      onChange={e => setEditingProgram({ ...editingProgram, insurance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Min Tenure (mo) {programErrors.minTM && <span className="text-red-500 text-xs ml-1">• {programErrors.minTM}</span>}
                      {programErrors.rangeTM && <span className="text-red-500 text-xs ml-1">• {programErrors.rangeTM}</span>}
                    </label>
                    <input
                      type="number"
                      value={editingProgram.minTM}
                      onChange={e => setEditingProgram({ ...editingProgram, minTM: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Tenure (mo)</label>
                    <input
                      type="number"
                      value={editingProgram.maxTM}
                      onChange={e => setEditingProgram({ ...editingProgram, maxTM: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Processing Fee (%) {programErrors.processingFee && <span className="text-red-500 text-xs ml-1">• {programErrors.processingFee}</span>}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProgram.processingFee}
                      onChange={e => setEditingProgram({ ...editingProgram, processingFee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Proc Fee Min (ETB) {programErrors.procFeeMin && <span className="text-red-500 text-xs ml-1">• {programErrors.procFeeMin}</span>}
                      {programErrors.procFeeRange && <span className="text-red-500 text-xs ml-1">• {programErrors.procFeeRange}</span>}
                    </label>
                    <input
                      type="number"
                      value={editingProgram.procFeeMin}
                      onChange={e => setEditingProgram({ ...editingProgram, procFeeMin: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Proc Fee Max (ETB)</label>
                    <input
                      type="number"
                      value={editingProgram.procFeeMax}
                      onChange={e => setEditingProgram({ ...editingProgram, procFeeMax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Scope */}
              <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Vehicle Scope</h3>
                  </div>
                  <label className="flex items-center gap-2 px-4 py-2 border border-indigo-200 rounded-lg hover:bg-white cursor-pointer bg-white">
                    <input
                      type="checkbox"
                      checked={editingProgram.appliesToAllVehicles}
                      onChange={e => setEditingProgram({ ...editingProgram, appliesToAllVehicles: e.target.checked })}
                      className="rounded text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Applies to All Vehicles</span>
                  </label>
                </div>
                {!editingProgram.appliesToAllVehicles && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Specific Vehicle</label>
                      <select
                        value={editingProgram.vehicleId || ''}
                        onChange={e => setEditingProgram({ ...editingProgram, vehicleId: e.target.value || null, vehicleCategoryId: e.target.value ? null : editingProgram.vehicleCategoryId })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">-- Select vehicle (optional) --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Category</label>
                      <select
                        value={editingProgram.vehicleCategoryId || ''}
                        onChange={e => setEditingProgram({ ...editingProgram, vehicleCategoryId: e.target.value || null, vehicleId: e.target.value ? null : editingProgram.vehicleId })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">-- Select category (optional) --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: CTA Toggles */}
              <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-geely-blue to-navy text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Purchase Flow Actions</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingProgram({ ...editingProgram, applyEnabled: !editingProgram.applyEnabled })}
                          className="transition-colors"
                        >
                          {editingProgram.applyEnabled ? <ToggleRight className="w-8 h-8 text-geely-blue" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                        </button>
                        <span className="font-semibold text-gray-800">Purchase Vehicle</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${editingProgram.applyEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {editingProgram.applyEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {editingProgram.applyEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                          <input
                            value={editingProgram.applyLabel || ''}
                            onChange={e => setEditingProgram({ ...editingProgram, applyLabel: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                            placeholder="Purchase Vehicle"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                          <input
                            value={editingProgram.applyUrl || ''}
                            onChange={e => setEditingProgram({ ...editingProgram, applyUrl: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                            placeholder="/financing/apply"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingProgram({ ...editingProgram, directPayEnabled: !editingProgram.directPayEnabled })}
                          className="transition-colors"
                        >
                          {editingProgram.directPayEnabled ? <ToggleRight className="w-8 h-8 text-geely-blue" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                        </button>
                        <span className="font-semibold text-gray-800">Bank Payment Online</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${editingProgram.directPayEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {editingProgram.directPayEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {editingProgram.directPayEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                          <input
                            value={editingProgram.directPayLabel || ''}
                            onChange={e => setEditingProgram({ ...editingProgram, directPayLabel: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                            placeholder="Pay Online"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                          <input
                            value={editingProgram.directPayUrl || ''}
                            onChange={e => setEditingProgram({ ...editingProgram, directPayUrl: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingProgram({ ...editingProgram, visitShowroomEnabled: !editingProgram.visitShowroomEnabled })}
                          className="transition-colors"
                        >
                          {editingProgram.visitShowroomEnabled ? <ToggleRight className="w-8 h-8 text-geely-blue" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                        </button>
                        <span className="font-semibold text-gray-800">Visit Showroom</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${editingProgram.visitShowroomEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {editingProgram.visitShowroomEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {editingProgram.visitShowroomEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                          <input
                            value={editingProgram.visitShowroomLabel || ''}
                            onChange={e => setEditingProgram({ ...editingProgram, visitShowroomLabel: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                            placeholder="Visit Showroom"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                          <input
                            value={editingProgram.visitShowroomUrl || ''}
                            onChange={e => setEditingProgram({ ...editingProgram, visitShowroomUrl: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                            placeholder="/showrooms"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingProgram({ ...editingProgram, scheduleEnabled: !editingProgram.scheduleEnabled })}
                          className="transition-colors"
                        >
                          {editingProgram.scheduleEnabled ? <ToggleRight className="w-8 h-8 text-geely-blue" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                        </button>
                        <span className="font-semibold text-gray-800">Schedule Consultation</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${editingProgram.scheduleEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {editingProgram.scheduleEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {editingProgram.scheduleEnabled && (
                      <div className="pl-11">
                        <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                        <input
                          value={editingProgram.scheduleUrl || ''}
                          onChange={e => setEditingProgram({ ...editingProgram, scheduleUrl: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                          placeholder="/schedule"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Badges + Fine Print */}
              <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Badges, Fine Print &amp; Eligibility</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Badge Text</label>
                    <input
                      value={editingProgram.badgeText || ''}
                      onChange={e => setEditingProgram({ ...editingProgram, badgeText: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Best Value · Popular · New"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 px-4 py-3 border border-amber-200 rounded-lg hover:bg-white cursor-pointer w-full bg-white">
                      <input
                        type="checkbox"
                        checked={editingProgram.highlightBadge}
                        onChange={e => setEditingProgram({ ...editingProgram, highlightBadge: e.target.checked })}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">Highlight Badge</div>
                        <div className="text-xs text-gray-500">Use ⭐ gradient styling</div>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fine Print / Terms</label>
                    <textarea
                      rows={3}
                      value={editingProgram.finePrint || ''}
                      onChange={e => setEditingProgram({ ...editingProgram, finePrint: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
                      placeholder="Terms and conditions apply. Subject to bank approval. Interest rate may vary..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Eligibility Note</label>
                    <textarea
                      rows={3}
                      value={editingProgram.eligibilityNote || ''}
                      onChange={e => setEditingProgram({ ...editingProgram, eligibilityNote: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
                      placeholder="Requires 2 years employment. Min monthly income ETB 15,000..."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 mr-1">Status:</span>
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${statusBadge(editingProgram.status)}`}>
                  {editingProgram.status === 'PUBLISHED' ? <Eye className="w-3 h-3" /> : editingProgram.status === 'ARCHIVED' ? <EyeOff className="w-3 h-3" /> : <LayoutDashboard className="w-3 h-3" />}
                  {editingProgram.status}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={closeProgramModal}
                  className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveProgram('DRAFT')}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                >
                  <Save size={18} />
                  {submitting ? 'Saving...' : editingProgram.status === 'PUBLISHED' ? 'Save as Draft' : 'Save Draft'}
                </button>
                <button
                  onClick={() => saveProgram('PUBLISHED')}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-md shadow-green-500/20 hover:from-green-700 hover:to-emerald-700 disabled:opacity-60"
                >
                  <CheckCircle2 size={18} />
                  {submitting ? 'Publishing...' : editingProgram.status === 'PUBLISHED' ? 'Save & Keep Published' : 'Save & Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
