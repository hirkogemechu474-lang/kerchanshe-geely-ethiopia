'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';
import { Card, Button, LinkButton, PageHeader } from '@/components/admin/ui';

interface Dealer {
  id?: string;
  name: string;
  type: string;
  description?: string | null;
  city: string;
  region: string;
  country?: string;
  address: any;
  latitude: number;
  longitude: number;
  contact: any;
  website?: string | null;
  services: any;
  workingHours: any;
  facilities: any;
  logo?: string | null;
  gallery?: any;
  active: boolean;
  featured: boolean;
  salesCount: number;
  staffCount: number;
  rating: number;
}

export default function DealerForm({ dealer, isEdit = false }: { dealer?: Dealer; isEdit?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: dealer?.name || '',
    type: dealer?.type || 'both',
    description: dealer?.description || '',
    city: dealer?.city || '',
    region: dealer?.region || '',
    country: dealer?.country || 'Ethiopia',
    street: dealer?.address?.street || '',
    area: dealer?.address?.area || '',
    postalCode: dealer?.address?.postalCode || '',
    latitude: dealer?.latitude?.toString() || '9.0192',
    longitude: dealer?.longitude?.toString() || '38.7525',
    phone: dealer?.contact?.phone || '',
    email: dealer?.contact?.email || '',
    whatsapp: dealer?.contact?.whatsapp || '',
    website: dealer?.website || '',
    services: dealer?.services || ['New Vehicle Sales', 'Service & Maintenance', 'Genuine Parts'],
    weekdays: dealer?.workingHours?.weekdays || '8:00 AM - 6:00 PM',
    saturday: dealer?.workingHours?.saturday || '9:00 AM - 5:00 PM',
    sunday: dealer?.workingHours?.sunday || 'Closed',
    showroom: dealer?.facilities?.showroom !== false,
    serviceCenter: dealer?.facilities?.serviceCenter !== false,
    partsShop: dealer?.facilities?.partsShop !== false,
    testDriveArea: dealer?.facilities?.testDriveArea !== false,
    customerLounge: dealer?.facilities?.customerLounge !== false,
    parking: dealer?.facilities?.parking !== false,
    active: dealer?.active !== false,
    featured: dealer?.featured === true,
    salesCount: dealer?.salesCount?.toString() || '0',
    staffCount: dealer?.staffCount?.toString() || '0',
    rating: dealer?.rating?.toString() || '4.5',
  });

  const [logo, setLogo] = useState(dealer?.logo || '');
  const [gallery, setGallery] = useState<string[]>(
    Array.isArray(dealer?.gallery) ? dealer.gallery : []
  );

  const availableServices = [
    'New Vehicle Sales',
    'Test Drives',
    'Service & Maintenance',
    'Genuine Parts',
    'Financing Assistance',
    'Trade-In Valuation',
    'Warranty Repairs',
    'Diagnostic Services',
    'Tire Services',
  ];

  const toggleService = (service: string) => {
    let services = Array.isArray(formData.services) ? formData.services : [];
    if (services.includes(service)) {
      services = services.filter((s: string) => s !== service);
    } else {
      services = [...services, service];
    }
    setFormData({ ...formData, services });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        city: formData.city,
        region: formData.region,
        country: formData.country,
        address: { street: formData.street, area: formData.area, city: formData.city, region: formData.region, country: formData.country, postalCode: formData.postalCode },
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        contact: { phone: formData.phone, email: formData.email, whatsapp: formData.whatsapp },
        website: formData.website,
        services: formData.services,
        workingHours: { weekdays: formData.weekdays, saturday: formData.saturday, sunday: formData.sunday },
        facilities: { showroom: formData.showroom, serviceCenter: formData.serviceCenter, partsShop: formData.partsShop, testDriveArea: formData.testDriveArea, customerLounge: formData.customerLounge, parking: formData.parking },
        logo: logo || null,
        gallery,
        active: formData.active,
        featured: formData.featured,
        salesCount: parseInt(formData.salesCount) || 0,
        staffCount: parseInt(formData.staffCount) || 0,
        rating: parseFloat(formData.rating) || 0,
      };

      const url = isEdit ? `/api/admin/dealers/${dealer?.id}` : `/api/admin/dealers`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(isEdit ? 'Dealer updated successfully!' : 'Dealer created successfully!');
        setTimeout(() => {
          router.push('/admin/dealers');
          router.refresh();
        }, 800);
      } else {
        setError(data.error || 'Failed to save dealer');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dealer? This action cannot be undone.')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/dealers/${dealer?.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        router.push('/admin/dealers');
        router.refresh();
      } else {
        setError(data.error || 'Failed to delete dealer');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: any) => setFormData((prev: any) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Dealer' : 'Add New Dealer'}
        description={isEdit ? 'Update dealer information and settings' : 'Create a new dealer location'}
        actions={
          <>
            <Link href="/admin/dealers" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            {isEdit && (
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
          </>
        }
      />

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo & Gallery */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Media & Logo</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dealer Logo</label>
              <FileUpload value={logo} onChange={(v) => setLogo(v as string)} label="logo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
              <FileUpload value={gallery} onChange={(v) => setGallery(v as string[])} multiple label="gallery" />
            </div>
          </div>
        </Card>

        {/* Basic Information */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => set('name', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g., Geely Ethiopia - Sarbet Showroom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select required value={formData.type} onChange={(e) => set('type', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="both">Showroom & Service</option>
                <option value="showroom">Showroom Only</option>
                <option value="service">Service Only</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Describe this dealer location..." />
            </div>
          </div>
        </Card>

        {/* Address & Location */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address & Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input type="text" required value={formData.street} onChange={(e) => set('street', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g., Sarbet Road" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <input type="text" value={formData.area} onChange={(e) => set('area', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g., Kebele 01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input type="text" required value={formData.city} onChange={(e) => set('city', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g., Addis Ababa" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
              <input type="text" required value={formData.region} onChange={(e) => set('region', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g., Addis Ababa" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input type="text" value={formData.country} onChange={(e) => set('country', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Ethiopia" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input type="text" value={formData.postalCode} onChange={(e) => set('postalCode', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g., 1000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="text" value={formData.latitude} onChange={(e) => set('latitude', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g., 9.0192" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="text" value={formData.longitude} onChange={(e) => set('longitude', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g., 38.7525" />
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input type="tel" required value={formData.phone} onChange={(e) => set('phone', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="+251 11 000 0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" required value={formData.email} onChange={(e) => set('email', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="dealer@geelyethiopia.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input type="tel" value={formData.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="+251 99 338 9874" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="url" value={formData.website} onChange={(e) => set('website', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="https://geelyethiopia.com" />
            </div>
          </div>
        </Card>

        {/* Services */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableServices.map((service) => {
              const checked = Array.isArray(formData.services) && formData.services.includes(service);
              return (
                <label key={service} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={() => toggleService(service)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">{service}</span>
                </label>
              );
            })}
          </div>
        </Card>

        {/* Working Hours */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Working Hours</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Weekdays</label><input type="text" value={formData.weekdays} onChange={(e) => set('weekdays', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="8:00 AM - 6:00 PM" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Saturday</label><input type="text" value={formData.saturday} onChange={(e) => set('saturday', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="9:00 AM - 5:00 PM" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Sunday</label><input type="text" value={formData.sunday} onChange={(e) => set('sunday', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Closed" /></div>
          </div>
        </Card>

        {/* Facilities */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Facilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[['showroom', 'Showroom'], ['serviceCenter', 'Service Center'], ['partsShop', 'Parts Shop'], ['testDriveArea', 'Test Drive Area'], ['customerLounge', 'Customer Lounge'], ['parking', 'Parking']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={Boolean(formData[key as keyof typeof formData])} onChange={(e) => set(key, e.target.checked)} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Stats & Status */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stats & Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Sales Count</label><input type="number" value={formData.salesCount} onChange={(e) => set('salesCount', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" min="0" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Staff Count</label><input type="number" value={formData.staffCount} onChange={(e) => set('staffCount', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" min="0" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label><input type="number" value={formData.rating} onChange={(e) => set('rating', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" min="0" max="5" step="0.1" /></div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.active} onChange={(e) => set('active', e.target.checked)} className="rounded border-gray-300" /><span className="text-sm font-medium text-gray-700">Published</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.featured} onChange={(e) => set('featured', e.target.checked)} className="rounded border-gray-300" /><span className="text-sm font-medium text-gray-700">Featured</span></label>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : isEdit ? 'Update Dealer' : 'Create Dealer'}
          </Button>
          <LinkButton href="/admin/dealers" variant="secondary">Cancel</LinkButton>
        </div>
      </form>
    </div>
  );
}
