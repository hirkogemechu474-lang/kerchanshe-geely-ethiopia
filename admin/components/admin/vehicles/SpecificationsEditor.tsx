'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface SpecificationsEditorProps {
  specifications: any;
  onChange: (specifications: any) => void;
}

export default function SpecificationsEditor({ specifications, onChange }: SpecificationsEditorProps) {
  const specCategories = [
    { id: 'engine', name: 'Engine & Performance', icon: '⚙️' },
    { id: 'dimensions', name: 'Dimensions', icon: '📏' },
    { id: 'features', name: 'Features & Technology', icon: '💡' },
    { id: 'safety', name: 'Safety', icon: '🛡️' },
    { id: 'warranty', name: 'Warranty & Service', icon: '📋' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('engine');
  
  // Initialize with proper defaults - ALL fields as empty strings
  const initialSpecs = {
    engine: {
      type: '',
      displacement: '',
      power: '',
      torque: '',
      transmission: '',
      drivetrain: '',
      fuelType: '',
      fuelEconomy: '',
    },
    dimensions: {
      length: '',
      width: '',
      height: '',
      wheelbase: '',
      groundClearance: '',
      curbWeight: '',
      seatingCapacity: '',
      cargoVolume: '',
    },
    features: {
      infotainment: '',
      connectivity: '',
      climate: '',
      seats: '',
      lighting: '',
      wheels: '',
    },
    safety: {
      airbags: '',
      abs: '',
      esc: '',
      tpms: '',
      cameras: '',
      sensors: '',
      adas: '',
    },
    warranty: {
      basic: '',
      powertrain: '',
      corrosion: '',
      roadside: '',
      maintenance: '',
    },
  };

  const [specs, setSpecs] = useState(() => {
    // Merge specifications with defaults to ensure all fields exist
    return {
      engine: { ...initialSpecs.engine, ...(specifications?.engine || {}) },
      dimensions: { ...initialSpecs.dimensions, ...(specifications?.dimensions || {}) },
      features: { ...initialSpecs.features, ...(specifications?.features || {}) },
      safety: { ...initialSpecs.safety, ...(specifications?.safety || {}) },
      warranty: { ...initialSpecs.warranty, ...(specifications?.warranty || {}) },
    };
  });

  const handleSpecChange = (category: string, field: string, value: string) => {
    const newSpecs = {
      ...specs,
      [category]: {
        ...((specs as Record<string, any>)[category] || {}),
        [field]: value,
      },
    };
    setSpecs(newSpecs);
    onChange(newSpecs);
  };

  // Quick Fill Template Functions
  const applyTemplate = (templateName: string) => {
    let templateSpecs = { ...initialSpecs };
    
    switch (templateName) {
      case 'compact-suv':
        templateSpecs = {
          engine: {
            type: '1.5L Turbocharged Inline-4',
            displacement: '1,498 cc',
            power: '177 HP @ 5,500 RPM',
            torque: '255 Nm @ 1,500-4,000 RPM',
            transmission: '7-Speed DCT',
            drivetrain: 'Front-Wheel Drive',
            fuelType: 'Petrol',
            fuelEconomy: '6.5 L/100km (Combined)',
          },
          dimensions: {
            length: '4,330 mm',
            width: '1,800 mm',
            height: '1,609 mm',
            wheelbase: '2,600 mm',
            groundClearance: '180 mm',
            curbWeight: '1,380 kg',
            seatingCapacity: '5',
            cargoVolume: '420 L',
          },
          features: {
            infotainment: '10.25" Touchscreen, Apple CarPlay, Android Auto',
            connectivity: 'Bluetooth 5.0, USB, Wi-Fi',
            climate: 'Automatic Climate Control',
            seats: 'Fabric, Driver 6-way Manual Adjust',
            lighting: 'LED Headlights, LED DRLs',
            wheels: '17" Alloy Wheels',
          },
          safety: {
            airbags: '6 Airbags',
            abs: 'ABS with EBD',
            esc: 'Electronic Stability Control',
            tpms: 'Tire Pressure Monitoring System',
            cameras: 'Rear View Camera',
            sensors: 'Front & Rear Parking Sensors',
            adas: 'N/A',
          },
          warranty: {
            basic: '5 Years / 150,000 km',
            powertrain: '5 Years / 150,000 km',
            corrosion: '6 Years',
            roadside: '5 Years',
            maintenance: 'First Service Free',
          },
        };
        break;
        
      case 'midsize-suv':
        templateSpecs = {
          engine: {
            type: '2.0L Turbocharged Inline-4',
            displacement: '1,998 cc',
            power: '238 HP @ 5,500 RPM',
            torque: '350 Nm @ 1,800-4,800 RPM',
            transmission: '8-Speed Automatic',
            drivetrain: 'All-Wheel Drive (AWD)',
            fuelType: 'Petrol',
            fuelEconomy: '8.2 L/100km (Combined)',
          },
          dimensions: {
            length: '4,770 mm',
            width: '1,895 mm',
            height: '1,689 mm',
            wheelbase: '2,845 mm',
            groundClearance: '200 mm',
            curbWeight: '1,720 kg',
            seatingCapacity: '7',
            cargoVolume: '560 L (3rd row up), 1,560 L (3rd row folded)',
          },
          features: {
            infotainment: '12.3" Touchscreen, Navigation, Premium Sound',
            connectivity: 'Bluetooth 5.1, USB-C, Wireless Charging',
            climate: 'Dual-Zone Automatic Climate Control',
            seats: 'Leather, Power Adjustable Driver & Passenger',
            lighting: 'Full LED Headlights, Adaptive Lighting',
            wheels: '19" Alloy Wheels',
          },
          safety: {
            airbags: '8 Airbags',
            abs: 'ABS with EBD & Brake Assist',
            esc: 'Electronic Stability Control with Traction Control',
            tpms: 'Tire Pressure Monitoring System',
            cameras: '360° Surround View Camera',
            sensors: 'Front, Rear & Side Parking Sensors',
            adas: 'Adaptive Cruise Control, Lane Keep Assist, Blind Spot Monitor',
          },
          warranty: {
            basic: '6 Years / 200,000 km',
            powertrain: '6 Years / 200,000 km',
            corrosion: '8 Years',
            roadside: '6 Years',
            maintenance: 'First 3 Services Free',
          },
        };
        break;
        
      case 'fullsize-suv':
        templateSpecs = {
          engine: {
            type: '3.0L V6 Turbocharged',
            displacement: '2,998 cc',
            power: '340 HP @ 6,000 RPM',
            torque: '450 Nm @ 2,000-5,000 RPM',
            transmission: '9-Speed Automatic',
            drivetrain: 'All-Wheel Drive (AWD)',
            fuelType: 'Petrol',
            fuelEconomy: '10.5 L/100km (Combined)',
          },
          dimensions: {
            length: '5,005 mm',
            width: '1,960 mm',
            height: '1,780 mm',
            wheelbase: '2,950 mm',
            groundClearance: '220 mm',
            curbWeight: '2,100 kg',
            seatingCapacity: '7',
            cargoVolume: '750 L (3rd row up), 2,100 L (all rows folded)',
          },
          features: {
            infotainment: '14.6" Touchscreen, Premium Navigation, 12-Speaker Bose',
            connectivity: 'Bluetooth 5.2, Multiple USB-C, Wi-Fi Hotspot',
            climate: 'Tri-Zone Automatic Climate Control',
            seats: 'Premium Leather, Ventilated Front Seats, Memory Function',
            lighting: 'Matrix LED Headlights, Ambient Interior Lighting',
            wheels: '21" Alloy Wheels',
          },
          safety: {
            airbags: '10 Airbags',
            abs: 'ABS with EBD, Brake Assist, Hill Descent Control',
            esc: 'Electronic Stability Control, Traction Control, Off-Road Modes',
            tpms: 'Tire Pressure Monitoring System',
            cameras: '360° Surround View with 3D View',
            sensors: 'Ultrasonic Sensors All Around',
            adas: 'Full ADAS Suite: ACC, LKA, BSM, AEB, Traffic Sign Recognition',
          },
          warranty: {
            basic: '7 Years / 250,000 km',
            powertrain: '7 Years / 250,000 km',
            corrosion: '10 Years',
            roadside: '7 Years',
            maintenance: 'First 5 Services Free',
          },
        };
        break;
        
      case 'sedan':
        templateSpecs = {
          engine: {
            type: '1.4L Turbocharged Inline-4',
            displacement: '1,395 cc',
            power: '141 HP @ 5,200 RPM',
            torque: '235 Nm @ 1,600-4,000 RPM',
            transmission: 'CVT Automatic',
            drivetrain: 'Front-Wheel Drive',
            fuelType: 'Petrol',
            fuelEconomy: '5.8 L/100km (Combined)',
          },
          dimensions: {
            length: '4,638 mm',
            width: '1,820 mm',
            height: '1,460 mm',
            wheelbase: '2,650 mm',
            groundClearance: '150 mm',
            curbWeight: '1,280 kg',
            seatingCapacity: '5',
            cargoVolume: '450 L',
          },
          features: {
            infotainment: '10.25" Touchscreen, Apple CarPlay, Android Auto',
            connectivity: 'Bluetooth 5.0, USB',
            climate: 'Automatic Climate Control',
            seats: 'Fabric/Leather Combo, Manual Adjust',
            lighting: 'LED Headlights, LED Tail Lights',
            wheels: '17" Alloy Wheels',
          },
          safety: {
            airbags: '6 Airbags',
            abs: 'ABS with EBD',
            esc: 'Electronic Stability Control',
            tpms: 'Tire Pressure Monitoring System',
            cameras: 'Rear View Camera',
            sensors: 'Rear Parking Sensors',
            adas: 'Forward Collision Warning',
          },
          warranty: {
            basic: '5 Years / 150,000 km',
            powertrain: '5 Years / 150,000 km',
            corrosion: '6 Years',
            roadside: '5 Years',
            maintenance: 'First Service Free',
          },
        };
        break;
        
      case 'electric':
        templateSpecs = {
          engine: {
            type: 'Permanent Magnet Synchronous Motor',
            displacement: 'N/A',
            power: '204 HP (150 kW)',
            torque: '310 Nm',
            transmission: 'Single-Speed Reduction Gear',
            drivetrain: 'Front-Wheel Drive',
            fuelType: 'Electric (BEV)',
            fuelEconomy: '16 kWh/100km',
          },
          dimensions: {
            length: '4,432 mm',
            width: '1,833 mm',
            height: '1,560 mm',
            wheelbase: '2,700 mm',
            groundClearance: '160 mm',
            curbWeight: '1,650 kg (with battery)',
            seatingCapacity: '5',
            cargoVolume: '380 L',
          },
          features: {
            infotainment: '12.3" Touchscreen, OTA Updates, Voice Control',
            connectivity: 'Bluetooth 5.1, 4G LTE, Wi-Fi, Multiple USB-C',
            climate: 'Automatic Climate Control with Pre-conditioning',
            seats: 'Eco-Leather, Heated Front Seats',
            lighting: 'Full LED Lighting, LED Light Bar',
            wheels: '18" Aerodynamic Alloy Wheels',
          },
          safety: {
            airbags: '7 Airbags',
            abs: 'ABS with EBD & Regenerative Braking',
            esc: 'Electronic Stability Control',
            tpms: 'Tire Pressure Monitoring System',
            cameras: '360° Surround View Camera',
            sensors: 'Front & Rear Parking Sensors',
            adas: 'Adaptive Cruise Control, Lane Keep Assist, Auto Emergency Braking',
          },
          warranty: {
            basic: '6 Years / 150,000 km',
            powertrain: '8 Years / 200,000 km (Battery: 8 years or 150,000 km, 70% capacity)',
            corrosion: '8 Years',
            roadside: '6 Years',
            maintenance: 'Reduced Maintenance (No Oil Changes)',
          },
        };
        break;
    }
    
    setSpecs(templateSpecs);
    onChange(templateSpecs);
  };

  const renderSpecFields = (category: string) => {
    const categorySpecs = (specs as Record<string, any>)[category] || {};
    
    return Object.entries(categorySpecs).map(([key, value]) => (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <input
          type="text"
          value={value as string || ''}
          onChange={(e) => handleSpecChange(category, key, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
        />
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Specifications</h2>
        <p className="text-sm text-gray-500">
          Enter detailed specifications for the vehicle
        </p>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {specCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Specification Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSpecFields(selectedCategory)}
      </div>

      {/* Quick Fill Templates */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Quick Fill Templates</h4>
        <p className="text-sm text-gray-500 mb-3">
          Click a template to auto-fill specifications with typical values
        </p>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => applyTemplate('compact-suv')}
            type="button"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-500 transition-colors"
          >
            Compact SUV
          </button>
          <button 
            onClick={() => applyTemplate('midsize-suv')}
            type="button"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-500 transition-colors"
          >
            Mid-Size SUV
          </button>
          <button 
            onClick={() => applyTemplate('fullsize-suv')}
            type="button"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-500 transition-colors"
          >
            Full-Size SUV
          </button>
          <button 
            onClick={() => applyTemplate('sedan')}
            type="button"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-500 transition-colors"
          >
            Sedan
          </button>
          <button 
            onClick={() => applyTemplate('electric')}
            type="button"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-500 transition-colors"
          >
            Electric Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}
