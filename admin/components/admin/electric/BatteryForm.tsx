'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Save, X, Image as ImageIcon } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

interface Section {
  id: string;
  title: string;
  content: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface BatteryFormProps {
  onSave?: () => void;
}

export default function BatteryForm({ onSave }: BatteryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');

  const sectionOrder = [
    'technology', 'capacity', 'range', 'charging', 'lifespan',
    'warranty', 'safety', 'maintenance', 'recycling', 'faq'
  ];

  const sectionTitles: Record<string, string> = {
    technology: 'Battery Technology',
    capacity: 'Capacity & Specifications',
    range: 'Range Performance',
    charging: 'Charging Time',
    lifespan: 'Battery Lifespan',
    warranty: 'Warranty Coverage',
    safety: 'Safety Features',
    maintenance: 'Maintenance Tips',
    recycling: 'Recycling & Sustainability',
    faq: 'FAQ (Frequently Asked Questions)'
  };

  const [formData, setFormData] = useState({
    heroTitle: '',
    heroSubtitle: '',
    content: '',
    sections: sectionOrder.map(id => ({
      id,
      title: sectionTitles[id] || '',
      content: ''
    })),
    faqs: [
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' },
      { question: '', answer: '' }
    ],
    isPublished: true
  });

  useEffect(() => {
    fetchBatteryPage();
  }, []);

  const fetchBatteryPage = async () => {
    try {
      const response = await fetch('/api/admin/electric/battery');
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || '',
          heroImage: data.heroImage || '',
          content: data.content || '',
          sections: data.sections || sectionOrder.map(id => ({
            id,
            title: sectionTitles[id] || '',
            content: ''
          })),
          faqs: data.faqs || [
            { question: '', answer: '' },
            { question: '', answer: '' },
            { question: '', answer: '' },
            { question: '', answer: '' },
            { question: '', answer: '' }
          ],
          isPublished: data.isPublished ?? true
        }));
        if (data.heroImage) setHeroImage(data.heroImage);
      }
    } catch (error) {
      console.error('Error fetching battery page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    formDataToSend.append('category', 'electric-benefits');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.file?.url) {
        setHeroImage(data.file.url);
        setFormData(prev => ({ ...prev, heroImage: data.file.url }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setHeroImage('');
    setFormData(prev => ({ ...prev, heroImage: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const dataToSend = {
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        heroImage: heroImage,
        content: formData.content,
        sections: formData.sections,
        faqs: formData.faqs.filter(faq => faq.question || faq.answer),
        isPublished: formData.isPublished
      };

      const response = await fetch('/api/admin/electric/battery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setMessage('Battery page saved successfully!');
        setTimeout(() => {
          setMessage('');
          onSave?.();
        }, 2000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to save battery page');
      }
    } catch (error) {
      console.error('Error saving battery page:', error);
      setMessage('Failed to save battery page');
    } finally {
      setSaving(false);
    }
  };

  const handleSectionChange = (index: number, field: 'content', value: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const handleFAQChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  const addFAQ = () => {
    if (formData.faqs.length < 10) {
      setFormData(prev => ({
        ...prev,
        faqs: [...prev.faqs, { question: '', answer: '' }]
      }));
    }
  };

  const removeFAQ = (index: number) => {
    if (formData.faqs.length > 1) {
      setFormData(prev => ({
        ...prev,
        faqs: prev.faqs.filter((_, i) => i !== index)
      }));
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading battery page...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hero Section */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h3>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title *</label>
          <input
            type="text"
            value={formData.heroTitle}
            onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Advanced Battery Technology"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
          <input
            type="text"
            value={formData.heroSubtitle}
            onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Power, Performance, and Peace of Mind"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Geely electric vehicles are powered by advanced lithium-ion battery technology..."
          />
        </div>

        {/* Hero Image */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Image</h3>
          <FileUpload
            value={heroImage || undefined}
            onChange={(v) => { setHeroImage(v as string); setFormData(prev => ({ ...prev, heroImage: v as string })); }}
            label="battery page hero"
            previewHeight="h-40"
            helperText="Recommended: 1920x1080px, max 10MB"
          />
        </div>

        {/* Sections */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Sections (10 Required)</h3>
        </div>

        {formData.sections.map((section, index) => (
          <div key={section.id} className="lg:col-span-2 bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                {index + 1}. {section.title}
              </h4>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
                ID: {section.id}
              </span>
            </div>
            <textarea
              value={section.content}
              onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Describe ${section.title.toLowerCase()}...`}
            />
          </div>
        ))}

        {/* FAQs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">FAQ (Frequently Asked Questions)</h3>
            <button
              type="button"
              onClick={addFAQ}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add FAQ
            </button>
          </div>

          {formData.faqs.map((faq, index) => (
            <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex items-start gap-4">
                <span className="text-sm font-medium text-gray-500 mt-1">Q{index + 1}</span>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="How long does the battery last?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Answer</label>
                    <textarea
                      value={faq.answer}
                      onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="The battery is designed to retain over 80% capacity after 8 years..."
                    />
                  </div>
                  {formData.faqs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFAQ(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="lg:col-span-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Publish this page</span>
          </label>
        </div>
      </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Battery Page'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}