'use client';

import { useEffect, useState } from 'react';
import { Upload, X, Plus, Save } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from './ImageUpload';
import SpecificationsEditor from './SpecificationsEditor';
import PricingEditor from './PricingEditor';
import InventoryManager from './InventoryManager';
import { withBasePath } from '@/lib/basePath';

interface VehicleFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  /** Opens the wizard directly on this step (e.g. deep-linked from Gallery & Videos or Vehicle Sections). */
  initialStep?: number;
}

interface VehicleCategoryOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

const EMPTY_SPECIFICATIONS = {
  engine: { type: '', displacement: '', power: '', torque: '', transmission: '', drivetrain: '', fuelType: '', fuelEconomy: '' },
  dimensions: { length: '', width: '', height: '', wheelbase: '', groundClearance: '', curbWeight: '', seatingCapacity: '', cargoVolume: '' },
  features: { infotainment: '', connectivity: '', climate: '', seats: '', lighting: '', wheels: '' },
  safety: { airbags: '', abs: '', esc: '', tpms: '', cameras: '', sensors: '', adas: '' },
  warranty: { basic: '', powertrain: '', corrosion: '', roadside: '', maintenance: '' },
};

function normalizeRecord(source: any, defaults: any): any {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const value = source?.[key];
      if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) {
        return [key, normalizeRecord(value, fallback)];
      }
      return [key, value === null || value === undefined ? fallback : String(value)];
    })
  );
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizePricing(vehicle: any) {
  const pricing = vehicle?.pricing ?? {};
  return {
    basePrice: numberValue(pricing.basePrice ?? vehicle?.basePrice),
    currency: String(pricing.currency ?? 'ETB'),
    discount: numberValue(pricing.discount ?? vehicle?.discountAmount),
    discountType: String(pricing.discountType ?? vehicle?.discountType ?? 'percentage'),
    taxRate: numberValue(pricing.taxRate ?? vehicle?.taxRate, 15),
    includesTax: Boolean(pricing.includesTax ?? false),
    hidePrice: Boolean(pricing.hidePrice ?? vehicle?.hidePrice ?? false),
    financingAvailable: pricing.financingAvailable !== false,
    minDownPayment: numberValue(pricing.minDownPayment, 20),
    dealerIncentive: numberValue(pricing.dealerIncentive),
  };
}

function normalizeInventory(vehicle: any) {
  const inventory = vehicle?.inventory ?? {};
  return {
    stock: numberValue(inventory.stock ?? vehicle?.stock),
    lowStockThreshold: numberValue(inventory.lowStockThreshold, 5),
    sku: String(inventory.sku ?? vehicle?.sku ?? ''),
    location: String(inventory.location ?? vehicle?.location ?? ''),
    warehouseLocation: String(inventory.warehouseLocation ?? vehicle?.warehouse ?? ''),
    reorderPoint: numberValue(inventory.reorderPoint ?? vehicle?.reorderPoint, 3),
    maxStock: numberValue(inventory.maxStock, 50),
    reservedStock: numberValue(inventory.reservedStock),
    availableStock: numberValue(inventory.availableStock ?? vehicle?.stock),
    incomingStock: numberValue(inventory.incomingStock),
    expectedDate: String(inventory.expectedDate ?? ''),
  };
}

export default function VehicleForm({ mode, initialData, initialStep }: VehicleFormProps) {
  const [currentStep, setCurrentStep] = useState(initialStep && initialStep >= 1 && initialStep <= 5 ? initialStep : 1);
  const [categories, setCategories] = useState<VehicleCategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Basic Information
    name: initialData?.name ?? '',
    model: initialData?.model ?? '',
    year: initialData?.year ?? new Date().getFullYear(),
    categoryId: initialData?.categoryId ?? '',
    category: initialData?.category ?? '',
    description: initialData?.description ?? '',
    
    // Images
    images: Array.isArray(initialData?.images) ? initialData.images.filter((image: unknown): image is string => typeof image === 'string') : [],
    heroImageUrl: initialData?.heroImageUrl ?? '',
    heroVideoUrl: initialData?.heroVideoUrl ?? '',
    
    // Specifications - FULLY INITIALIZED
    specifications: normalizeRecord(initialData?.specifications, EMPTY_SPECIFICATIONS),
    
    // Pricing - FULLY INITIALIZED
    pricing: normalizePricing(initialData),
    
    // Inventory - FULLY INITIALIZED
    inventory: normalizeInventory(initialData),
    
    // Status
    status: initialData?.status ?? 'draft',
    featured: initialData?.featured ?? initialData?.isFeatured ?? false,
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/admin/categories');
        if (!response.ok) throw new Error('Failed to load categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching vehicle categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const steps = [
    { id: 1, name: 'Basic Info', description: 'Vehicle details' },
    { id: 2, name: 'Images', description: 'Photos & gallery' },
    { id: 3, name: 'Specifications', description: 'Technical specs' },
    { id: 4, name: 'Pricing', description: 'Price & offers' },
    { id: 5, name: 'Inventory', description: 'Stock management' },
  ];

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Vehicle name is required');
      setCurrentStep(1);
      return;
    }
    
    if (!formData.model.trim()) {
      alert('Model code is required');
      setCurrentStep(1);
      return;
    }
    
    if (!formData.categoryId) {
      alert('Category is required');
      setCurrentStep(1);
      return;
    }
    
    if (!formData.pricing.basePrice || formData.pricing.basePrice <= 0) {
      alert('Base price is required');
      setCurrentStep(4);
      return;
    }

    try {
      // Auto-publish: set status to 'published'
      const dataToSave = {
        ...formData,
        status: 'published'
      };

      const url = mode === 'create' 
        ? '/api/admin/vehicles'
        : `/api/admin/vehicles/${initialData?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save vehicle');
      }

      const savedVehicle = await response.json();
      
      // Redirect to vehicle detail page (not list)
      window.location.href = withBasePath(`/admin/vehicles/${savedVehicle.id}`);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Failed to save vehicle. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Step Navigation */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6">
          <h3 className="font-semibold text-gray-900 mb-4">Progress</h3>
          <nav className="space-y-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  currentStep === step.id
                    ? 'bg-geely-blue/10 border-2 border-geely-blue text-geely-blue'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step.id
                        ? 'bg-geely-blue text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {step.id}
                  </div>
                  <div>
                    <div className="font-medium">{step.name}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Form Content */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                <p className="text-sm text-gray-500">
                  Enter the basic details about the vehicle
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="e.g., Coolray"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model Code *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="e.g., SX11"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const selected = categories.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        category: selected?.slug ?? '',
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    required
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select Category'}
                    </option>
                    {categories
                      .filter((c) => c.isActive || c.id === formData.categoryId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  {!categoriesLoading && categories.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      No categories yet.{' '}
                      <Link href="/admin/categories" className="text-geely-blue hover:underline">
                        Create one
                      </Link>{' '}
                      first.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                  rows={5}
                  placeholder="Enter vehicle description..."
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 text-geely-blue border-gray-300 rounded focus:ring-geely-blue"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Vehicle</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <ImageUpload
              images={formData.images}
              onChange={(images) => setFormData({ ...formData, images })}
              heroImageUrl={formData.heroImageUrl}
              heroVideoUrl={formData.heroVideoUrl}
              onHeroImageChange={(url) => setFormData({ ...formData, heroImageUrl: url })}
              onHeroVideoChange={(url) => setFormData({ ...formData, heroVideoUrl: url })}
            />
          )}

          {/* Step 3: Specifications */}
          {currentStep === 3 && (
            <SpecificationsEditor
              specifications={formData.specifications}
              onChange={(specifications) => setFormData({ ...formData, specifications })}
            />
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <PricingEditor
              pricing={formData.pricing}
              onChange={(pricing) => setFormData({ ...formData, pricing })}
            />
          )}

          {/* Step 5: Inventory */}
          {currentStep === 5 && (
            <InventoryManager
              inventory={formData.inventory}
              onChange={(inventory) => setFormData({ ...formData, inventory })}
            />
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-3">
              {currentStep < steps.length ? (
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                  className="px-6 py-2 bg-geely-blue text-white rounded-lg hover:bg-navy transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {mode === 'create' ? 'Create Vehicle' : 'Update Vehicle'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
