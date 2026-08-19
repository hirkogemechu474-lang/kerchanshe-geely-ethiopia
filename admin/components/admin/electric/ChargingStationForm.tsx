'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Save } from 'lucide-react';

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  stationType: string;
  chargerCount: number;
  maxPower: string;
  connector: string[];
  availability: string;
  pricing: string;
  hours: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
}

interface ChargingStationFormProps {
  stationId?: string;
}

export default function ChargingStationForm({ stationId }: ChargingStationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!stationId);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [connectors, setConnectors] = useState<string[]>([]);
  const [newConnector, setNewConnector] = useState('');

  const [formData, setFormData] = useState<ChargingStation>({
    id: '',
    name: '',
    address: '',
    city: '',
    latitude: 0,
    longitude: 0,
    stationType: 'fast-dc',
    chargerCount: 1,
    maxPower: '150kW',
    connector: [],
    availability: 'operational',
    pricing: '',
    hours: '',
    amenities: [],
    images: [],
    isActive: true,
  });

  useEffect(() => {
    if (stationId) {
      fetchStation();
    }
  }, [stationId]);

  const fetchStation = async () => {
    try {
      const response = await fetch(`/api/admin/electric/stations/${stationId}`);
      const data = await response.json();
      setFormData(data.station);
      setImages(data.station.images || []);
      setAmenities(data.station.amenities || []);
      setConnectors(data.station.connector || []);
    } catch (error) {
      console.error('Error fetching station:', error);
      alert('Failed to load station');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let file of Array.from(files)) {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('category', 'charging-station');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataToSend,
        });

        const data = await response.json();
        if (data.file?.url) {
          setImages(prev => [...prev, data.file.url]);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity)) {
      setAmenities([...amenities, newAmenity]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const addConnector = () => {
    if (newConnector.trim() && !connectors.includes(newConnector)) {
      setConnectors([...connectors, newConnector]);
      setNewConnector('');
    }
  };

  const removeConnector = (index: number) => {
    setConnectors(connectors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        images,
        amenities,
        connector: connectors,
      };

      const url = stationId
        ? `/api/admin/electric/stations/${stationId}`
        : '/api/admin/electric/stations';

      const method = stationId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        router.push('/admin/electric/stations');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save station');
      }
    } catch (error) {
      console.error('Error saving station:', error);
      alert('Failed to save station');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading station...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Station Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Bole International Airport"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Addis Ababa"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Full address"
          />
        </div>

        {/* Location */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleInputChange}
            required
            step="0.0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 8.9806"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleInputChange}
            required
            step="0.0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 38.7991"
          />
        </div>

        {/* Charging Specifications */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Charging Specifications</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Charging Type *</label>
          <select
            name="stationType"
            value={formData.stationType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="fast-dc">Fast DC</option>
            <option value="level-2">Level 2</option>
            <option value="home">Home</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Chargers *</label>
          <input
            type="number"
            name="chargerCount"
            value={formData.chargerCount}
            onChange={handleInputChange}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Power *</label>
          <input
            type="text"
            name="maxPower"
            value={formData.maxPower}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 150kW"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability Status</label>
          <select
            name="availability"
            value={formData.availability}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="operational">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="planned">Planned</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Information</label>
          <input
            type="text"
            name="pricing"
            value={formData.pricing}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., ETB 25 per kWh"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
          <input
            type="text"
            name="hours"
            value={formData.hours}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 24/7 or 6:00 AM - 10:00 PM"
          />
        </div>

        {/* Connectors */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connectors</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newConnector}
              onChange={(e) => setNewConnector(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addConnector())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., CCS2, CHAdeMO, Type 2"
            />
            <button
              type="button"
              onClick={addConnector}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {connectors.map((connector, index) => (
              <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {connector}
                <button
                  type="button"
                  onClick={() => removeConnector(index)}
                  className="hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., WiFi, Cafe, Restrooms, Parking"
            />
            <button
              type="button"
              onClick={addAmenity}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(index)}
                  className="hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Station Images</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload images</p>
              </div>
            </label>
          </div>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt="Station"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="lg:col-span-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Active Station</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-6 border-t">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {submitting ? 'Saving...' : stationId ? 'Update Station' : 'Create Station'}
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
