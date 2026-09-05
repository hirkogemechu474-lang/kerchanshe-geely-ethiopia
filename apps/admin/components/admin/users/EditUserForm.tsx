'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Mail, Shield, Building, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader, Card, Button } from '@/components/admin/ui';
import RolePermissionPreview from '@/components/admin/users/RolePermissionPreview';
import { ROLE_OPTIONS } from '@geely/types';

export default function EditUserForm({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sales',
    dealerId: '',
    isActive: true,
    isAvailableForLeads: true,
    leadHoursStart: '',
    leadHoursEnd: '',
  });
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchUser();
    fetchBrands();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user');
      }

      setFormData({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        dealerId: data.user.dealerId || '',
        isActive: data.user.isActive,
        isAvailableForLeads: data.user.isAvailableForLeads ?? true,
        leadHoursStart: data.user.leadHoursStart ?? '',
        leadHoursEnd: data.user.leadHoursEnd ?? '',
      });
      setBrandIds((data.user.brandSpecializations || []).map((s: { brandId: string }) => s.brandId));
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/vehicles/brands');
      if (response.ok) setBrands(await response.json());
    } catch {
      // Non-fatal — specialization multi-select just stays empty.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          dealerId: formData.dealerId || null,
          isActive: formData.isActive,
          isAvailableForLeads: formData.isAvailableForLeads,
          leadHoursStart: formData.leadHoursStart === '' ? null : Number(formData.leadHoursStart),
          leadHoursEnd: formData.leadHoursEnd === '' ? null : Number(formData.leadHoursEnd),
          brandIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      setDeleting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading user...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader title="Edit User" description="Update user information and permissions" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          User updated successfully! Redirecting...
        </div>
      )}

      <Card padding="none">
        <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="e.g., user@geelyethiopia.com"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              User Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <RolePermissionPreview role={formData.role} />
          </div>

          {/* Dealer ID (Optional) */}
          <div>
            <label htmlFor="dealerId" className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              Dealer ID (Optional)
            </label>
            <input
              type="text"
              id="dealerId"
              name="dealerId"
              value={formData.dealerId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="Leave empty for headquarters staff"
            />
            <p className="mt-1 text-xs text-gray-500">
              Assign this user to a specific dealer location (for dealer-specific staff)
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-geely-blue rounded focus:ring-geely-blue"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              User account is active and can log in
            </label>
          </div>

          {/* Lead-assignment factors (Settings > Lead Assignment Rules) */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Lead Assignment</h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAvailableForLeads"
                name="isAvailableForLeads"
                checked={formData.isAvailableForLeads}
                onChange={handleChange}
                className="w-4 h-4 text-geely-blue rounded focus:ring-geely-blue"
              />
              <label htmlFor="isAvailableForLeads" className="text-sm text-gray-700">
                Available for leads (only used if the "Agent availability" factor is enabled)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div>
                <label htmlFor="leadHoursStart" className="block text-xs font-medium text-gray-500 mb-1">
                  Lead hours start (0-23)
                </label>
                <input
                  type="number"
                  id="leadHoursStart"
                  name="leadHoursStart"
                  min={0}
                  max={23}
                  value={formData.leadHoursStart}
                  onChange={handleChange}
                  placeholder="No restriction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="leadHoursEnd" className="block text-xs font-medium text-gray-500 mb-1">
                  Lead hours end (0-23)
                </label>
                <input
                  type="number"
                  id="leadHoursEnd"
                  name="leadHoursEnd"
                  min={0}
                  max={23}
                  value={formData.leadHoursEnd}
                  onChange={handleChange}
                  placeholder="No restriction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                />
              </div>
            </div>

            {brands.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Vehicle brand specialization (only used if the "Specialization" factor is enabled)
                </label>
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => {
                    const checked = brandIds.includes(brand.id);
                    return (
                      <label
                        key={brand.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer ${
                          checked ? 'bg-geely-blue/10 border-geely-blue text-geely-blue' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={checked}
                          onChange={() =>
                            setBrandIds((prev) =>
                              checked ? prev.filter((b) => b !== brand.id) : [...prev, brand.id]
                            )
                          }
                        />
                        {brand.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-xl">
          <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting || saving}>
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete User'}
          </Button>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={saving || deleting}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
        </form>
      </Card>
    </div>
  );
}
