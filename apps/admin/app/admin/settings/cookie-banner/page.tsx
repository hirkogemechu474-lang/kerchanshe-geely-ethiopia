'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface CookieBannerConfig {
  enabled: boolean;
  title: string;
  description: string;
  acceptText: string;
  declineText: string;
  policyLink: string;
}

export default function CookieBannerSettingsPage() {
  useAdminAuth('canManageSettings');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [config, setConfig] = useState<CookieBannerConfig>({
    enabled: true,
    title: 'We Value Your Privacy',
    description: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
    acceptText: 'Accept All',
    declineText: 'Decline',
    policyLink: '/cookies'
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const response = await fetch('/api/settings/cookie-banner');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching cookie banner config:', error);
      setMessage('Error loading configuration');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings/cookie-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage('Cookie banner settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Error saving settings');
      }
    } catch (error) {
      console.error('Error saving cookie banner config:', error);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geely-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cookie Consent Banner</h1>
        <p className="text-gray-600 mt-1">
          Manage the cookie consent banner displayed to website visitors
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Error') || message.includes('error')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6 space-y-6">
          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Enable Cookie Banner
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Show the cookie consent banner to new visitors
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Banner Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="We Value Your Privacy"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="We use cookies to enhance your browsing experience..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Explain why you use cookies and how they benefit the user
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accept Button Text */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Accept Button Text
              </label>
              <input
                type="text"
                value={config.acceptText}
                onChange={(e) => setConfig({ ...config, acceptText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                placeholder="Accept All"
                required
              />
            </div>

            {/* Decline Button Text */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Decline Button Text
              </label>
              <input
                type="text"
                value={config.declineText}
                onChange={(e) => setConfig({ ...config, declineText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                placeholder="Decline"
                required
              />
            </div>
          </div>

          {/* Policy Link */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Cookie Policy Link
            </label>
            <input
              type="text"
              value={config.policyLink}
              onChange={(e) => setConfig({ ...config, policyLink: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="/cookies"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Link to your cookie policy page (usually /cookies or /privacy)
            </p>
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {config.title}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {config.description}{' '}
                  <span className="text-geely-blue underline cursor-pointer">
                    Learn more
                  </span>
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                  >
                    {config.declineText}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-geely-blue rounded-lg"
                  >
                    {config.acceptText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-geely-blue rounded-lg hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
