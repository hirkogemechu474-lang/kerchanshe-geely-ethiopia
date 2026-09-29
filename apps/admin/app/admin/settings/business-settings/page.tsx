'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Building,
  Badge,
  FileText,
  Clock,
  Globe,
  Hash,
} from 'lucide-react';
import { Card, Button, PageHeader } from '@/components/admin/ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface BusinessSettings {
  companyName: string;
  companyLegalName: string;
  tagline: string;
  description: string;
  established: string;
  vatNumber: string;
  tinNumber: string;
  tradeLicenseNumber: string;
  businessHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
    holidays: string;
  };
  currency: string;
  language: string;
  timezone: string;
  country: string;
  region: string;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  companyName: '',
  companyLegalName: '',
  tagline: '',
  description: '',
  established: '',
  vatNumber: '',
  tinNumber: '',
  tradeLicenseNumber: '',
  businessHours: {
    weekdays: '',
    saturday: '',
    sunday: '',
    holidays: '',
  },
  currency: 'ETB',
  language: 'en',
  timezone: 'Africa/Addis_Ababa',
  country: 'Ethiopia',
  region: 'Addis Ababa',
};

const CURRENCY_OPTIONS = [
  { value: 'ETB', label: 'Ethiopian Birr (ETB)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'KES', label: 'Kenyan Shilling (KES)' },
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'ZAR', label: 'South African Rand (ZAR)' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'am', label: 'Amharic (አማርኛ)' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Africa/Addis_Ababa', label: 'Addis Ababa (EAT, UTC+3)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT, UTC+3)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT, UTC+1)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST, UTC+2)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST, UTC+8)' },
];

export default function BusinessSettingsPage() {
  useAdminAuth('canManageContent');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/business-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (err) {
      console.error('Error fetching business settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setFlashMessage(null);

    if (!settings.companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/settings/business-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setLastSaved(new Date().toLocaleString());
        setFlashMessage('Saved');
        setTimeout(() => setFlashMessage(null), 2500);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving business settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof BusinessSettings>(
    key: K,
    value: BusinessSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateBusinessHours = (
    key: keyof BusinessSettings['businessHours'],
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      businessHours: { ...prev.businessHours, [key]: value },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <button
            onClick={() => router.push('/admin/settings')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          <PageHeader
            title="Business Info"
            description="Company identity, legal details, operating hours & regional settings"
            actions={
              <>
                {lastSaved && (
                  <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Last saved: {lastSaved}
                  </div>
                )}

                {flashMessage && (
                  <div className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 animate-pulse">
                    ✓ {flashMessage}
                  </div>
                )}

                <Button onClick={handleSave} disabled={saving}>
                  <Save size={20} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            }
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Company Identity */}
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Company Identity</h2>
                <p className="text-xs text-gray-500">Your brand and business overview</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="e.g. Geely Ethiopia"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
                    error && !settings.companyName.trim()
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Legal Name
                </label>
                <input
                  type="text"
                  value={settings.companyLegalName}
                  onChange={(e) => updateField('companyLegalName', e.target.value)}
                  placeholder="e.g. Geely Motors Ethiopia PLC"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="Short slogan or motto"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  placeholder="Brief description of your business"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Hash size={14} className="text-gray-400" />
                  Established
                </label>
                <input
                  type="text"
                  value={settings.established}
                  onChange={(e) => updateField('established', e.target.value)}
                  placeholder="e.g. 2020"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Legal & Tax Numbers */}
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Badge className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Legal &amp; Tax Numbers</h2>
                <p className="text-xs text-gray-500">Registrations and official identifiers</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-500" />
                  VAT Number
                </label>
                <input
                  type="text"
                  value={settings.vatNumber}
                  onChange={(e) => updateField('vatNumber', e.target.value)}
                  placeholder="e.g. ET-1234567890"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Hash size={14} className="text-emerald-500" />
                  TIN Number
                </label>
                <input
                  type="text"
                  value={settings.tinNumber}
                  onChange={(e) => updateField('tinNumber', e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Badge size={14} className="text-emerald-500" />
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={settings.tradeLicenseNumber}
                  onChange={(e) => updateField('tradeLicenseNumber', e.target.value)}
                  placeholder="e.g. TLC-2024-98765432"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-900 mb-1">Keep records up to date</p>
                    <p className="text-emerald-800 leading-relaxed">
                      These numbers appear on invoices, receipts, and legal documents. Update promptly when renewed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Business Hours */}
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Business Hours</h2>
                <p className="text-xs text-gray-500">Operating schedule displayed on the website</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" />
                  Weekdays
                </label>
                <input
                  type="text"
                  value={settings.businessHours.weekdays}
                  onChange={(e) => updateBusinessHours('weekdays', e.target.value)}
                  placeholder="Monday - Friday: 8:00 AM - 6:00 PM"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" />
                  Saturday
                </label>
                <input
                  type="text"
                  value={settings.businessHours.saturday}
                  onChange={(e) => updateBusinessHours('saturday', e.target.value)}
                  placeholder="Saturday: 9:00 AM - 5:00 PM"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" />
                  Sunday
                </label>
                <input
                  type="text"
                  value={settings.businessHours.sunday}
                  onChange={(e) => updateBusinessHours('sunday', e.target.value)}
                  placeholder="Sunday: Closed"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" />
                  Holidays
                </label>
                <input
                  type="text"
                  value={settings.businessHours.holidays}
                  onChange={(e) => updateBusinessHours('holidays', e.target.value)}
                  placeholder="Public Holidays: Closed"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Card 4: Regional Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Regional Settings</h2>
                <p className="text-xs text-gray-500">Locale, currency and display preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Globe size={14} className="text-sky-500" />
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none bg-white"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Globe size={14} className="text-sky-500" />
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none bg-white"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-sky-500" />
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none bg-white"
                >
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Globe size={14} className="text-sky-500" />
                    Country
                  </label>
                  <input
                    type="text"
                    value={settings.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    placeholder="Ethiopia"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Globe size={14} className="text-sky-500" />
                    Region / City
                  </label>
                  <input
                    type="text"
                    value={settings.region}
                    onChange={(e) => updateField('region', e.target.value)}
                    placeholder="Addis Ababa"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}
