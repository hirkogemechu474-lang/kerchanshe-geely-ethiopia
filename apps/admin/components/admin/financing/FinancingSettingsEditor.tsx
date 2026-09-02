'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Percent,
  Clock,
  FileCheck,
  Calculator,
  DollarSign,
  Info,
  AlertCircle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  duration: string;
}

interface FinancingSettings {
  enabled: boolean;
  calculator: {
    enabled: boolean;
    defaultDownPayment: number;
    minDownPayment: number;
    maxDownPayment: number;
    defaultTenure: number;
    minTenure: number;
    maxTenure: number;
    tenureOptions: number[];
    defaultInterestRate: number;
    interestRateRange: { min: number; max: number };
  };
  requirements: {
    ethiopianCitizenship: boolean;
    minAge: number;
    maxAge: number;
    minMonthlyIncome: number;
    employmentRequired: boolean;
    minEmploymentYears: number;
    documents: string[];
  };
  process: {
    steps: ProcessStep[];
    totalDuration: string;
    fastTrackAvailable: boolean;
    fastTrackDuration: string;
  };
  fees: {
    processingFee: {
      percentage: number;
      min: number;
      max: number;
    };
    insurance: {
      comprehensive: {
        percentage: number;
        description: string;
      };
      thirdParty: {
        fixed: number;
        description: string;
      };
    };
    registration: {
      plates: number;
      license: number;
      inspection: number;
    };
  };
  additionalInfo: {
    latePaymentPenalty: number;
    earlyRepaymentAllowed: boolean;
    earlyRepaymentPenalty: number;
    gracePeriod: number;
    maxMissedPayments: number;
    balloonPaymentAvailable: boolean;
  };
  support: {
    phone: string;
    email: string;
    whatsapp: string;
    consultationAvailable: boolean;
    consultationFree: boolean;
  };
}

const DEFAULT_SETTINGS: FinancingSettings = {
  enabled: true,
  calculator: {
    enabled: true,
    defaultDownPayment: 20,
    minDownPayment: 10,
    maxDownPayment: 80,
    defaultTenure: 5,
    minTenure: 1,
    maxTenure: 7,
    tenureOptions: [1, 2, 3, 4, 5, 6, 7],
    defaultInterestRate: 13.5,
    interestRateRange: { min: 12.5, max: 15.5 },
  },
  requirements: {
    ethiopianCitizenship: true,
    minAge: 21,
    maxAge: 65,
    minMonthlyIncome: 15000,
    employmentRequired: true,
    minEmploymentYears: 1,
    documents: [
      'Valid Ethiopian ID or Passport',
      'Proof of Income (Salary slip or Bank statement for 3-6 months)',
      'Employment Letter / Contract',
      'Proof of Residence (Utility bill, Lease agreement)',
      'Completed Application Form',
      'Down Payment Receipt',
      'TIN (Tax Identification Number)',
      'Two Recent Passport Photos',
      'Bank account statement (latest 6 months)',
      'Credit Bureau report (if applicable)',
    ],
  },
  process: {
    steps: [
      { step: 1, title: 'Calculate & Estimate', description: 'Use our online calculator to estimate monthly payments based on vehicle price, down payment, and preferred loan term.', duration: '5 minutes' },
      { step: 2, title: 'Submit Application', description: 'Complete the financing application form online or at any showroom. Submit all required documentation for initial review.', duration: '1-2 hours' },
      { step: 3, title: 'Document Verification', description: 'The bank verifies your employment, income, and submitted documents. A credit check may also be performed.', duration: '1-2 business days' },
      { step: 4, title: 'Loan Approval', description: 'Upon successful verification, the bank approves your loan and issues a sanction letter with approved terms and conditions.', duration: '2-3 business days' },
      { step: 5, title: 'Sign Agreement & Pay Down Payment', description: 'Review and sign the loan agreement. Pay the down payment amount and any processing fees to complete the purchase.', duration: '1 day' },
      { step: 6, title: 'Vehicle Delivery', description: 'Once all paperwork is complete and payment is confirmed, you can take delivery of your new Geely vehicle!', duration: 'Same day' },
    ],
    totalDuration: '3-5 business days',
    fastTrackAvailable: true,
    fastTrackDuration: '2 business days',
  },
  fees: {
    processingFee: { percentage: 2.5, min: 5000, max: 30000 },
    insurance: {
      comprehensive: { percentage: 5, description: 'Full comprehensive insurance covering theft, accident, fire, and third-party liability.' },
      thirdParty: { fixed: 3500, description: 'Basic third-party liability insurance as required by Ethiopian law.' },
    },
    registration: { plates: 1800, license: 600, inspection: 1200 },
  },
  additionalInfo: {
    latePaymentPenalty: 2,
    earlyRepaymentAllowed: true,
    earlyRepaymentPenalty: 1,
    gracePeriod: 7,
    maxMissedPayments: 3,
    balloonPaymentAvailable: false,
  },
  support: {
    phone: '+251 11 000 0000',
    email: 'financing@geely-ethiopia.com',
    whatsapp: '+251 911 000 000',
    consultationAvailable: true,
    consultationFree: true,
  },
};

function cloneDefaults(): FinancingSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

export function FinancingSettingsEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FinancingSettings>(cloneDefaults());
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDocument, setNewDocument] = useState('');
  const [newTenureOption, setNewTenureOption] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/financing-settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        } else {
          setSettings(cloneDefaults());
        }
      } catch {
        setSettings(cloneDefaults());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validate = (s: FinancingSettings) => {
    const errs: Record<string, string> = {};
    const calc = s.calculator;
    if (calc.minDownPayment < 0 || calc.minDownPayment > 100) errs['calc-minDp'] = 'Must be 0-100%';
    if (calc.maxDownPayment < 0 || calc.maxDownPayment > 100) errs['calc-maxDp'] = 'Must be 0-100%';
    if (calc.minDownPayment > calc.maxDownPayment) errs['calc-rangeDp'] = 'Min > Max';
    if (calc.defaultDownPayment < calc.minDownPayment || calc.defaultDownPayment > calc.maxDownPayment) errs['calc-defaultDp'] = 'Outside min/max';
    if (calc.minTenure < 1) errs['calc-minTenure'] = 'Must be ≥1';
    if (calc.minTenure > calc.maxTenure) errs['calc-rangeTenure'] = 'Min > Max';
    if (calc.defaultTenure < calc.minTenure || calc.defaultTenure > calc.maxTenure) errs['calc-defaultTenure'] = 'Outside min/max';
    if (calc.interestRateRange.min > calc.interestRateRange.max) errs['calc-rangeRate'] = 'Min > Max';
    if (calc.defaultInterestRate < calc.interestRateRange.min || calc.defaultInterestRate > calc.interestRateRange.max) errs['calc-defaultRate'] = 'Outside min/max';
    if (s.requirements.minAge < 18) errs['req-minAge'] = 'Must be ≥18';
    if (s.requirements.minAge > s.requirements.maxAge) errs['req-ageRange'] = 'Min > Max';
    if (s.requirements.minMonthlyIncome < 0) errs['req-income'] = 'Must be ≥0';
    if (s.fees.processingFee.percentage < 0 || s.fees.processingFee.percentage > 100) errs['fees-procPct'] = 'Must be 0-100';
    if (s.fees.processingFee.min < 0) errs['fees-procMin'] = 'Must be ≥0';
    if (s.fees.processingFee.min > s.fees.processingFee.max) errs['fees-procRange'] = 'Min > Max';
    if (s.fees.insurance.comprehensive.percentage < 0 || s.fees.insurance.comprehensive.percentage > 100) errs['fees-insPct'] = 'Must be 0-100';
    if (s.fees.insurance.thirdParty.fixed < 0) errs['fees-ins3p'] = 'Must be ≥0';
    if (s.fees.registration.plates < 0) errs['fees-regPlates'] = 'Must be ≥0';
    if (s.fees.registration.license < 0) errs['fees-regLicense'] = 'Must be ≥0';
    if (s.fees.registration.inspection < 0) errs['fees-regInspection'] = 'Must be ≥0';
    if (s.additionalInfo.latePaymentPenalty < 0) errs['add-latePenalty'] = 'Must be ≥0';
    if (s.additionalInfo.earlyRepaymentPenalty < 0) errs['add-earlyPenalty'] = 'Must be ≥0';
    if (s.additionalInfo.gracePeriod < 0) errs['add-grace'] = 'Must be ≥0';
    if (s.additionalInfo.maxMissedPayments < 0) errs['add-missed'] = 'Must be ≥0';
    if (!s.support.phone.trim()) errs['sup-phone'] = 'Phone required';
    if (!s.support.email.trim()) errs['sup-email'] = 'Email required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    setSaving(true);
    const isValid = validate(settings);
    if (!isValid) {
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/settings/financing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 3000);
      } else {
        alert('Failed to save financing settings');
      }
    } catch {
      alert('Failed to save financing settings');
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    const newStep: ProcessStep = {
      step: settings.process.steps.length + 1,
      title: '',
      description: '',
      duration: '',
    };
    setSettings(s => ({
      ...s,
      process: { ...s.process, steps: [...s.process.steps, newStep] },
    }));
  };

  const removeStep = (index: number) => {
    if (!confirm('Remove this step?')) return;
    setSettings(s => ({
      ...s,
      process: {
        ...s.process,
        steps: s.process.steps
          .filter((_, i) => i !== index)
          .map((st, i) => ({ ...st, step: i + 1 })),
      },
    }));
  };

  const updateStep = (index: number, changes: Partial<ProcessStep>) => {
    setSettings(s => ({
      ...s,
      process: {
        ...s.process,
        steps: s.process.steps.map((st, i) => i === index ? { ...st, ...changes } : st),
      },
    }));
  };

  const addDocument = () => {
    const doc = newDocument.trim();
    if (!doc) return;
    setSettings(s => ({ ...s, requirements: { ...s.requirements, documents: [...s.requirements.documents, doc] } }));
    setNewDocument('');
  };

  const removeDocument = (index: number) => {
    setSettings(s => ({
      ...s,
      requirements: { ...s.requirements, documents: s.requirements.documents.filter((_, i) => i !== index) },
    }));
  };

  const updateDocument = (index: number, value: string) => {
    setSettings(s => ({
      ...s,
      requirements: {
        ...s.requirements,
        documents: s.requirements.documents.map((d, i) => i === index ? value : d),
      },
    }));
  };

  const addTenureOption = () => {
    const val = parseInt(newTenureOption);
    if (!val || val < 1 || settings.calculator.tenureOptions.includes(val)) return;
    setSettings(s => ({
      ...s,
      calculator: {
        ...s.calculator,
        tenureOptions: [...s.calculator.tenureOptions, val].sort((a, b) => a - b),
      },
    }));
    setNewTenureOption('');
  };

  const removeTenureOption = (val: number) => {
    setSettings(s => ({
      ...s,
      calculator: { ...s.calculator, tenureOptions: s.calculator.tenureOptions.filter(t => t !== val) },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <Clock className="animate-spin w-5 h-5" /> Loading financing settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Purchase &amp; Payment Settings</h2>
            <p className="text-sm text-gray-600">Configure the direct vehicle purchase experience, payment guidance, and support contacts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
              {savedAt && <span className="ml-1 text-xs text-blue-100 opacity-90">Saved at {savedAt}</span>}
            </button>
          </div>
        </div>

        {/* Card 1: Main Header + Calculator Defaults */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-geely-blue to-navy text-white flex items-center justify-center shadow-md shadow-geely-blue/30">
                <Calculator className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Purchase Experience Overview</h2>
                <p className="text-sm text-gray-500">Manage the direct vehicle purchase experience shown to customers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Module Enabled</span>
              <button
                onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                {settings.enabled ? <ToggleRight className="w-10 h-10 text-geely-blue" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.calculator.enabled}
                  onChange={e => setSettings(s => ({ ...s, calculator: { ...s.calculator, enabled: e.target.checked } }))}
                  className="rounded text-blue-500 focus:ring-geely-blue"
                />
                <span className="text-sm font-medium text-gray-700">Show Calculator</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-800">Legacy Deposit Fields (not used for direct purchase)</h3>
              {errors['calc-minDp'] || errors['calc-maxDp'] || errors['calc-rangeDp'] || errors['calc-defaultDp'] ? (
                <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Min {errors['calc-minDp'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-minDp']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.calculator.minDownPayment}
                  onChange={e => setSettings(s => ({ ...s, calculator: { ...s.calculator, minDownPayment: parseFloat(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max {errors['calc-maxDp'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-maxDp']}</span>}
                  {errors['calc-rangeDp'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-rangeDp']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.calculator.maxDownPayment}
                  onChange={e => setSettings(s => ({ ...s, calculator: { ...s.calculator, maxDownPayment: parseFloat(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Default {errors['calc-defaultDp'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-defaultDp']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.calculator.defaultDownPayment}
                  onChange={e => setSettings(s => ({ ...s, calculator: { ...s.calculator, defaultDownPayment: parseFloat(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-800">Legacy Term Fields (not used for direct purchase)</h3>
              {errors['calc-minTenure'] || errors['calc-rangeTenure'] || errors['calc-defaultTenure'] ? (
                <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Min {errors['calc-minTenure'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-minTenure']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.calculator.minTenure}
                  onChange={e => setSettings(s => ({ ...s, calculator: { ...s.calculator, minTenure: parseInt(e.target.value) || 1 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max {errors['calc-rangeTenure'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-rangeTenure']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.calculator.maxTenure}
                  onChange={e => setSettings(s => ({ ...s, calculator: { ...s.calculator, maxTenure: parseInt(e.target.value) || 1 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Default {errors['calc-defaultTenure'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-defaultTenure']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.calculator.defaultTenure}
                  onChange={e => setSettings(s => ({ ...s, calculator: { ...s.calculator, defaultTenure: parseInt(e.target.value) || 1 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Tenure Options</label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3 min-h-[52px]">
                {settings.calculator.tenureOptions.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm">
                    {t}yr
                    <button onClick={() => removeTenureOption(t)} className="ml-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {settings.calculator.tenureOptions.length === 0 && (
                  <span className="text-sm text-gray-400 italic">No options</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newTenureOption}
                  onChange={e => setNewTenureOption(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTenureOption()}
                  placeholder="Add tenure year (e.g. 8)"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button onClick={addTenureOption} className="flex items-center gap-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-800">Legacy Rate Fields (not used for direct purchase)</h3>
              {errors['calc-rangeRate'] || errors['calc-defaultRate'] ? (
                <AlertCircle className="w-4 h-4 text-red-500 ml-auto" />
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Rate</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.calculator.interestRateRange.min}
                  onChange={e => setSettings(s => ({
                    ...s,
                    calculator: { ...s.calculator, interestRateRange: { ...s.calculator.interestRateRange, min: parseFloat(e.target.value) || 0 } },
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max Rate {errors['calc-rangeRate'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-rangeRate']}</span>}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.calculator.interestRateRange.max}
                  onChange={e => setSettings(s => ({
                    ...s,
                    calculator: { ...s.calculator, interestRateRange: { ...s.calculator.interestRateRange, max: parseFloat(e.target.value) || 0 } },
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Default Rate {errors['calc-defaultRate'] && <span className="text-red-500 text-xs ml-1">• {errors['calc-defaultRate']}</span>}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.calculator.defaultInterestRate}
                  onChange={e => setSettings(s => ({ ...s, calculator: { ...s.calculator, defaultInterestRate: parseFloat(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Process Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/30">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Purchase Process Steps</h2>
                <p className="text-sm text-gray-500">Define the customer journey from vehicle selection to delivery</p>
              </div>
            </div>
            <button onClick={addStep} className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <Plus size={16} /> Add Step
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.process.steps.map((step, index) => (
              <div key={index} className="relative border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-navy text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        value={step.title}
                        onChange={e => updateStep(index, { title: e.target.value })}
                        placeholder="Step title"
                        className="w-full font-semibold text-gray-800 bg-transparent border-b border-transparent focus:border-cyan-400 outline-none pb-0.5"
                      />
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <input
                          value={step.duration}
                          onChange={e => updateStep(index, { duration: e.target.value })}
                          placeholder="e.g. 1-2 days"
                          className="bg-transparent outline-none border-b border-transparent focus:border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStep(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={step.description}
                  onChange={e => updateStep(index, { description: e.target.value })}
                  placeholder="Describe this step in detail..."
                  className="w-full px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Estimated Duration</label>
              <input
                value={settings.process.totalDuration}
                onChange={e => setSettings(s => ({ ...s, process: { ...s.process, totalDuration: e.target.value } }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="3-5 business days"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={settings.process.fastTrackAvailable}
                  onChange={e => setSettings(s => ({ ...s, process: { ...s.process, fastTrackAvailable: e.target.checked } }))}
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm font-medium text-gray-700">Fast Track Available</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fast Track Duration</label>
              <input
                value={settings.process.fastTrackDuration}
                onChange={e => setSettings(s => ({ ...s, process: { ...s.process, fastTrackDuration: e.target.value } }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="2 business days"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Requirements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Purchase Requirements</h2>
              <p className="text-sm text-gray-500">Age, income, employment requirements and required documents</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center">
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={settings.requirements.ethiopianCitizenship}
                  onChange={e => setSettings(s => ({ ...s, requirements: { ...s.requirements, ethiopianCitizenship: e.target.checked } }))}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700">Ethiopian Citizenship Required</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Min Age {errors['req-minAge'] && <span className="text-red-500 text-xs ml-1">• {errors['req-minAge']}</span>}
              </label>
              <input
                type="number"
                value={settings.requirements.minAge}
                onChange={e => setSettings(s => ({ ...s, requirements: { ...s.requirements, minAge: parseInt(e.target.value) || 0 } }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Max Age {errors['req-ageRange'] && <span className="text-red-500 text-xs ml-1">• {errors['req-ageRange']}</span>}
              </label>
              <input
                type="number"
                value={settings.requirements.maxAge}
                onChange={e => setSettings(s => ({ ...s, requirements: { ...s.requirements, maxAge: parseInt(e.target.value) || 0 } }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Min Monthly Income (ETB) {errors['req-income'] && <span className="text-red-500 text-xs ml-1">• {errors['req-income']}</span>}
              </label>
              <input
                type="number"
                value={settings.requirements.minMonthlyIncome}
                onChange={e => setSettings(s => ({ ...s, requirements: { ...s.requirements, minMonthlyIncome: parseFloat(e.target.value) || 0 } }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={settings.requirements.employmentRequired}
                  onChange={e => setSettings(s => ({ ...s, requirements: { ...s.requirements, employmentRequired: e.target.checked } }))}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700">Employment Required</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Employment Years</label>
              <input
                type="number"
                value={settings.requirements.minEmploymentYears}
                onChange={e => setSettings(s => ({ ...s, requirements: { ...s.requirements, minEmploymentYears: parseFloat(e.target.value) || 0 } }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Required Documents</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{settings.requirements.documents.length} documents</span>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                value={newDocument}
                onChange={e => setNewDocument(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDocument()}
                placeholder="Add a required document..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button onClick={addDocument} className="flex items-center gap-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                <Plus size={16} /> Add
              </button>
            </div>
            <ul className="space-y-2">
              {settings.requirements.documents.map((doc, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                  <input
                    value={doc}
                    onChange={e => updateDocument(i, e.target.value)}
                    className="flex-1 text-sm text-gray-800 bg-transparent border-b border-transparent focus:border-amber-400 outline-none"
                  />
                  <button onClick={() => removeDocument(i)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md shrink-0">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
              {settings.requirements.documents.length === 0 && (
                <li className="text-sm text-gray-500 px-4 py-3 italic text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">No documents added yet</li>
              )}
            </ul>
          </div>
        </div>

        {/* Card 4: Fees & Charges */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Purchase Fees & Charges</h2>
              <p className="text-sm text-gray-500">Processing fees, insurance, and vehicle registration costs</p>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4 text-rose-500" /> Processing Fee
              {errors['fees-procPct'] || errors['fees-procMin'] || errors['fees-procRange'] ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : null}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Percentage (%) {errors['fees-procPct'] && <span className="text-red-500 text-xs ml-1">• {errors['fees-procPct']}</span>}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.fees.processingFee.percentage}
                  onChange={e => setSettings(s => ({ ...s, fees: { ...s.fees, processingFee: { ...s.fees.processingFee, percentage: parseFloat(e.target.value) || 0 } } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Min (ETB) {errors['fees-procMin'] && <span className="text-red-500 text-xs ml-1">• {errors['fees-procMin']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.fees.processingFee.min}
                  onChange={e => setSettings(s => ({ ...s, fees: { ...s.fees, processingFee: { ...s.fees.processingFee, min: parseFloat(e.target.value) || 0 } } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max (ETB) {errors['fees-procRange'] && <span className="text-red-500 text-xs ml-1">• {errors['fees-procRange']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.fees.processingFee.max}
                  onChange={e => setSettings(s => ({ ...s, fees: { ...s.fees, processingFee: { ...s.fees.processingFee, max: parseFloat(e.target.value) || 0 } } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-500" /> Insurance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-rose-50 to-white border border-rose-100 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Comprehensive (Percentage)</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Rate (%) {errors['fees-insPct'] && <span className="text-red-500 text-xs ml-1">• {errors['fees-insPct']}</span>}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.fees.insurance.comprehensive.percentage}
                    onChange={e => setSettings(s => ({
                      ...s,
                      fees: {
                        ...s.fees,
                        insurance: {
                          ...s.fees.insurance,
                          comprehensive: { ...s.fees.insurance.comprehensive, percentage: parseFloat(e.target.value) || 0 },
                        },
                      },
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={settings.fees.insurance.comprehensive.description}
                    onChange={e => setSettings(s => ({
                      ...s,
                      fees: {
                        ...s.fees,
                        insurance: {
                          ...s.fees.insurance,
                          comprehensive: { ...s.fees.insurance.comprehensive, description: e.target.value },
                        },
                      },
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Third Party (Fixed ETB)</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fixed Amount (ETB) {errors['fees-ins3p'] && <span className="text-red-500 text-xs ml-1">• {errors['fees-ins3p']}</span>}
                  </label>
                  <input
                    type="number"
                    value={settings.fees.insurance.thirdParty.fixed}
                    onChange={e => setSettings(s => ({
                      ...s,
                      fees: {
                        ...s.fees,
                        insurance: {
                          ...s.fees.insurance,
                          thirdParty: { ...s.fees.insurance.thirdParty, fixed: parseFloat(e.target.value) || 0 },
                        },
                      },
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={settings.fees.insurance.thirdParty.description}
                    onChange={e => setSettings(s => ({
                      ...s,
                      fees: {
                        ...s.fees,
                        insurance: {
                          ...s.fees.insurance,
                          thirdParty: { ...s.fees.insurance.thirdParty, description: e.target.value },
                        },
                      },
                    }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-rose-500" /> Vehicle Registration (ETB)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plates {errors['fees-regPlates'] && <span className="text-red-500 text-xs ml-1">• {errors['fees-regPlates']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.fees.registration.plates}
                  onChange={e => setSettings(s => ({
                    ...s,
                    fees: { ...s.fees, registration: { ...s.fees.registration, plates: parseFloat(e.target.value) || 0 } },
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  License {errors['fees-regLicense'] && <span className="text-red-500 text-xs ml-1">• {errors['fees-regLicense']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.fees.registration.license}
                  onChange={e => setSettings(s => ({
                    ...s,
                    fees: { ...s.fees, registration: { ...s.fees.registration, license: parseFloat(e.target.value) || 0 } },
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Inspection {errors['fees-regInspection'] && <span className="text-red-500 text-xs ml-1">• {errors['fees-regInspection']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.fees.registration.inspection}
                  onChange={e => setSettings(s => ({
                    ...s,
                    fees: { ...s.fees, registration: { ...s.fees.registration, inspection: parseFloat(e.target.value) || 0 } },
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Additional Info & Support */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/30">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Payment Support & Delivery Guidance</h2>
              <p className="text-sm text-gray-500">Configure payment guidance and customer support contacts</p>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-teal-500" /> Payment Terms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Late Payment Penalty (%) {errors['add-latePenalty'] && <span className="text-red-500 text-xs ml-1">• {errors['add-latePenalty']}</span>}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.additionalInfo.latePaymentPenalty}
                  onChange={e => setSettings(s => ({ ...s, additionalInfo: { ...s.additionalInfo, latePaymentPenalty: parseFloat(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={settings.additionalInfo.earlyRepaymentAllowed}
                    onChange={e => setSettings(s => ({ ...s, additionalInfo: { ...s.additionalInfo, earlyRepaymentAllowed: e.target.checked } }))}
                    className="rounded text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Early Repayment Allowed</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Early Repayment Penalty (%) {errors['add-earlyPenalty'] && <span className="text-red-500 text-xs ml-1">• {errors['add-earlyPenalty']}</span>}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.additionalInfo.earlyRepaymentPenalty}
                  onChange={e => setSettings(s => ({ ...s, additionalInfo: { ...s.additionalInfo, earlyRepaymentPenalty: parseFloat(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4 inline text-teal-500" /> Grace Period (Days) {errors['add-grace'] && <span className="text-red-500 text-xs ml-1">• {errors['add-grace']}</span>}</span>
                </label>
                <input
                  type="number"
                  value={settings.additionalInfo.gracePeriod}
                  onChange={e => setSettings(s => ({ ...s, additionalInfo: { ...s.additionalInfo, gracePeriod: parseInt(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max Missed Payments {errors['add-missed'] && <span className="text-red-500 text-xs ml-1">• {errors['add-missed']}</span>}
                </label>
                <input
                  type="number"
                  value={settings.additionalInfo.maxMissedPayments}
                  onChange={e => setSettings(s => ({ ...s, additionalInfo: { ...s.additionalInfo, maxMissedPayments: parseInt(e.target.value) || 0 } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={settings.additionalInfo.balloonPaymentAvailable}
                    onChange={e => setSettings(s => ({ ...s, additionalInfo: { ...s.additionalInfo, balloonPaymentAvailable: e.target.checked } }))}
                    className="rounded text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Balloon Payment Available</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-500" /> Support Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4 inline text-teal-500" /> Phone {errors['sup-phone'] && <span className="text-red-500 text-xs ml-1">• {errors['sup-phone']}</span>}</span>
                </label>
                <input
                  value={settings.support.phone}
                  onChange={e => setSettings(s => ({ ...s, support: { ...s.support, phone: e.target.value } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="+251 11 000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1"><Mail className="w-4 h-4 inline text-teal-500" /> Email {errors['sup-email'] && <span className="text-red-500 text-xs ml-1">• {errors['sup-email']}</span>}</span>
                </label>
                <input
                  type="email"
                  value={settings.support.email}
                  onChange={e => setSettings(s => ({ ...s, support: { ...s.support, email: e.target.value } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="financing@geely-ethiopia.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 inline text-green-500" /> WhatsApp</span>
                </label>
                <input
                  value={settings.support.whatsapp}
                  onChange={e => setSettings(s => ({ ...s, support: { ...s.support, whatsapp: e.target.value } }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+251 911 000 000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.support.consultationAvailable}
                  onChange={e => setSettings(s => ({ ...s, support: { ...s.support, consultationAvailable: e.target.checked } }))}
                  className="rounded text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Consultation Available</span>
              </label>
              <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.support.consultationFree}
                  onChange={e => setSettings(s => ({ ...s, support: { ...s.support, consultationFree: e.target.checked } }))}
                  className="rounded text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Consultation is Free</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bottom save bar */}
        <div className="sticky bottom-4 z-10">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg shadow-gray-200/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4 text-blue-500" />
              <span>All changes are validated before saving. Fields with warnings still save.</span>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save All Changes'}
              {savedAt && <span className="ml-1 text-xs text-blue-100 opacity-90">Saved at {savedAt}</span>}
            </button>
          </div>
        </div>
      </div>
  );
}
