'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Navigation,
  Building2,
  LocateFixed,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ContactInformation {
  headquarters: {
    name: string;
    address: {
      street: string;
      area: string;
      city: string;
      region: string;
      country: string;
      postalCode: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  phone: {
    primary: string;
    sales: string;
    service: string;
    parts: string;
    emergency: string;
  };
  email: {
    general: string;
    sales: string;
    service: string;
    support: string;
    careers: string;
  };
  whatsapp: string;
  website: string;
}

const DEFAULT_DATA: ContactInformation = {
  headquarters: {
    name: 'Geely Ethiopia Headquarters',
    address: {
      street: 'Bole Medhane Alem Road',
      area: 'Bole Sub-city, Woreda 03',
      city: 'Addis Ababa',
      region: 'Addis Ababa',
      country: 'Ethiopia',
      postalCode: '1000',
    },
    coordinates: {
      latitude: 9.0174,
      longitude: 38.7453,
    },
  },
  phone: {
    primary: '+251 11 000 0000',
    sales: '+251 11 000 0001',
    service: '+251 11 000 0002',
    parts: '+251 11 000 0003',
    emergency: '+251 911 000 000',
  },
  email: {
    general: 'info@geely-ethiopia.com',
    sales: 'sales@geely-ethiopia.com',
    service: 'service@geely-ethiopia.com',
    support: 'support@geely-ethiopia.com',
    careers: 'careers@geely-ethiopia.com',
  },
  whatsapp: '+251 911 000 000',
  website: 'https://www.geely-ethiopia.com',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactInformationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ContactInformation>(DEFAULT_DATA);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/contact-information');
        if (res.ok) {
          const json = await res.json();
          setData({
            headquarters: {
              name: json.headquarters?.name ?? DEFAULT_DATA.headquarters.name,
              address: {
                street: json.headquarters?.address?.street ?? DEFAULT_DATA.headquarters.address.street,
                area: json.headquarters?.address?.area ?? DEFAULT_DATA.headquarters.address.area,
                city: json.headquarters?.address?.city ?? DEFAULT_DATA.headquarters.address.city,
                region: json.headquarters?.address?.region ?? DEFAULT_DATA.headquarters.address.region,
                country: json.headquarters?.address?.country ?? DEFAULT_DATA.headquarters.address.country,
                postalCode: json.headquarters?.address?.postalCode ?? DEFAULT_DATA.headquarters.address.postalCode,
              },
              coordinates: {
                latitude: parseFloat(json.headquarters?.coordinates?.latitude) ?? DEFAULT_DATA.headquarters.coordinates.latitude,
                longitude: parseFloat(json.headquarters?.coordinates?.longitude) ?? DEFAULT_DATA.headquarters.coordinates.longitude,
              },
            },
            phone: {
              primary: json.phone?.primary ?? DEFAULT_DATA.phone.primary,
              sales: json.phone?.sales ?? DEFAULT_DATA.phone.sales,
              service: json.phone?.service ?? DEFAULT_DATA.phone.service,
              parts: json.phone?.parts ?? DEFAULT_DATA.phone.parts,
              emergency: json.phone?.emergency ?? DEFAULT_DATA.phone.emergency,
            },
            email: {
              general: json.email?.general ?? DEFAULT_DATA.email.general,
              sales: json.email?.sales ?? DEFAULT_DATA.email.sales,
              service: json.email?.service ?? DEFAULT_DATA.email.service,
              support: json.email?.support ?? DEFAULT_DATA.email.support,
              careers: json.email?.careers ?? DEFAULT_DATA.email.careers,
            },
            whatsapp: json.whatsapp ?? DEFAULT_DATA.whatsapp,
            website: json.website ?? DEFAULT_DATA.website,
          });
        }
      } catch {
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (data.email.general && !EMAIL_REGEX.test(data.email.general)) {
      errs['email-general'] = 'Invalid email format';
    }

    const lat = data.headquarters.coordinates.latitude;
    const lng = data.headquarters.coordinates.longitude;
    if (lat < -90 || lat > 90) {
      errs['lat'] = 'Latitude must be between -90 and 90';
    }
    if (lng < -180 || lng > 180) {
      errs['lng'] = 'Longitude must be between -180 and 180';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    setSaving(true);
    try {
      if (!validate()) return;
      const res = await fetch('/api/settings/contact-information', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        alert('Failed to save contact information');
      }
    } catch {
      alert('Failed to save contact information');
    } finally {
      setSaving(false);
    }
  };

  const updateHQ = (changes: Partial<ContactInformation['headquarters']>) => {
    setData(d => ({ ...d, headquarters: { ...d.headquarters, ...changes } }));
  };

  const updateAddress = (changes: Partial<ContactInformation['headquarters']['address']>) => {
    setData(d => ({ ...d, headquarters: { ...d.headquarters, address: { ...d.headquarters.address, ...changes } } }));
  };

  const updateCoords = (changes: Partial<ContactInformation['headquarters']['coordinates']>) => {
    setData(d => ({ ...d, headquarters: { ...d.headquarters, coordinates: { ...d.headquarters.coordinates, ...changes } } }));
  };

  const updatePhone = (changes: Partial<ContactInformation['phone']>) => {
    setData(d => ({ ...d, phone: { ...d.phone, ...changes } }));
  };

  const updateEmail = (changes: Partial<ContactInformation['email']>) => {
    setData(d => ({ ...d, email: { ...d.email, ...changes } }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <Navigation className="animate-spin w-5 h-5" /> Loading contact information...
        </div>
      </div>
    );
  }

  const phoneFields = [
    { key: 'primary' as const, label: 'Primary Line', badge: 'bg-blue-50 text-blue-600', badgeIcon: Phone },
    { key: 'sales' as const, label: 'Sales Hotline', badge: 'bg-emerald-50 text-emerald-600', badgeIcon: Building2 },
    { key: 'service' as const, label: 'Service Center', badge: 'bg-orange-50 text-orange-600', badgeIcon: LocateFixed },
    { key: 'parts' as const, label: 'Parts Department', badge: 'bg-purple-50 text-purple-600', badgeIcon: MapPin },
    { key: 'emergency' as const, label: 'Emergency (24/7)', badge: 'bg-red-50 text-red-600', badgeIcon: AlertCircle },
  ];

  const emailFields = [
    { key: 'general' as const, label: 'General Inquiries', badge: 'bg-gray-50 text-gray-600' },
    { key: 'sales' as const, label: 'Sales Department', badge: 'bg-emerald-50 text-emerald-600' },
    { key: 'service' as const, label: 'Service Bookings', badge: 'bg-orange-50 text-orange-600' },
    { key: 'support' as const, label: 'Customer Support', badge: 'bg-blue-50 text-blue-600' },
    { key: 'careers' as const, label: 'Careers / HR', badge: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Settings
            </Link>
            <h1 className="text-2xl font-bold">Contact Information</h1>
            <p className="text-gray-600">Headquarters address, phone lines, emails, and digital channels</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
              {savedAt && (
                <span className="ml-1 text-xs text-blue-100 opacity-90 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved {savedAt}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Card 1: Headquarters */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="text-white">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> Headquarters
                  </h2>
                  <p className="text-orange-100 text-sm">Physical address and GPS map coordinates</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Headquarters Name</label>
                <input
                  value={data.headquarters.name}
                  onChange={e => updateHQ({ name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Geely Ethiopia Headquarters"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LocateFixed className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-gray-800">Street Address</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Street</label>
                    <input
                      value={data.headquarters.address.street}
                      onChange={e => updateAddress({ street: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Bole Medhane Alem Road"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Area / Sub-city</label>
                    <input
                      value={data.headquarters.address.area}
                      onChange={e => updateAddress({ area: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Bole Sub-city, Woreda 03"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                    <input
                      value={data.headquarters.address.city}
                      onChange={e => updateAddress({ city: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Addis Ababa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Region / State</label>
                    <input
                      value={data.headquarters.address.region}
                      onChange={e => updateAddress({ region: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Addis Ababa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                    <input
                      value={data.headquarters.address.country}
                      onChange={e => updateAddress({ country: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ethiopia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Postal Code</label>
                    <input
                      value={data.headquarters.address.postalCode}
                      onChange={e => updateAddress({ postalCode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-gray-800">GPS Coordinates</span>
                  <span className="text-xs text-gray-400 ml-1">— used for the embedded map and directions</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1`}>
                      Latitude (°)
                      {errors['lat'] && <span className="text-red-500 ml-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {errors['lat']}</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Navigation className="w-4 h-4 rotate-45" />
                      </span>
                      <input
                        type="number"
                        step="0.0001"
                        value={data.headquarters.coordinates.latitude}
                        onChange={e => updateCoords({ latitude: parseFloat(e.target.value) || 0 })}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors['lat'] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="9.0174"
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Range: -90 to 90</div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1`}>
                      Longitude (°)
                      {errors['lng'] && <span className="text-red-500 ml-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {errors['lng']}</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Navigation className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        step="0.0001"
                        value={data.headquarters.coordinates.longitude}
                        onChange={e => updateCoords({ longitude: parseFloat(e.target.value) || 0 })}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors['lng'] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        placeholder="38.7453"
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Range: -180 to 180</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-orange-800">Map Tip</div>
                    <div className="text-orange-700 mt-0.5">
                      Copy coordinates from Google Maps: right-click the location → select "What's here?" → copy the lat/lng numbers.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Phone Numbers */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div className="text-white">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Phone className="w-5 h-5" /> Phone Numbers
                  </h2>
                  <p className="text-emerald-100 text-sm">All customer-facing phone lines</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {phoneFields.map(({ key, label, badge, badgeIcon: BadgeIcon }) => (
                  <div key={key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all">
                    <div className={`w-11 h-11 rounded-xl ${badge} flex items-center justify-center shrink-0 shadow-sm`}>
                      <BadgeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                      <input
                        type="tel"
                        value={data.phone[key]}
                        onChange={e => updatePhone({ [key]: e.target.value } as Partial<ContactInformation['phone']>)}
                        className="w-full px-4 py-2.5 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="+251 11 000 0000"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Email & Digital */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <div className="text-white">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Globe className="w-5 h-5" /> Email &amp; Digital
                  </h2>
                  <p className="text-blue-100 text-sm">Email addresses, WhatsApp, and official website</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-800">Email Addresses</span>
                </div>
                <div className="space-y-3">
                  {emailFields.map(({ key, label, badge }) => {
                    const hasError = key === 'general' && errors['email-general'];
                    return (
                      <div key={key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all">
                        <div className={`w-11 h-11 rounded-xl ${badge} flex items-center justify-center shrink-0 shadow-sm`}>
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className={`block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1`}>
                            {label}
                            {key === 'general' && <span className="text-blue-500 font-normal">· required for validation</span>}
                            {hasError && <span className="text-red-500 ml-1 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {errors['email-general']}</span>}
                          </label>
                          <input
                            type="email"
                            value={data.email[key]}
                            onChange={e => {
                              updateEmail({ [key]: e.target.value } as Partial<ContactInformation['email']>);
                              if (key === 'general' && errors['email-general']) setErrors(prev => {
                                const n = { ...prev };
                                delete n['email-general'];
                                return n;
                              });
                            }}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            placeholder={key === 'general' ? 'info@company.com' : `${key}@company.com`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-800">Digital Channels</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                        <MessageCircle className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700">WhatsApp Number</label>
                        <span className="text-xs text-gray-500">Customer chat &amp; quick inquiries</span>
                      </div>
                    </div>
                    <input
                      type="tel"
                      value={data.whatsapp}
                      onChange={e => setData(d => ({ ...d, whatsapp: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-green-200 bg-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+251 911 000 000"
                    />
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                        <Globe className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700">Website URL</label>
                        <span className="text-xs text-gray-500">Official company website</span>
                      </div>
                    </div>
                    <input
                      type="url"
                      value={data.website}
                      onChange={e => setData(d => ({ ...d, website: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-blue-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 z-10">
          <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-lg p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Changes are validated before save
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 font-medium"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save All Changes'}
              {savedAt && (
                <span className="ml-1 text-xs text-blue-100 opacity-90 flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved {savedAt}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
        );
}
