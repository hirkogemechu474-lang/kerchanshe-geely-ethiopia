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

interface InteriorOption {
  id: string;
  name: string;
  description: string | null;
  materialType: string;
  imageUrl: string | null;
  price: number;
  inStock: boolean;
}

interface AccessoryOption {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
}

export default function ConfiguratorPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [selectedTrim, setSelectedTrim] = useState<TrimOption | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [selectedWheels, setSelectedWheels] = useState<WheelOption | null>(null);
  const [selectedInterior, setSelectedInterior] = useState<InteriorOption | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<AccessoryOption[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [apiOptions, setApiOptions] = useState<{ trims: TrimOption[]; colors: ColorOption[]; wheels: WheelOption[]; interiors: InteriorOption[]; accessories: AccessoryOption[] } | null>(null);

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
          colors: Array.isArray(data.colors) ? data.colors.map((item: { id: string; name: string; colorCode?: string; price: number; imageUrl?: string | null }) => ({
            id: item.id,
            name: item.name,
            hex: item.colorCode || '#E5E7EB',
            price: item.price,
            image: item.imageUrl || undefined,
          })) : [],
          wheels: Array.isArray(data.wheels) ? data.wheels.map((item: { id: string; name: string; size: string; price: number; imageUrl?: string | null }) => ({
            id: item.id,
            name: item.name,
            size: item.size,
            price: item.price,
            image: item.imageUrl || undefined,
          })) : [],
          interiors: Array.isArray(data.interiors) ? data.interiors.filter((item: InteriorOption) => item.inStock) : [],
          accessories: Array.isArray(data.accessories) ? data.accessories.filter((item: AccessoryOption) => item.inStock) : [],
        } : null);
      })
      .catch(() => active && setApiOptions(null));
    return () => { active = false; };
  }, [selectedVehicle]);

  // Initialize defaults
  useEffect(() => {
    if (!selectedVehicle) return;
    if (!selectedTrim && apiOptions?.trims.length) {
      setSelectedTrim(apiOptions.trims[0]);
    }
    if (!selectedColor && apiOptions?.colors.length) {
      setSelectedColor(apiOptions.colors[0]);
    }
    if (!selectedWheels && apiOptions?.wheels.length) {
      setSelectedWheels(apiOptions.wheels[0]);
    }
    if (!selectedInterior && apiOptions?.interiors.length) {
      setSelectedInterior(apiOptions.interiors[0]);
    }
  }, [selectedVehicle, apiOptions]);

  // Interiors/accessories are vehicle-specific — clear stale selections on model change.
  useEffect(() => {
    setSelectedInterior(null);
    setSelectedAccessories([]);
  }, [selectedVehicle?.id]);

  const toggleAccessory = (accessory: AccessoryOption) => {
    setSelectedAccessories((current) =>
      current.find((a) => a.id === accessory.id)
        ? current.filter((a) => a.id !== accessory.id)
        : [...current, accessory]
    );
  };

  // Calculate total price
  useEffect(() => {
    if (!selectedVehicle) return;
    const basePrice = selectedVehicle.finalPrice || selectedVehicle.basePrice;
    const trimPrice = selectedTrim?.price || 0;
    const colorPrice = selectedColor?.price || 0;
    const wheelsPrice = selectedWheels?.price || 0;
    const interiorPrice = selectedInterior?.price || 0;
    const accessoriesPrice = selectedAccessories.reduce((sum, a) => sum + a.price, 0);

    setTotalPrice(basePrice + trimPrice + colorPrice + wheelsPrice + interiorPrice + accessoriesPrice);
  }, [selectedVehicle, selectedTrim, selectedColor, selectedWheels, selectedInterior, selectedAccessories]);

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
      interior: selectedInterior?.name,
      accessories: selectedAccessories.map((a) => a.name),
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
      interior: selectedInterior?.name,
      accessories: selectedAccessories.map((a) => a.name),
      price: totalPrice
    };
    
    window.location.href = `/quote?config=${encodeURIComponent(JSON.stringify(config))}`;
  };

  const currentTrimOptions = apiOptions?.trims || [];
  const activeColorOptions = apiOptions?.colors || [];
  const activeInteriorOptions = apiOptions?.interiors || [];
  const activeAccessoryOptions = apiOptions?.accessories || [];
  const activeWheelOptions = apiOptions?.wheels || [];

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
              <h2 className="text-2xl font-bold text-navy dark:text-ice mb-4">1. Select Model</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicles.slice(0, 6).map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedVehicle?.id === vehicle.id
                        ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                        : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                    }`}
                  >
                    <div className="h-20 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] rounded mb-3 flex items-center justify-center">
                      <span className="text-xs text-steel dark:text-steel-light text-center px-2">
                        {vehicle.name}
                      </span>
                    </div>
                    <div className="font-bold text-navy dark:text-ice text-sm mb-1">
                      {vehicle.name.replace('Geely ', '')}
                    </div>
                    <div className="text-xs text-steel dark:text-steel-light">
                      {vehicle.hidePrice ? "Price on request" : `From ${formatVehiclePrice(vehicle.finalPrice || vehicle.basePrice)}`}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Trim Selector */}
            <section>
              <h2 className="text-2xl font-bold text-navy dark:text-ice mb-4">2. Choose Trim Level</h2>
              <div className="space-y-3">
                {currentTrimOptions.map((trim) => (
                  <button
                    key={trim.id}
                    onClick={() => setSelectedTrim(trim)}
                    className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                      selectedTrim?.id === trim.id
                        ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                        : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-navy dark:text-ice text-lg mb-1">{trim.name}</h3>
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
                        <div key={idx} className="flex items-center gap-2 text-sm text-steel dark:text-steel-light">
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
              <h2 className="text-2xl font-bold text-navy dark:text-ice mb-4">3. Select Exterior Color</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {activeColorOptions.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedColor?.id === color.id
                        ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                        : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded-lg mb-2 border border-line dark:border-midnight-line"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="text-xs font-semibold text-navy dark:text-ice mb-1 text-center">
                      {color.name}
                    </div>
                    <div className="text-xs text-steel dark:text-steel-light text-center">
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
              <h2 className="text-2xl font-bold text-navy dark:text-ice mb-4">4. Choose Wheels</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeWheelOptions.map((wheel) => (
                  <button
                    key={wheel.id}
                    onClick={() => setSelectedWheels(wheel)}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedWheels?.id === wheel.id
                        ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                        : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                    }`}
                  >
                    <div className="h-24 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] rounded-full mb-3 flex items-center justify-center">
                      <span className="text-2xl font-bold text-navy dark:text-ice">{wheel.size}</span>
                    </div>
                    <h3 className="font-bold text-navy dark:text-ice mb-1">{wheel.name}</h3>
                    <p className="text-sm text-steel dark:text-steel-light mb-2">{wheel.size} Wheels</p>
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

            {/* Interior Selector */}
            {activeInteriorOptions.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-navy dark:text-ice mb-4">5. Choose Interior</h2>
                <div className="space-y-3">
                  {activeInteriorOptions.map((interior) => (
                    <button
                      key={interior.id}
                      onClick={() => setSelectedInterior(interior)}
                      className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                        selectedInterior?.id === interior.id
                          ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                          : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-navy dark:text-ice mb-1">{interior.name}</h3>
                          <p className="text-sm text-steel dark:text-steel-light">{interior.materialType}</p>
                          {interior.description && (
                            <p className="text-xs text-steel dark:text-steel-light mt-1">{interior.description}</p>
                          )}
                          <p className="text-sm font-bold text-gold mt-2">
                            {interior.price === 0 ? 'Included' : `+${formatPrice(interior.price)}`}
                          </p>
                        </div>
                        {selectedInterior?.id === interior.id && (
                          <div className="w-6 h-6 bg-geely-blue rounded-full flex items-center justify-center shrink-0">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Accessories Selector */}
            {activeAccessoryOptions.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-navy dark:text-ice mb-4">6. Add Accessories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAccessoryOptions.map((accessory) => {
                    const isSelected = selectedAccessories.some((a) => a.id === accessory.id);
                    return (
                      <button
                        key={accessory.id}
                        onClick={() => toggleAccessory(accessory)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                            : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs text-gold font-bold mb-1">{accessory.category}</div>
                            <h3 className="font-bold text-navy dark:text-ice">{accessory.name}</h3>
                            {accessory.description && (
                              <p className="text-xs text-steel dark:text-steel-light mt-1">{accessory.description}</p>
                            )}
                            <p className="text-sm font-bold text-gold mt-2">+{formatPrice(accessory.price)}</p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-geely-blue rounded-full flex items-center justify-center shrink-0">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Vehicle Preview */}
              <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-lg p-6 border border-line dark:border-midnight-line">
                <h3 className="font-bold text-navy dark:text-ice text-lg mb-4">Your Configuration</h3>
                
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
                    <div className="text-sm text-navy dark:text-ice font-semibold">
                      {selectedVehicle?.name}
                    </div>
                    <div className="text-xs text-steel dark:text-steel-light mt-1">
                      {selectedColor?.name}
                    </div>
                  </div>
                </div>

                {/* Configuration Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                    <span className="text-sm text-steel dark:text-steel-light">Model</span>
                    <span className="text-sm font-semibold text-navy dark:text-ice">{selectedVehicle?.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                    <span className="text-sm text-steel dark:text-steel-light">Trim</span>
                    <span className="text-sm font-semibold text-navy dark:text-ice">{selectedTrim?.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                    <span className="text-sm text-steel dark:text-steel-light">Color</span>
                    <span className="text-sm font-semibold text-navy dark:text-ice">{selectedColor?.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                    <span className="text-sm text-steel dark:text-steel-light">Wheels</span>
                    <span className="text-sm font-semibold text-navy dark:text-ice">{selectedWheels?.name}</span>
                  </div>

                  {selectedInterior && (
                    <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                      <span className="text-sm text-steel dark:text-steel-light">Interior</span>
                      <span className="text-sm font-semibold text-navy dark:text-ice">{selectedInterior.name}</span>
                    </div>
                  )}

                  {selectedAccessories.length > 0 && (
                    <div className="py-2 border-b border-line dark:border-midnight-line">
                      <span className="text-sm text-steel dark:text-steel-light">Accessories</span>
                      {selectedAccessories.map((acc) => (
                        <div key={acc.id} className="flex justify-between items-center mt-1">
                          <span className="text-sm font-semibold text-navy dark:text-ice">{acc.name}</span>
                          <span className="text-xs text-steel dark:text-steel-light">+{formatPrice(acc.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="bg-ice dark:bg-midnight p-4 rounded-lg mb-6">
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-steel dark:text-steel-light">Base Price</span>
                      <span className="text-navy dark:text-ice">
                        {selectedVehicle?.hidePrice ? "Price on request" : formatVehiclePrice(selectedVehicle?.finalPrice || selectedVehicle?.basePrice || 0)}
                      </span>
                    </div>
                    {selectedTrim && selectedTrim.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-steel dark:text-steel-light">Trim Package</span>
                        <span className="text-navy dark:text-ice">+{formatPrice(selectedTrim.price)}</span>
                      </div>
                    )}
                    {selectedColor && selectedColor.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-steel dark:text-steel-light">Premium Color</span>
                        <span className="text-navy dark:text-ice">+{formatPrice(selectedColor.price)}</span>
                      </div>
                    )}
                    {selectedWheels && selectedWheels.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-steel dark:text-steel-light">Upgraded Wheels</span>
                        <span className="text-navy dark:text-ice">+{formatPrice(selectedWheels.price)}</span>
                      </div>
                    )}
                    {selectedInterior && selectedInterior.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-steel dark:text-steel-light">Interior</span>
                        <span className="text-navy dark:text-ice">+{formatPrice(selectedInterior.price)}</span>
                      </div>
                    )}
                    {selectedAccessories.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-steel dark:text-steel-light">Accessories ({selectedAccessories.length})</span>
                        <span className="text-navy dark:text-ice">+{formatPrice(selectedAccessories.reduce((sum, a) => sum + a.price, 0))}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t-2 border-navy">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-navy dark:text-ice">Total Price</span>
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
                    className="w-full bg-gold text-navy dark:text-ice font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Send My Configuration
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="w-full bg-white dark:bg-midnight-surface text-navy dark:text-ice font-bold py-3 rounded-lg border-2 border-navy hover:bg-ice dark:hover:bg-midnight transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} />
                    Share Configuration
                  </button>
                  
                  <button
                    className="w-full bg-white dark:bg-midnight-surface text-navy dark:text-ice font-bold py-3 rounded-lg border-2 border-line dark:border-midnight-line hover:border-geely-blue transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download Brochure
                  </button>
                </div>
              </div>

              {/* Financing Estimate */}
              <div className="bg-ice dark:bg-midnight rounded-lg p-6 border border-line dark:border-midnight-line">
                <h4 className="font-bold text-navy dark:text-ice mb-3">Estimated Monthly Payment</h4>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-geely-blue mb-1">
                    {formatPrice(Math.round(totalPrice * 0.02))}
                  </div>
                  <div className="text-xs text-steel dark:text-steel-light">
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
