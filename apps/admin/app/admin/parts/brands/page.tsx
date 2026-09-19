'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, ImageIcon } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface Brand {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

const emptyForm = { name: '', description: '', imageUrl: '', displayOrder: 0, isActive: true };

export default function PartBrandsPage() {
  useAdminAuth('canManageSpareParts');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/parts/admin/parts/brands');
      const data = await response.json();
      if (data.brands) setBrands(data.brands);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editing ? `/api/parts/admin/parts/brands/${editing.id}` : '/api/parts/admin/parts/brands';
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save brand');

      setMessage({ type: 'success', text: editing ? 'Brand updated' : 'Brand created' });
      setShowForm(false);
      setEditing(null);
      setFormData(emptyForm);
      fetchBrands();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save brand' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    try {
      const response = await fetch(`/api/parts/admin/parts/brands/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Brand deleted' });
        fetchBrands();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete brand' });
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
    }
  };

  const startEdit = (brand: Brand) => {
    setEditing(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      imageUrl: brand.imageUrl || '',
      displayOrder: brand.displayOrder,
      isActive: brand.isActive,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-geely-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/parts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supported Brands</h1>
            <p className="mt-1 text-sm text-gray-500">Manage vehicle brands shown for parts compatibility</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setFormData(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 bg-geely-blue text-white px-4 py-2 rounded-lg hover:bg-navy transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Brand
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Brand' : 'New Brand'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Geely, Emgrand, Coolray"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4" /> Brand Logo
              </label>
              <FileUpload
                value={formData.imageUrl || undefined}
                onChange={(v) => setFormData({ ...formData, imageUrl: v as string })}
                label="brand logo"
                previewHeight="h-24"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Optional description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 pb-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-geely-blue rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-geely-blue text-white px-6 py-2 rounded-lg hover:bg-navy disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Update Brand' : 'Create Brand'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {brands.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No brands yet. Add brands for parts compatibility.
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {brand.imageUrl && (
                        <img src={brand.imageUrl} alt={brand.name} className="w-10 h-10 object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <span className="font-medium text-gray-900">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 line-clamp-1">{brand.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => startEdit(brand)} className="inline-flex items-center gap-1 text-geely-blue hover:text-navy">
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => handleDelete(brand.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}