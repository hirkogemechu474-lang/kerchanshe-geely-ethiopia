'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Search, CheckCircle2, Sparkles } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type SeoSettings = {
  defaultMetaTitle: string;
  defaultMetaTitleTemplate: string;
  defaultMetaDescription: string;
  ogImageUrl: string;
  twitterHandle: string;
  defaultKeywords: string;
  googleAnalyticsId: string;
  googleSiteVerification: string;
  facebookPixelId: string;
  robotsExtra: string;
};

const DEFAULT_SEO_SETTINGS: SeoSettings = {
  defaultMetaTitle: '',
  defaultMetaTitleTemplate: '',
  defaultMetaDescription: '',
  ogImageUrl: '',
  twitterHandle: '',
  defaultKeywords: '',
  googleAnalyticsId: '',
  googleSiteVerification: '',
  facebookPixelId: '',
  robotsExtra: '',
};

export default function SeoSettingsPage() {
  useAdminAuth('canManageSettings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SeoSettings>(DEFAULT_SEO_SETTINGS);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/seo-settings');
        if (res.ok) {
          const json = await res.json();
          setSettings({ ...DEFAULT_SEO_SETTINGS, ...json });
        }
      } catch {
        setSettings(DEFAULT_SEO_SETTINGS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (field: keyof SeoSettings, value: string) => {
    setSettings((s) => ({ ...s, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/seo-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        alert('Failed to save SEO settings');
      }
    } catch {
      alert('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <Sparkles className="animate-spin w-5 h-5" /> Loading SEO settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
          <h1 className="text-2xl font-bold">SEO Settings</h1>
          <p className="text-gray-600">
            Site-wide default metadata, social sharing, and analytics/tracking IDs used across the public site
            (apps/web). Pages that already set their own specific title/description keep taking precedence — these
            are only the fallback defaults.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
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

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <Search className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">Default Meta Tags</h2>
              <p className="text-cyan-100 text-sm">Used when a page doesn't set its own title/description</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Meta Title</label>
              <input
                type="text"
                value={settings.defaultMetaTitle}
                onChange={(e) => update('defaultMetaTitle', e.target.value)}
                placeholder="Geely Ethiopia | Official Distributor by Kerchanshe Group Geely"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title Template</label>
              <input
                type="text"
                value={settings.defaultMetaTitleTemplate}
                onChange={(e) => update('defaultMetaTitleTemplate', e.target.value)}
                placeholder="%s | Geely Ethiopia"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. Use <code className="bg-gray-100 px-1 rounded">%s</code> as a placeholder for a page's own title.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Meta Description</label>
            <textarea
              value={settings.defaultMetaDescription}
              onChange={(e) => update('defaultMetaDescription', e.target.value)}
              rows={3}
              placeholder="Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles, discover global engineering built for Ethiopian roads."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Keywords</label>
            <input
              type="text"
              value={settings.defaultKeywords}
              onChange={(e) => update('defaultKeywords', e.target.value)}
              placeholder="Geely Ethiopia, Geely cars, SUV Ethiopia, Electric vehicles Ethiopia"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Comma-separated.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Social Sharing (Open Graph / Twitter)</h2>
          <p className="text-sm text-gray-500">How links to the site look when shared on social platforms</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default OG Image URL</label>
            <input
              type="text"
              value={settings.ogImageUrl}
              onChange={(e) => update('ogImageUrl', e.target.value)}
              placeholder="https://geelyethiopia.com/og-image.jpg"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Twitter / X Handle</label>
            <input
              type="text"
              value={settings.twitterHandle}
              onChange={(e) => update('twitterHandle', e.target.value)}
              placeholder="@geelyethiopia"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Analytics &amp; Verification</h2>
          <p className="text-sm text-gray-500">
            When set, these are injected site-wide on apps/web (Google Analytics 4 and Meta Pixel scripts load only
            when a value is present).
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics 4 ID</label>
              <input
                type="text"
                value={settings.googleAnalyticsId}
                onChange={(e) => update('googleAnalyticsId', e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook / Meta Pixel ID</label>
              <input
                type="text"
                value={settings.facebookPixelId}
                onChange={(e) => update('facebookPixelId', e.target.value)}
                placeholder="1234567890123456"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Google Search Console Verification Code</label>
            <input
              type="text"
              value={settings.googleSiteVerification}
              onChange={(e) => update('googleSiteVerification', e.target.value)}
              placeholder="abcXYZ123..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Just the verification token from the HTML tag method (Search Console → Settings → Ownership
              verification), not the full <code className="bg-gray-100 px-1 rounded">&lt;meta&gt;</code> tag.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Extra robots.txt Rules</label>
            <textarea
              value={settings.robotsExtra}
              onChange={(e) => update('robotsExtra', e.target.value)}
              rows={3}
              placeholder={'Disallow: /some-private-path/\nAllow: /some-private-path/public-file.pdf'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional. One <code className="bg-gray-100 px-1 rounded">Allow:</code>/<code className="bg-gray-100 px-1 rounded">Disallow:</code> directive per line, merged into the site's generated robots.txt.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
        This page is the real, working home for the Google Analytics 4 ID and Facebook/Meta Pixel ID values also
        shown (non-functionally) on the "Third-Party API Keys" card on the main Settings page — that card's Save
        button doesn't do anything yet, so use this page instead.
      </div>
    </div>
  );
}
