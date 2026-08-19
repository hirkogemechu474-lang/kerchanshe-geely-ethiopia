'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { formatVehiclePrice, type VehicleRecord } from '@/lib/vehicleData';
import { Check, Share2, Download, Mail } from 'lucide-react';
import Image from 'next/image';

interface TrimOption {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  price: number;
  image?: string;
}

interface WheelOption {
  id: string;
  name: string;
  size: string;
  price: number;
  image?: string;
}

export default function ConfiguratorPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [selectedTrim, setSelectedTrim] = useState<TrimOption | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [selectedWheels, setSelectedWheels] = useState<WheelOption | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [apiOptions, setApiOptions] = useState<{ trims: TrimOption[]; colors: ColorOption[]; wheels: WheelOption[] } | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchVehicles() {
      try {
        const response = await fetch('/api/public/vehicles');
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.vehicles || [];

        if (active) {
          setVehicles(list);
          const requestedVehicle = new URLSearchParams(window.location.search).get('vehicle');
          setSelectedVehicle(list.find((vehicle: VehicleRecord) => vehicle.id === requestedVehicle || vehicle.slug === requestedVehicle) || list[0] || null);
        }
      } catch (error) {
        console.error('Failed to load configuration vehicles:', error);
      }
    }

    void fetchVehicles();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedVehicle) return;
    let active = true;
    fetch(`/api/public/vehicles/${encodeURIComponent(selectedVehicle.slug)}/configuration`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active) return;
        setApiOptions(data ? {
          trims: Array.isArray(data.packages) ? data.packages.map((item: { id: string; name: string; price: number; features?: unknown }) => ({ id: item.id, name: item.name, price: item.price, features: Array.isArray(item.features) ? item.features.filter((feature): feature is string => typeof feature === 'string') : [] })) : [],
          colors: Array.isArray(data.colors) ? data.colors.map((item: ColorOption) => ({ ...item, hex: item.hex || '#E5E7EB' })) : [],
          wheels: [],
        } : null);
      })
      .catch(() => active && setApiOptions(null));
    return () => { active = false; };
  }, [selectedVehicle]);

  // Mock trim options - in production, fetch from CMS
  const trimOptions: Record<string, TrimOption[]> = {
    'coolray': [
      {
        id: 'comfort',
        name: 'Comfort',
        price: 0,
        features: ['Manual AC', '16" Alloy Wheels', 'Fabric Seats', 'Basic Infotainment']
      },
      {
        id: 'luxury',
        name: 'Luxury',
        price: 50000,
        features: ['Dual-Zone Climate', '17" Alloy Wheels', 'Leather Seats', '10" Touchscreen', 'Panoramic Sunroof']
      },
      {
        id: 'sport',
        name: 'Sport',
        price: 85000,
        features: ['Sport Suspension', '18" Sport Wheels', 'Sport Seats', 'Premium Sound', 'Advanced Safety Package']
      }
    ]
  };

  // Mock color options
  const colorOptions: ColorOption[] = [
    { id: 'white', name: 'Pearl White', hex: '#F8F9FA', price: 0 },
    { id: 'black', name: 'Obsidian Black', hex: '#1A1D23', price: 5000 },
    { id: 'silver', name: 'Titanium Silver', hex: '#C0C0C0', price: 0 },
    { id: 'blue', name: 'Ocean Blue', hex: '#0057B8', price: 5000 },
    { id: 'red', name: 'Crimson Red', hex: '#DC143C', price: 8000 },
    { id: 'grey', name: 'Storm Grey', hex: '#6C757D', price: 0 }
  ];

  // Mock wheel options
  const wheelOptions: WheelOption[] = [
    { id: '16-standard', name: 'Standard Alloy', size: '16"', price: 0 },
    { id: '17-premium', name: 'Premium Alloy', size: '17"', price: 12000 },
    { id: '18-sport', name: 'Sport Alloy', size: '18"', price: 25000 }
  ];

  // Initialize defaults
  useEffect(() => {
    if (!selectedVehicle) return;
    const modelTrims = apiOptions?.trims.length ? apiOptions.trims : (trimOptions[selectedVehicle.id] || trimOptions['coolray']);
    if (!selectedTrim) {
      setSelectedTrim(modelTrims[0]);
    }
    if (!selectedColor) {
      setSelectedColor((apiOptions?.colors.length ? apiOptions.colors : colorOptions)[0] || null);
    }
    if (!selectedWheels) {
      setSelectedWheels((apiOptions?.wheels.length ? apiOptions.wheels : wheelOptions)[0] || null);
    }
  }, [selectedVehicle, apiOptions]);

  // Calculate total price
  useEffect(() => {
    if (!selectedVehicle) return;
    const basePrice = selectedVehicle.finalPrice || selectedVehicle.basePrice;
    const trimPrice = selectedTrim?.price || 0;
    const colorPrice = selectedColor?.price || 0;
    const wheelsPrice = selectedWheels?.price || 0;
    
    setTotalPrice(basePrice + trimPrice + colorPrice + wheelsPrice);
  }, [selectedVehicle, selectedTrim, selectedColor, selectedWheels]);

  const formatPrice = (price: number) => {
    return `ETB ${price.toLocaleString()}`;
  };

  const handleShare = () => {
    if (!selectedVehicle) return;
    const config = {
      vehicle: selectedVehicle.name,
      trim: selectedTrim?.name,
      color: selectedColor?.name,
      wheels: selectedWheels?.name,
      price: totalPrice
    };
    
    const shareUrl = `${window.location.origin}/configurator?config=${encodeURIComponent(JSON.stringify(config))}`;
    
    if (navigator.share) {
      navigator.share({
        title: `My ${selectedVehicle.name} Configuration`,
        text: `Check out my custom ${selectedVehicle.name} - ${formatPrice(totalPrice)}`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Configuration link copied to clipboard!');
    }
  };

  const handleSendConfiguration = () => {
    if (!selectedVehicle) return;
    const config = {
      vehicle: selectedVehicle.name,
      trim: selectedTrim?.name,
      color: selectedColor?.name,
      wheels: selectedWheels?.name,
      price: totalPrice
    };
    
    window.location.href = `/quote?config=${encodeURIComponent(JSON.stringify(config))}`;
  };

  const currentTrimOptions = selectedVehicle ? (apiOptions?.trims.length ? apiOptions.trims : (trimOptions[selectedVehicle.id] || trimOptions['coolray'])) : [];
  const activeColorOptions = apiOptions?.colors.length ? apiOptions.colors : colorOptions;
  const activeWheelOptions = apiOptions?.wheels.length ? apiOptions.wheels : wheelOptions;

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-navy to-geely-blue text-white py-12">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-gold text-sm font-bold tracking-wider mb-3">
            BUILD & PRICE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Configure Your Geely
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Customize your vehicle with your preferred trim, color, and wheels. See the price update in real-time.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vehicle Selector */}
            <section>
              <h2 className="text-2xl font-bold text-navy mb-4">1. Select Model</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicles.slice(0, 6).map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedVehicle?.id === vehicle.id
                        ? 'border-geely-blue bg-ice shadow-lg'
                        : 'border-line bg-white hover:border-geely-blue'
                    }`}
                  >
                    <div className="h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded mb-3 flex items-center justify-center">
                      <span className="text-xs text-steel text-center px-2">
                        {vehicle.name}
                      </span>
                    </div>
                    <div className="font-bold text-navy text-sm mb-1">
                      {vehicle.name.replace('Geely ', '')}
                    </div>
                    <div className="text-xs text-steel">
                      {vehicle.hidePrice ? "Price on request" : `From ${formatVehiclePrice(vehicle.finalPrice || vehicle.basePrice)}`}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Trim Selector */}
            <section>
              <h2 className="text-2xl font-bold text-navy mb-4">2. Choose Trim Level</h2>
              <div className="space-y-3">
                {currentTrimOptions.map((trim) => (
                  <button
                    key={trim.id}
                    onClick={() => setSelectedTrim(trim)}
                    className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                      selectedTrim?.id === trim.id
                        ? 'border-geely-blue bg-ice shadow-lg'
                        : 'border-line bg-white hover:border-geely-blue'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-navy text-lg mb-1">{trim.name}</h3>
                        <p className="text-gold font-bold">
                          {trim.price === 0 ? 'Included' : `+${formatPrice(trim.price)}`}
                        </p>
                      </div>
                      {selectedTrim?.id === trim.id && (
                        <div className="w-6 h-6 bg-geely-blue rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {trim.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-steel">
                          <Check size={14} className="text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Color Selector */}
            <section>
              <h2 className="text-2xl font-bold text-navy mb-4">3. Select Exterior Color</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {activeColorOptions.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedColor?.id === color.id
                        ? 'border-geely-blue bg-ice shadow-lg'
                        : 'border-line bg-white hover:border-geely-blue'
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded-lg mb-2 border border-line"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="text-xs font-semibold text-navy mb-1 text-center">
                      {color.name}
                    </div>
                    <div className="text-xs text-steel text-center">
                      {color.price === 0 ? 'Standard' : `+${formatPrice(color.price)}`}
                    </div>
                    {selectedColor?.id === color.id && (
                      <div className="mt-2 flex justify-center">
                        <div className="w-5 h-5 bg-geely-blue rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Wheel Selector */}
            <section>
              <h2 className="text-2xl font-bold text-navy mb-4">4. Choose Wheels</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeWheelOptions.map((wheel) => (
                  <button
                    key={wheel.id}
                    onClick={() => setSelectedWheels(wheel)}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedWheels?.id === wheel.id
                        ? 'border-geely-blue bg-ice shadow-lg'
                        : 'border-line bg-white hover:border-geely-blue'
                    }`}
                  >
                    <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-3 flex items-center justify-center">
                      <span className="text-2xl font-bold text-navy">{wheel.size}</span>
                    </div>
                    <h3 className="font-bold text-navy mb-1">{wheel.name}</h3>
                    <p className="text-sm text-steel mb-2">{wheel.size} Wheels</p>
                    <p className="text-sm font-bold text-gold">
                      {wheel.price === 0 ? 'Included' : `+${formatPrice(wheel.price)}`}
                    </p>
                    {selectedWheels?.id === wheel.id && (
                      <div className="mt-3 flex justify-center">
                        <div className="w-6 h-6 bg-geely-blue rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Vehicle Preview */}
              <div className="bg-white rounded-lg shadow-lg p-6 border border-line">
                <h3 className="font-bold text-navy text-lg mb-4">Your Configuration</h3>
                
                {/* Vehicle Image */}
                <div 
                  className="h-48 rounded-lg mb-4 flex items-center justify-center"
                  style={{ 
                    backgroundColor: selectedColor?.hex || '#F8F9FA',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🚗</div>
                    <div className="text-sm text-navy font-semibold">
                      {selectedVehicle?.name}
                    </div>
                    <div className="text-xs text-steel mt-1">
                      {selectedColor?.name}
                    </div>
                  </div>
                </div>

                {/* Configuration Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-line">
                    <span className="text-sm text-steel">Model</span>
                    <span className="text-sm font-semibold text-navy">{selectedVehicle?.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-line">
                    <span className="text-sm text-steel">Trim</span>
                    <span className="text-sm font-semibold text-navy">{selectedTrim?.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-line">
                    <span className="text-sm text-steel">Color</span>
                    <span className="text-sm font-semibold text-navy">{selectedColor?.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-line">
                    <span className="text-sm text-steel">Wheels</span>
                    <span className="text-sm font-semibold text-navy">{selectedWheels?.name}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-ice p-4 rounded-lg mb-6">
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-steel">Base Price</span>
                      <span className="text-navy">
                        {selectedVehicle?.hidePrice ? "Price on request" : formatVehiclePrice(selectedVehicle?.finalPrice || selectedVehicle?.basePrice || 0)}
                      </span>
                    </div>
                    {selectedTrim && selectedTrim.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-steel">Trim Package</span>
                        <span className="text-navy">+{formatPrice(selectedTrim.price)}</span>
                      </div>
                    )}
                    {selectedColor && selectedColor.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-steel">Premium Color</span>
                        <span className="text-navy">+{formatPrice(selectedColor.price)}</span>
                      </div>
                    )}
                    {selectedWheels && selectedWheels.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-steel">Upgraded Wheels</span>
                        <span className="text-navy">+{formatPrice(selectedWheels.price)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t-2 border-navy">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-navy">Total Price</span>
                      <span className="text-2xl font-bold text-geely-blue">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleSendConfiguration}
                    className="w-full bg-gold text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Send My Configuration
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="w-full bg-white text-navy font-bold py-3 rounded-lg border-2 border-navy hover:bg-ice transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} />
                    Share Configuration
                  </button>
                  
                  <button
                    className="w-full bg-white text-navy font-bold py-3 rounded-lg border-2 border-line hover:border-geely-blue transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download Brochure
                  </button>
                </div>
              </div>

              {/* Financing Estimate */}
              <div className="bg-ice rounded-lg p-6 border border-line">
                <h4 className="font-bold text-navy mb-3">Estimated Monthly Payment</h4>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-geely-blue mb-1">
                    {formatPrice(Math.round(totalPrice * 0.02))}
                  </div>
                  <div className="text-xs text-steel">
                    Based on 20% down, 5 years @ 13% APR
                  </div>
                </div>
                <a
                  href="/financing"
                  className="block text-center text-sm text-geely-blue font-semibold hover:underline"
                >
                  Calculate Full Financing →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
