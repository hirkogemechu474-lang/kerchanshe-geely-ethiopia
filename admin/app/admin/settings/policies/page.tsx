'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, FileText, Shield, Cookie } from 'lucide-react';

export default function PoliciesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  const [policies, setPolicies] = useState({
    privacy: '',
    terms: '',
    cookies: ''
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/settings/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies({
          privacy: data.privacy_policy?.content || '',
          terms: data.terms_of_service?.content || '',
          cookies: data.cookie_policy?.content || ''
        });
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policies)
      });

      if (response.ok) {
        alert('Policies saved successfully!');
      } else {
        alert('Failed to save policies');
      }
    } catch (error) {
      console.error('Error saving policies:', error);
      alert('Failed to save policies');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: 'privacy' | 'terms' | 'cookies', value: string) => {
    setPolicies(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'cookies', label: 'Cookie Policy', icon: Cookie }
  ] as const;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Legal Policies</h1>
            <p className="text-gray-600">Manage your Privacy Policy, Terms of Service, and Cookie Policy</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border">
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Privacy Policy */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">Privacy Policy</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    This policy will be displayed on the /privacy page. Use clear language to explain how you collect, use, and protect user data.
                  </p>
                </div>
                <textarea
                  value={policies.privacy}
                  onChange={(e) => handleChange('privacy', e.target.value)}
                  placeholder="Enter your privacy policy here..."
                  className="w-full h-96 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">💡 What to Include:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• What information you collect (name, email, phone, etc.)</li>
                    <li>• How you use the information</li>
                    <li>• How you protect user data</li>
                    <li>• Third-party services and cookies</li>
                    <li>• User rights (access, deletion, correction)</li>
                    <li>• Contact information for privacy concerns</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Terms of Service */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">Terms of Service</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    This policy will be displayed on the /terms page. Define the rules and conditions for using your website.
                  </p>
                </div>
                <textarea
                  value={policies.terms}
                  onChange={(e) => handleChange('terms', e.target.value)}
                  placeholder="Enter your terms of service here..."
                  className="w-full h-96 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">💡 What to Include:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Acceptance of terms</li>
                    <li>• User responsibilities</li>
                    <li>• Prohibited activities</li>
                    <li>• Vehicle pricing and availability</li>
                    <li>• Test drive and quotation terms</li>
                    <li>• Limitation of liability</li>
                    <li>• Dispute resolution</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Cookie Policy */}
            {activeTab === 'cookies' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">Cookie Policy</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    This policy will be displayed on the /cookies page. Explain what cookies you use and why.
                  </p>
                </div>
                <textarea
                  value={policies.cookies}
                  onChange={(e) => handleChange('cookies', e.target.value)}
                  placeholder="Enter your cookie policy here..."
                  className="w-full h-96 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">💡 What to Include:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• What are cookies</li>
                    <li>• Types of cookies you use (essential, analytics, marketing)</li>
                    <li>• Third-party cookies (Google Analytics, etc.)</li>
                    <li>• How users can manage cookies</li>
                    <li>• Browser settings for blocking cookies</li>
                    <li>• Impact of disabling cookies</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-3">⚠️ Important Legal Notes</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>• These policies should be reviewed by a legal professional</li>
            <li>• Update policies whenever you change data collection practices</li>
            <li>• Make sure policies comply with Ethiopian and international laws</li>
            <li>• Include the last updated date in each policy</li>
            <li>• Notify users of policy changes via email</li>
          </ul>
        </div>
      </div>
  );
}
