'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Facebook, Instagram, Twitter, Youtube, Linkedin, Music, ExternalLink } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function SocialMediaPage() {
  useAdminAuth('canManageContent');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    linkedin: '',
    tiktok: ''
  });

  useEffect(() => {
    fetchSocialMedia();
  }, []);

  const fetchSocialMedia = async () => {
    try {
      const response = await fetch('/api/settings/social-media');
      if (response.ok) {
        const data = await response.json();
        setSocialMedia(data);
      }
    } catch (error) {
      console.error('Error fetching social media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialMedia)
      });

      if (response.ok) {
        alert('Social media links saved successfully!');
      } else {
        alert('Failed to save social media links');
      }
    } catch (error) {
      console.error('Error saving social media:', error);
      alert('Failed to save social media links');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (platform: keyof typeof socialMedia, value: string) => {
    setSocialMedia(prev => ({ ...prev, [platform]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-geely-blue',
      bgColor: 'bg-blue-50',
      placeholder: 'https://facebook.com/geelyethiopia',
      example: 'https://facebook.com/YourPage'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      placeholder: 'https://instagram.com/geelyethiopia',
      example: 'https://instagram.com/YourProfile'
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: Twitter,
      color: 'text-blue-400',
      bgColor: 'bg-blue-50',
      placeholder: 'https://twitter.com/geelyethiopia',
      example: 'https://twitter.com/YourHandle'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      placeholder: 'https://youtube.com/@geelyethiopia',
      example: 'https://youtube.com/@YourChannel'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      placeholder: 'https://linkedin.com/company/geely-ethiopia',
      example: 'https://linkedin.com/company/YourCompany'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Music,
      color: 'text-black',
      bgColor: 'bg-gray-50',
      placeholder: 'https://tiktok.com/@geelyethiopia',
      example: 'https://tiktok.com/@YourAccount'
    }
  ] as const;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Social Media Links</h1>
            <p className="text-gray-600">Manage your social media profiles and links</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-geely-blue text-white px-6 py-3 rounded-lg hover:bg-navy disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Links'}
          </button>
        </div>

        {/* Social Media Links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const value = socialMedia[platform.id as keyof typeof socialMedia];
            
            return (
              <div key={platform.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={platform.color} size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{platform.name}</h3>
                    <p className="text-sm text-gray-500">Connect your {platform.name} page</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile URL
                    </label>
                    <input
                      type="url"
                      value={value}
                      onChange={(e) => handleChange(platform.id as keyof typeof socialMedia, e.target.value)}
                      placeholder={platform.placeholder}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Example: {platform.example}</span>
                    {value && (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-geely-blue hover:text-navy"
                      >
                        Test Link <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {value && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-800">Active - Will appear on website</span>
                    </div>
                  )}

                  {!value && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Not set - Hidden from website</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-bold text-lg mb-4">Preview - Website Footer</h3>
          <p className="text-gray-600 text-sm mb-4">
            This is how your social media links will appear in the footer:
          </p>
          
          <div className="bg-gray-900 text-white rounded-lg p-6">
            <div className="flex items-center gap-4">
              <span className="text-blue-200 text-sm">Follow us:</span>
              <div className="flex items-center gap-3">
                {Object.entries(socialMedia).map(([platform, url]) => {
                  if (!url) return null;
                  
                  const platformData = platforms.find(p => p.id === platform);
                  if (!platformData) return null;
                  
                  const Icon = platformData.icon;
                  
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-100 hover:text-gold transition-colors"
                      title={platformData.name}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
                
                {Object.values(socialMedia).every(url => !url) && (
                  <span className="text-gray-400 text-sm">No social media links configured</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 Best Practices</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Use the full URL including https://</li>
            <li>• Make sure the links lead to your official business pages</li>
            <li>• Test each link after saving to ensure they work correctly</li>
            <li>• Keep your social media profiles active and regularly updated</li>
            <li>• Use consistent branding across all platforms</li>
            <li>• Only show social media platforms you actively use</li>
          </ul>
        </div>

        {/* Statistics (Optional) */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-bold text-lg mb-4">Active Platforms</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isActive = !!socialMedia[platform.id as keyof typeof socialMedia];
              
              return (
                <div
                  key={platform.id}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                    isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Icon className={isActive ? 'text-green-600' : 'text-gray-400'} size={24} />
                  <span className={`text-xs font-medium ${isActive ? 'text-green-800' : 'text-gray-500'}`}>
                    {platform.name}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}
