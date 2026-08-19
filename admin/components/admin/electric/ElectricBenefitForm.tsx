'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Save, X, Plus, Calculator, HelpCircle } from 'lucide-react';
import { Button } from '@/components/admin/ui';

interface BenefitPage {
  id: string;
  title: string;
  slug: string;
  benefitType: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  sections: any[];
  description: string;
  isPublished: boolean;
}

interface CalculatorDefaults {
  monthlyDistance: number;
  fuelPrice: number;
  electricityCost: number;
  petrolEfficiency: number;
  evEfficiency: number;
}

interface CalculatorFaq {
  q: string;
  a: string;
}

interface ElectricBenefitFormProps {
  benefitId?: string;
  benefitType: 'cost-calculator' | 'government-incentives' | 'environmental-impact';
}

const BENEFIT_DEFAULTS = {
  'cost-calculator': {
    title: 'Cost Calculator',
    slug: 'cost-calculator',
    heroTitle: 'Calculate Your Savings',
    heroSubtitle: 'DISCOVER HOW MUCH YOU\'LL SAVE',
  },
  'government-incentives': {
    title: 'Government Incentives',
    slug: 'government-incentives',
    heroTitle: 'Government Incentives & Support',
    heroSubtitle: 'TAX BENEFITS AND SUBSIDIES',
  },
  'environmental-impact': {
    title: 'Environmental Impact',
    slug: 'environmental-impact',
    heroTitle: 'Reduce Your Carbon Footprint',
    heroSubtitle: 'ENVIRONMENTAL BENEFITS',
  },
};

const DEFAULT_CALCULATOR_DEFAULTS: CalculatorDefaults = {
  monthlyDistance: 1500,
  fuelPrice: 70,
  electricityCost: 3,
  petrolEfficiency: 12,
  evEfficiency: 6,
};

const DEFAULT_CALCULATOR_FAQS: CalculatorFaq[] = [
  {
    q: 'How are the annual fuel costs calculated?',
    a: 'Annual fuel costs are calculated by taking your monthly driving distance, multiplying by 12 to get annual distance, then dividing by your petrol vehicle efficiency (km/l) to get total liters consumed per year, and finally multiplying by the current fuel price per liter.',
  },
  {
    q: 'Why is electricity so much cheaper than petrol?',
    a: 'Electric motors are far more efficient than internal combustion engines — typically 85-90% efficient vs 20-30% for petrol engines. Additionally, electricity tariffs in Ethiopia are heavily subsidized and stable compared to volatile global oil prices.',
  },
];

export default function ElectricBenefitForm({ benefitId, benefitType }: ElectricBenefitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!benefitId);
  const [submitting, setSubmitting] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [calculatorDefaults, setCalculatorDefaults] = useState<CalculatorDefaults>(
    DEFAULT_CALCULATOR_DEFAULTS
  );
  const [calculatorFaqs, setCalculatorFaqs] = useState<CalculatorFaq[]>(DEFAULT_CALCULATOR_FAQS);
  const [newFaq, setNewFaq] = useState<CalculatorFaq>({ q: '', a: '' });

  const defaults = BENEFIT_DEFAULTS[benefitType];

  const [formData, setFormData] = useState<BenefitPage>({
    id: '',
    title: defaults.title,
    slug: defaults.slug,
    benefitType,
    heroTitle: defaults.heroTitle,
    heroSubtitle: defaults.heroSubtitle,
    heroImage: '',
    sections: [],
    description: '',
    isPublished: true,
  });

  useEffect(() => {
    if (benefitId) {
      fetchBenefit();
    }
  }, [benefitId]);

  const fetchBenefit = async () => {
    try {
      const response = await fetch(`/api/admin/electric/benefits/${benefitId}`);
      const data = await response.json();
      setFormData(data.benefit);
      setHeroImage(data.benefit.heroImage || '');

      if (benefitType === 'cost-calculator' && data.benefit.metadata) {
        const meta =
          typeof data.benefit.metadata === 'string'
            ? JSON.parse(data.benefit.metadata)
            : data.benefit.metadata;
        if (meta.calculator) {
          if (meta.calculator.defaults) {
            setCalculatorDefaults({
              ...DEFAULT_CALCULATOR_DEFAULTS,
              ...meta.calculator.defaults,
            });
          }
          if (Array.isArray(meta.calculator.faqs) && meta.calculator.faqs.length > 0) {
            setCalculatorFaqs(meta.calculator.faqs);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching benefit:', error);
      alert('Failed to load benefit page');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
      alert('Failed to upload image');
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
    setSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        heroImage,
        ...(benefitType === 'cost-calculator' && {
          metadata: {
            calculator: {
              defaults: calculatorDefaults,
              faqs: calculatorFaqs,
            },
          },
        }),
      };

      const url = benefitId
        ? `/api/admin/electric/benefits/${benefitId}`
        : '/api/admin/electric/benefits';

      const method = benefitId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        router.push('/admin/electric');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save benefit page');
      }
    } catch (error) {
      console.error('Error saving benefit:', error);
      alert('Failed to save benefit page');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading benefit page...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Content */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h3>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle/Badge *</label>
          <input
            type="text"
            name="heroSubtitle"
            value={formData.heroSubtitle}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., TAX BENEFITS AND SUBSIDIES"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title *</label>
          <input
            type="text"
            name="heroTitle"
            value={formData.heroTitle}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Government Incentives & Support"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the page content"
          />
        </div>

        {/* Hero Image */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Image</h3>
          {heroImage ? (
            <div className="relative w-full h-64 rounded-lg overflow-hidden mb-3">
              <img
                src={heroImage}
                alt="Hero"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {uploadingImage ? 'Uploading...' : 'Click to upload hero image'}
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Publishing */}
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

      {/* Calculator Settings - only for cost-calculator */}
      {benefitType === 'cost-calculator' && (
        <div className="border-t pt-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calculator className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Calculator Settings</h3>
              <p className="text-sm text-gray-500">
                Default values shown in the interactive calculator on the public site
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Distance (km)
              </label>
              <input
                type="number"
                min={100}
                max={5000}
                step={50}
                value={calculatorDefaults.monthlyDistance}
                onChange={(e) =>
                  setCalculatorDefaults(prev => ({
                    ...prev,
                    monthlyDistance: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Price (ETB/L)
              </label>
              <input
                type="number"
                min={30}
                max={150}
                step={1}
                value={calculatorDefaults.fuelPrice}
                onChange={(e) =>
                  setCalculatorDefaults(prev => ({
                    ...prev,
                    fuelPrice: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Electricity Cost (ETB/kWh)
              </label>
              <input
                type="number"
                min={1}
                max={15}
                step={0.5}
                value={calculatorDefaults.electricityCost}
                onChange={(e) =>
                  setCalculatorDefaults(prev => ({
                    ...prev,
                    electricityCost: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Petrol Efficiency (km/l)
              </label>
              <input
                type="number"
                min={5}
                max={25}
                step={1}
                value={calculatorDefaults.petrolEfficiency}
                onChange={(e) =>
                  setCalculatorDefaults(prev => ({
                    ...prev,
                    petrolEfficiency: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EV Efficiency (km/kWh)
              </label>
              <input
                type="number"
                min={3}
                max={12}
                step={0.5}
                value={calculatorDefaults.evEfficiency}
                onChange={(e) =>
                  setCalculatorDefaults(prev => ({
                    ...prev,
                    evEfficiency: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCalculatorDefaults(DEFAULT_CALCULATOR_DEFAULTS);
                  setCalculatorFaqs(DEFAULT_CALCULATOR_FAQS);
                }}
              >
                Reset to Defaults
              </Button>
            </div>
          </div>

          {/* FAQs Editor */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h3>
                <p className="text-sm text-gray-500">
                  Shown in the FAQ section of the cost calculator page
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {calculatorFaqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Question {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCalculatorFaqs(calculatorFaqs.filter((_, i) => i !== index))
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.q}
                    onChange={(e) =>
                      setCalculatorFaqs(prev =>
                        prev.map((f, i) => (i === index ? { ...f, q: e.target.value } : f))
                      )
                    }
                    placeholder="Question"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    value={faq.a}
                    onChange={(e) =>
                      setCalculatorFaqs(prev =>
                        prev.map((f, i) => (i === index ? { ...f, a: e.target.value } : f))
                      )
                    }
                    placeholder="Answer"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}

              {/* Add new FAQ */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium text-gray-700">Add a new question</div>
                <input
                  type="text"
                  value={newFaq.q}
                  onChange={(e) => setNewFaq(prev => ({ ...prev, q: e.target.value }))}
                  placeholder="Question"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  value={newFaq.a}
                  onChange={(e) => setNewFaq(prev => ({ ...prev, a: e.target.value }))}
                  placeholder="Answer"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newFaq.q.trim() || !newFaq.a.trim()) {
                      alert('Please fill in both question and answer');
                      return;
                    }
                    setCalculatorFaqs(prev => [...prev, newFaq]);
                    setNewFaq({ q: '', a: '' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <Button type="submit" disabled={submitting}>
          <Save className="w-4 h-4" />
          {submitting ? 'Saving...' : 'Save Benefit Page'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
