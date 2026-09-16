'use client';

import { useState, useEffect } from 'react';

interface ChatbotConfig {
  enabled: boolean;
  greeting: string;
  logoUrl: string;
  primaryColor: string;
  fallbackMessage: string;
}

interface ChatbotAiStatus {
  enabled: boolean;
  provider: string;
  model: string;
}

const DEFAULT_CONFIG: ChatbotConfig = {
  enabled: true,
  greeting: "Hello, and welcome to Kerchanshe Geely Ethiopia! 👋 I'm the Geely Assistant — I can help with our models, test drives, financing, workshop servicing, genuine parts, promotions, or finding your nearest dealer. What can I help you with today?",
  logoUrl: '/assets/logos/geely-logo.png',
  primaryColor: '#194BFF',
  fallbackMessage: "I couldn't find an answer to that. Our team is happy to help you directly on WhatsApp.",
};

export default function ChatbotSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState<ChatbotConfig>(DEFAULT_CONFIG);
  const [aiStatus, setAiStatus] = useState<ChatbotAiStatus | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchAiStatus();
  }, []);

  async function fetchConfig() {
    try {
      const response = await fetch('/api/settings/chatbot_config');
      if (response.ok) {
        const setting = await response.json();
        const parsed = typeof setting?.value === 'string' ? JSON.parse(setting.value) : setting?.value;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
      // 404 just means it hasn't been saved yet — keep the defaults.
    } catch (error) {
      console.error('Error fetching chatbot config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAiStatus() {
    try {
      const response = await fetch('/api/chatbot/ai-status');
      if (response.ok) setAiStatus(await response.json());
    } catch (error) {
      console.error('Error fetching chatbot AI status:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/settings/chatbot_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: config }),
      });

      if (response.ok) {
        setMessage('Chatbot settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Error saving settings');
      }
    } catch (error) {
      console.error('Error saving chatbot config:', error);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geely-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {aiStatus && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
            aiStatus.enabled ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div>
            <p className="text-sm font-medium">
              AI enhancement: {aiStatus.enabled ? `Active — ${aiStatus.provider} (${aiStatus.model})` : 'Not configured'}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              {aiStatus.enabled
                ? 'The chatbot uses this model to phrase natural replies grounded in real site data.'
                : 'Set GROQ_API_KEY on the backend to enable AI-generated replies — the chatbot still answers from rules and the knowledge base without it.'}
            </p>
          </div>
          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${aiStatus.enabled ? 'bg-green-500' : 'bg-amber-500'}`} />
        </div>
      )}

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.toLowerCase().includes('error')
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Enable Chatbot</label>
              <p className="text-sm text-gray-500 mt-1">Show the chat widget to visitors on the public website</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Greeting Message</label>
            <textarea
              value={config.greeting}
              onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Shown as the bot's first message when a visitor opens the chat</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Fallback Message</label>
            <textarea
              value={config.fallbackMessage}
              onChange={(e) => setConfig({ ...config, fallbackMessage: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Shown when nothing in the knowledge base matches — a WhatsApp button is added automatically</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Logo / Avatar URL</label>
              <input
                type="text"
                value={config.logoUrl}
                onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                placeholder="/assets/logos/geely-logo.png"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="h-10 w-14 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Preview</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-end">
              <div className="w-80 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-3 flex items-center gap-2 text-white" style={{ backgroundColor: config.primaryColor }}>
                  <img src={config.logoUrl} alt="" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
                  <span className="font-semibold text-sm">Geely Assistant</span>
                </div>
                <div className="p-3 text-sm text-gray-700 bg-gray-50">{config.greeting}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end">
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
