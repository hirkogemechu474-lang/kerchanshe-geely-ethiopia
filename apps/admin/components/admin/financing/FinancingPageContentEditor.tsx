'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Layout,
  Landmark,
  Car,
  ListOrdered,
  ShieldCheck,
  Phone,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
  Globe,
} from 'lucide-react';
import {
  mergeFinancingPageContent,
  type FinancingPageContent,
} from '@geely/types';

function mergeDeep<T>(base: T, patch: T): T {
  if (Array.isArray(base) || Array.isArray(patch)) {
    return (patch !== undefined ? (patch as T) : base);
  }
  if (base && patch && typeof base === 'object' && typeof patch === 'object') {
    const out: Record<string, any> = { ...(base as Record<string, any>) };
    for (const key of Object.keys(patch as Record<string, any>)) {
      const b = (base as Record<string, any>)[key];
      const p = (patch as Record<string, any>)[key];
      out[key] = mergeDeep(b, p);
    }
    return out as T;
  }
  return (patch !== undefined && patch !== null ? patch : base);
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export function FinancingPageContentEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<FinancingPageContent>(() => mergeFinancingPageContent(null));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = (id: string) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/financing-page-content');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setContent(mergeFinancingPageContent(data));
          }
        }
      } catch {
        /* fall back to defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = <K extends keyof FinancingPageContent>(key: K, value: FinancingPageContent[K]) => {
    setContent(c => ({ ...c, [key]: mergeDeep(c[key], value) }));
    setErrors([]);
  };

  const setField = (section: keyof FinancingPageContent, field: string, value: string | boolean) => {
    setContent(c => ({
      ...c,
      [section]: { ...(c[section] as any), [field]: value },
    }));
    setErrors([]);
  };

  const updateStep = (index: number, field: 'title' | 'description', value: string) => {
    setContent(c => ({
      ...c,
      stepsSection: {
        ...c.stepsSection,
        steps: c.stepsSection.steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
      },
    }));
  };

  const addStep = () => {
    setContent(c => ({
      ...c,
      stepsSection: {
        ...c.stepsSection,
        steps: [...c.stepsSection.steps, { title: '', description: '' }],
      },
    }));
  };

  const removeStep = (index: number) => {
    setContent(c => ({
      ...c,
      stepsSection: {
        ...c.stepsSection,
        steps: c.stepsSection.steps.filter((_, i) => i !== index),
      },
    }));
  };

  const updateBenefit = (index: number, field: 'title' | 'description', value: string) => {
    setContent(c => ({
      ...c,
      benefitsSection: {
        ...c.benefitsSection,
        benefits: c.benefitsSection.benefits.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
      },
    }));
  };

  const addBenefit = () => {
    setContent(c => ({
      ...c,
      benefitsSection: {
        ...c.benefitsSection,
        benefits: [...c.benefitsSection.benefits, { title: '', description: '' }],
      },
    }));
  };

  const removeBenefit = (index: number) => {
    setContent(c => ({
      ...c,
      benefitsSection: {
        ...c.benefitsSection,
        benefits: c.benefitsSection.benefits.filter((_, i) => i !== index),
      },
    }));
  };

  const validate = () => {
    const errs: string[] = [];
    if (!content.hero.titleLine1.trim()) errs.push('Hero headline is required.');
    if (content.stepsSection.steps.some(s => !s.title.trim())) errs.push('Each Process Step needs a title.');
    if (content.benefitsSection.benefits.some(b => !b.title.trim())) errs.push('Each Benefit needs a title.');
    setErrors(errs);
    return errs.length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/financing-page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        addToast('success', 'Financing page content saved');
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        addToast('error', 'Failed to save financing page content');
      }
    } catch {
      addToast('error', 'Failed to save financing page content');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Reset all financing page content back to the default copy?')) return;
    const defaults = mergeFinancingPageContent(null);
    setContent(defaults);
    setErrors([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <Clock className="animate-spin w-5 h-5" /> Loading financing page content...
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="space-y-6 relative">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg border flex items-start gap-3 ${
              t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Globe className="w-4 h-4" /> Public page: <code className="text-geely-blue bg-blue-50 px-1.5 py-0.5 rounded">/financing</code>
          </div>
          <h2 className="text-xl font-bold">Financing Page Content</h2>
          <p className="text-sm text-gray-600">Edit the copy shown on the public financing page (hero, sections, steps, benefits)</p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved {savedAt}
            </span>
          )}
          {errors.length > 0 && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.length} issue{errors.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => void resetToDefaults()}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw size={16} /> Reset to Default
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Content'}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 space-y-1">
          {errors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-geely-blue to-navy text-white flex items-center justify-center shadow-md shadow-geely-blue/30">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Hero Section</h3>
            <p className="text-sm text-gray-500">Top banner shown on the financing page</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Badge Label</label>
            <input value={content.hero.badge} onChange={e => setField('hero', 'badge', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Kicker (small uppercase)</label>
            <input value={content.hero.kicker} onChange={e => setField('hero', 'kicker', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Headline (line 1)</label>
            <input value={content.hero.titleLine1} onChange={e => setField('hero', 'titleLine1', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Headline (line 2, gold)</label>
            <input value={content.hero.titleLine2} onChange={e => setField('hero', 'titleLine2', e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Subtitle</label>
            <textarea rows={3} value={content.hero.subtitle} onChange={e => setField('hero', 'subtitle', e.target.value)} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Primary Button</label>
            <input value={content.hero.primaryCtaLabel} onChange={e => setField('hero', 'primaryCtaLabel', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Secondary Button</label>
            <input value={content.hero.secondaryCtaLabel} onChange={e => setField('hero', 'secondaryCtaLabel', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Banks section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Bank Selection Section</h3>
            <p className="text-sm text-gray-500">Intro above the grid of partner banks</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Kicker</label>
            <input value={content.banksSection.kicker} onChange={e => setField('banksSection', 'kicker', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input value={content.banksSection.title} onChange={e => setField('banksSection', 'title', e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Subtitle</label>
            <textarea rows={2} value={content.banksSection.subtitle} onChange={e => setField('banksSection', 'subtitle', e.target.value)} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Empty State Title</label>
            <input value={content.banksSection.emptyStateTitle} onChange={e => setField('banksSection', 'emptyStateTitle', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Empty State Body</label>
            <input value={content.banksSection.emptyStateBody} onChange={e => setField('banksSection', 'emptyStateBody', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Help Panel Title</label>
            <input value={content.banksSection.helpPanelTitle} onChange={e => setField('banksSection', 'helpPanelTitle', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Help Panel Button</label>
            <input value={content.banksSection.helpPanelCtaLabel} onChange={e => setField('banksSection', 'helpPanelCtaLabel', e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Help Panel Body</label>
            <textarea rows={2} value={content.banksSection.helpPanelBody} onChange={e => setField('banksSection', 'helpPanelBody', e.target.value)} className={`${inputCls} resize-none`} />
          </div>
        </div>
      </div>

      {/* Vehicles section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Vehicle Selection Section</h3>
            <p className="text-sm text-gray-500">Intro above the grid of available models</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Kicker</label>
            <input value={content.vehiclesSection.kicker} onChange={e => setField('vehiclesSection', 'kicker', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input value={content.vehiclesSection.title} onChange={e => setField('vehiclesSection', 'title', e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Subtitle</label>
            <textarea rows={2} value={content.vehiclesSection.subtitle} onChange={e => setField('vehiclesSection', 'subtitle', e.target.value)} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Card Button Label</label>
            <input value={content.vehiclesSection.ctaLabel} onChange={e => setField('vehiclesSection', 'ctaLabel', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Empty State</label>
            <input value={content.vehiclesSection.emptyState} onChange={e => setField('vehiclesSection', 'emptyState', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Price On Request Label</label>
            <input value={content.vehiclesSection.priceOnRequest} onChange={e => setField('vehiclesSection', 'priceOnRequest', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Steps section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <ListOrdered className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Purchase Journey Steps</h3>
              <p className="text-sm text-gray-500">The numbered process steps</p>
            </div>
          </div>
          <button onClick={addStep} className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus size={16} /> Add Step
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Kicker</label>
            <input value={content.stepsSection.kicker} onChange={e => setField('stepsSection', 'kicker', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input value={content.stepsSection.title} onChange={e => setField('stepsSection', 'title', e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Subtitle</label>
            <textarea rows={2} value={content.stepsSection.subtitle} onChange={e => setField('stepsSection', 'subtitle', e.target.value)} className={`${inputCls} resize-none`} />
          </div>
        </div>
        <div className="space-y-3">
          {content.stepsSection.steps.map((step, index) => (
            <div key={index} className="relative border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-navy text-white flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="font-semibold text-gray-800">Step {index + 1}</div>
                </div>
                <button onClick={() => removeStep(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={step.title} onChange={e => updateStep(index, 'title', e.target.value)} placeholder="Step title" className={inputCls} />
                <input value={step.description} onChange={e => updateStep(index, 'description', e.target.value)} placeholder="Step description" className={inputCls} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Benefits</h3>
              <p className="text-sm text-gray-500">The confidence points shown on the dark band</p>
            </div>
          </div>
          <button onClick={addBenefit} className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Plus size={16} /> Add Benefit
          </button>
        </div>
        <div>
          <label className={labelCls}>Section Title</label>
          <input value={content.benefitsSection.title} onChange={e => setField('benefitsSection', 'title', e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-3">
          {content.benefitsSection.benefits.map((benefit, index) => (
            <div key={index} className="relative border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-semibold text-gray-800">Benefit {index + 1}</div>
                <button onClick={() => removeBenefit(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={benefit.title} onChange={e => updateBenefit(index, 'title', e.target.value)} placeholder="Benefit title" className={inputCls} />
                <input value={benefit.description} onChange={e => updateBenefit(index, 'description', e.target.value)} placeholder="Benefit description" className={inputCls} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/30">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Contact Strip</h3>
            <p className="text-sm text-gray-500">Bottom call-to-action band (shown when enabled)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Title</label>
            <input value={content.contactStrip.title} onChange={e => setField('contactStrip', 'title', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Button ("Contact Us")</label>
            <input value={content.contactStrip.callLabel} onChange={e => setField('contactStrip', 'callLabel', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Secondary Button ("Quote")</label>
            <input value={content.contactStrip.ctaLabel} onChange={e => setField('contactStrip', 'ctaLabel', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Enable Contact Strip</label>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={content.contactStrip.enabled} onChange={e => setField('contactStrip', 'enabled', e.target.checked)} className="rounded text-teal-500 focus:ring-teal-500" />
              <span className="text-sm font-medium text-gray-700">Show on page</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Body</label>
            <textarea rows={2} value={content.contactStrip.body} onChange={e => setField('contactStrip', 'body', e.target.value)} className={`${inputCls} resize-none`} />
          </div>
        </div>
      </div>
    </div>
  );
}
