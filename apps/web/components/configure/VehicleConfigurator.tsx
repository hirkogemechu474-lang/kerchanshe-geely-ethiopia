'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowLeft } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  slug: string;
  model: string;
  year: number;
  category: string;
  description: string | null;
  basePrice: number;
  finalPrice: number | null;
  heroImageUrl: string | null;
  images: any;
}

interface Color {
  id: string;
  name: string;
  colorCode: string;
  imageUrl: string | null;
  price: number;
  inStock: boolean;
  isDefault: boolean;
}

interface Interior {
  id: string;
  name: string;
  description: string | null;
  materialType: string;
  imageUrl: string | null;
  price: number;
  isDefault: boolean;
  inStock: boolean;
}

interface Package {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  price: number;
  isDefault: boolean;
}

interface Accessory {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
}

interface Props {
  vehicle: Vehicle;
  colors: Color[];
  interiors: Interior[];
  packages: Package[];
  accessories: Accessory[];
}

export default function VehicleConfigurator({
  vehicle,
  colors,
  interiors,
  packages,
  accessories,
}: Props) {
  // Selected options
  const [selectedColor, setSelectedColor] = useState<Color | null>(
    colors.find(c => c.isDefault) || colors[0] || null
  );
  const [selectedInterior, setSelectedInterior] = useState<Interior | null>(
    interiors.find(i => i.isDefault) || interiors[0] || null
  );
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(
    packages.find(p => p.isDefault) || null
  );
  const [selectedAccessories, setSelectedAccessories] = useState<Accessory[]>([]);

  const toggleAccessory = (accessory: Accessory) => {
    if (selectedAccessories.find(a => a.id === accessory.id)) {
      setSelectedAccessories(selectedAccessories.filter(a => a.id !== accessory.id));
    } else {
      setSelectedAccessories([...selectedAccessories, accessory]);
    }
  };

  const displayImage = selectedColor?.imageUrl || 
                       vehicle.heroImageUrl || 
                       (Array.isArray(vehicle.images) && vehicle.images[0]) ||
                       null;

  return (
    <div>
      {/* Header */}
      <div className="bg-navy text-white py-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <Link 
            href="/configure"
            className="inline-flex items-center gap-2 text-gold hover:underline mb-4"
          >
            <ArrowLeft size={18} />
            Back to Models
          </Link>
          <h1 className="text-4xl font-bold mb-2">Configure Your {vehicle.name}</h1>
          <p className="text-[#d8e4f5]">{vehicle.year} {vehicle.model}</p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Options - Left Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Vehicle Preview */}
            <div className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6">
              <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">Preview</h3>
              <div className="aspect-video bg-gradient-to-br from-ice to-line rounded-lg flex items-center justify-center overflow-hidden">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-steel dark:text-steel-light">{vehicle.name} Preview</span>
                )}
              </div>
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6">
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">Exterior Color</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => color.inStock && setSelectedColor(color)}
                      disabled={!color.inStock}
                      className={`relative border-2 rounded-lg p-4 text-center transition-all ${
                        selectedColor?.id === color.id
                          ? 'border-geely-blue ring-2 ring-geely-blue'
                          : 'border-line dark:border-midnight-line dark:text-ice hover:border-geely-blue'
                      } ${!color.inStock && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div 
                        className="w-full aspect-square rounded-full mb-2 border border-line dark:border-midnight-line"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <div className="text-sm font-medium text-navy dark:text-ice">{color.name}</div>
                      {!color.inStock && (
                        <div className="text-xs text-red-600 mt-1">Out of Stock</div>
                      )}
                      {selectedColor?.id === color.id && (
                        <div className="absolute top-2 right-2 bg-geely-blue text-white rounded-full p-1">
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interior Selection */}
            {interiors.length > 0 && (
              <div className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6">
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">Interior</h3>
                <div className="space-y-3">
                  {interiors.map((interior) => (
                    <button
                      key={interior.id}
                      onClick={() => interior.inStock && setSelectedInterior(interior)}
                      disabled={!interior.inStock}
                      className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                        selectedInterior?.id === interior.id
                          ? 'border-geely-blue ring-2 ring-geely-blue'
                          : 'border-line dark:border-midnight-line dark:text-ice hover:border-geely-blue'
                      } ${!interior.inStock && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-navy dark:text-ice">{interior.name}</div>
                          <div className="text-sm text-steel dark:text-steel-light">{interior.materialType}</div>
                          {interior.description && (
                            <div className="text-xs text-steel dark:text-steel-light mt-1">{interior.description}</div>
                          )}
                        </div>
                        <div className="text-right">
                          {selectedInterior?.id === interior.id && (
                            <Check size={20} className="text-geely-blue mt-1" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Package Selection */}
            {packages.length > 0 && (
              <div className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6">
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">Packages</h3>
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(selectedPackage?.id === pkg.id ? null : pkg)}
                      className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'border-geely-blue ring-2 ring-geely-blue'
                          : 'border-line dark:border-midnight-line dark:text-ice hover:border-geely-blue'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-navy dark:text-ice">{pkg.name}</div>
                        </div>
                        {selectedPackage?.id === pkg.id && (
                          <Check size={20} className="text-geely-blue" />
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-steel dark:text-steel-light mb-2">{pkg.description}</p>
                      )}
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="text-xs text-steel dark:text-steel-light space-y-1">
                          {pkg.features.map((feature: string, idx: number) => (
                            <li key={idx}>- {feature}</li>
                          ))}
                        </ul>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Accessories */}
            {accessories.length > 0 && (
              <div className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6">
                <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">Accessories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accessories.map((accessory) => {
                    const isSelected = selectedAccessories.find(a => a.id === accessory.id);
                    return (
                      <button
                        key={accessory.id}
                        onClick={() => accessory.inStock && toggleAccessory(accessory)}
                        disabled={!accessory.inStock}
                        className={`text-left border-2 rounded-lg p-4 transition-all ${
                          isSelected
                            ? 'border-geely-blue ring-2 ring-geely-blue'
                            : 'border-line dark:border-midnight-line dark:text-ice hover:border-geely-blue'
                        } ${!accessory.inStock && 'opacity-50 cursor-not-allowed'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-xs text-gold font-bold mb-1">
                              {accessory.category}
                            </div>
                            <div className="font-bold text-navy dark:text-ice">{accessory.name}</div>
                            {accessory.description && (
                              <div className="text-xs text-steel dark:text-steel-light mt-1">{accessory.description}</div>
                            )}
                          </div>
                          {isSelected && (
                            <Check size={20} className="text-geely-blue flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Summary - Right Column (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line p-6 sticky top-4">
              <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">Configuration Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="pb-4 border-b border-line dark:border-midnight-line">
                  <div className="text-sm text-steel dark:text-steel-light">Base Vehicle</div>
                  <div className="font-bold text-navy dark:text-ice">{vehicle.name} {vehicle.year}</div>
                </div>

                {selectedColor && (
                  <div className="pb-4 border-b border-line dark:border-midnight-line">
                    <div className="text-sm text-steel dark:text-steel-light">Exterior Color</div>
                    <div className="font-medium text-navy dark:text-ice">{selectedColor.name}</div>
                  </div>
                )}

                {selectedInterior && (
                  <div className="pb-4 border-b border-line dark:border-midnight-line">
                    <div className="text-sm text-steel dark:text-steel-light">Interior</div>
                    <div className="font-medium text-navy dark:text-ice">{selectedInterior.name}</div>
                  </div>
                )}

                {selectedPackage && (
                  <div className="pb-4 border-b border-line dark:border-midnight-line">
                    <div className="text-sm text-steel dark:text-steel-light">Package</div>
                    <div className="font-medium text-navy dark:text-ice">{selectedPackage.name}</div>
                  </div>
                )}

                {selectedAccessories.length > 0 && (
                  <div className="pb-4 border-b border-line dark:border-midnight-line">
                    <div className="text-sm text-steel dark:text-steel-light mb-2">Accessories</div>
                    {selectedAccessories.map(acc => (
                      <div key={acc.id} className="flex justify-between text-sm mb-1">
                        <span className="text-navy dark:text-ice">{acc.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Link
                  href={`/quote?vehicle=${vehicle.slug}&configuration=${encodeURIComponent(JSON.stringify({
                    color: selectedColor?.id,
                    interior: selectedInterior?.id,
                    package: selectedPackage?.id,
                    accessories: selectedAccessories.map(a => a.id),
                  }))}`}
                  className="block w-full bg-geely-blue text-white text-center font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Get a Quote
                </Link>
                <Link
                  href={`/test-drive?vehicle=${vehicle.slug}`}
                  className="block w-full border-2 border-navy text-navy dark:text-ice text-center font-bold py-3 rounded-lg hover:bg-navy hover:text-white transition-colors"
                >
                  Book Test Drive
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
