'use client';

import { useState } from 'react';
import { DollarSign, Percent, Tag } from 'lucide-react';

interface PricingEditorProps {
  pricing: any;
  onChange: (pricing: any) => void;
}

export default function PricingEditor({ pricing, onChange }: PricingEditorProps) {
  const [priceData, setPriceData] = useState(pricing || {
    basePrice: 0,
    currency: 'ETB',
    discount: 0,
    discountType: 'percentage',
    taxRate: 15,
    includesTax: false,
    hidePrice: false,
    financingAvailable: true,
    minDownPayment: 20,
    dealerIncentive: 0,
  });

  const handleChange = (field: string, value: any) => {
    const newPricing = { ...priceData, [field]: value };
    setPriceData(newPricing);
    onChange(newPricing);
  };

  const calculateFinalPrice = () => {
    let price = priceData.basePrice;
    
    // Apply discount
    if (priceData.discount > 0) {
      if (priceData.discountType === 'percentage') {
        price = price - (price * (priceData.discount / 100));
      } else {
        price = price - priceData.discount;
      }
    }
    
    // Apply tax if not included
    if (!priceData.includesTax) {
      price = price + (price * (priceData.taxRate / 100));
    }
    
    return price;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing Information</h2>
        <p className="text-sm text-gray-500">
          Set pricing, discounts, and financing options
        </p>
      </div>

      {/* Base Pricing */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Base Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price (ETB) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={priceData.basePrice}
                onChange={(e) => handleChange('basePrice', parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={priceData.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                placeholder="15"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={priceData.includesTax}
            onChange={(e) => handleChange('includesTax', e.target.checked)}
            className="w-4 h-4 text-geely-blue border-gray-300 rounded focus:ring-geely-blue"
          />
          <span className="text-sm font-medium text-gray-700">Price includes tax</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={priceData.hidePrice}
            onChange={(e) => handleChange('hidePrice', e.target.checked)}
            className="w-4 h-4 text-geely-blue border-gray-300 rounded focus:ring-geely-blue"
          />
          <span className="text-sm font-medium text-gray-700">
            Hide price on website (show "Price on request")
          </span>
        </label>
      </div>

      {/* Discounts */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Discounts & Promotions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Amount
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={priceData.discount}
                onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <select
              value={priceData.discountType}
              onChange={(e) => handleChange('discountType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (ETB)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financing Options */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Financing Options</h3>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={priceData.financingAvailable}
            onChange={(e) => handleChange('financingAvailable', e.target.checked)}
            className="w-4 h-4 text-geely-blue border-gray-300 rounded focus:ring-geely-blue"
          />
          <span className="text-sm font-medium text-gray-700">Financing Available</span>
        </label>

        {priceData.financingAvailable && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Down Payment (%)
            </label>
            <input
              type="number"
              value={priceData.minDownPayment}
              onChange={(e) => handleChange('minDownPayment', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="20"
              min="0"
              max="100"
            />
          </div>
        )}
      </div>

      {/* Price Summary */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Price Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">Base Price:</span>
            <span className="font-semibold text-blue-900">{formatCurrency(priceData.basePrice)}</span>
          </div>
          {priceData.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-blue-700">Discount:</span>
              <span className="font-semibold text-green-600">
                -{priceData.discountType === 'percentage' 
                  ? `${priceData.discount}%` 
                  : formatCurrency(priceData.discount)}
              </span>
            </div>
          )}
          {!priceData.includesTax && (
            <div className="flex justify-between">
              <span className="text-blue-700">Tax ({priceData.taxRate}%):</span>
              <span className="font-semibold text-blue-900">
                {formatCurrency((calculateFinalPrice() - priceData.basePrice) * (priceData.taxRate / 100))}
              </span>
            </div>
          )}
          <div className="border-t-2 border-blue-200 pt-2 mt-2 flex justify-between">
            <span className="text-blue-900 font-bold">Final Price:</span>
            <span className="text-xl font-bold text-blue-900">{formatCurrency(calculateFinalPrice())}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
