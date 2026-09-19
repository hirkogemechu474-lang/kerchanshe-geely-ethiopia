'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, Hash, Tag, DollarSign, TrendingUp, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import FileUpload from '@/components/admin/FileUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface Category {
  id: string;
  name: string;
}

export default function EditSparePartPage() {
  useAdminAuth('canManageSpareParts');
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    partCategoryId: '',
    description: '',
    imageUrl: '',
    brand: '',
    stock: '',
    reorderPoint: '',
    price: '',
    supplier: '',
    isFeatured: false,
    displayOrder: '0',
    isActive: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const [categoryRes, { items: spareParts }] = await Promise.all([
          fetch('/api/parts/admin/parts/categories'),
          fetch('/api/parts?pageSize=1000').then((r) => r.json()),
        ]);
        const catData = await categoryRes.json();
        setCategories(catData || []);

        const part = (spareParts || []).find((p: any) => p.id === id);
        if (!part) {
          setNotFound(true);
          return;
        }
        setFormData({
          name: part.name,
          sku: part.sku,
          category: part.category || '',
          partCategoryId: part.partCategoryId || '',
          description: part.description || '',
          imageUrl: part.imageUrl || '',
          brand: part.brand || '',
          stock: String(part.stock ?? ''),
          reorderPoint: String(part.reorderPoint ?? ''),
          price: String(part.price ?? ''),
          supplier: part.supplier || '',
          isFeatured: part.isFeatured || false,
          displayOrder: String(part.displayOrder ?? '0'),
          isActive: part.isActive !== false,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load part');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/parts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stock: parseInt(formData.stock) || 0,
          reorderPoint: parseInt(formData.reorderPoint) || 10,
          price: parseFloat(formData.price) || 0,
          displayOrder: parseInt(formData.displayOrder) || 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update spare part');
      router.push('/admin/parts');
    } catch (err: any) {
      setError(err.message || 'Failed to update spare part');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-geely-blue" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-600 mb-4">Part not found.</p>
        <Link href="/admin/parts" className="text-geely-blue hover:underline">Back to parts</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/parts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Spare Part</h1>
          <p className="mt-1 text-sm text-gray-500">{formData.sku}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-2" /> Part Name *
            </label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-2" /> SKU *
              </label>
              <input type="text" name="sku" value={formData.sku} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" /> Display Category *
              </label>
              <select name="category" value={formData.category} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent">
                {['engine','filters','brakes','electrical','body','interior','fluids','accessories','other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CMS Category (on /parts page)</label>
            <select name="partCategoryId" value={formData.partCategoryId} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent">
              <option value="">-- None --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Part Image</label>
              <FileUpload
                value={formData.imageUrl || undefined}
                onChange={(v) => setFormData({ ...formData, imageUrl: v as string })}
                label="part image"
                previewHeight="h-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Compatible Brand</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g., Coolray, Emgrand"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-2" /> Current Stock *
              </label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Point *</label>
              <input type="number" name="reorderPoint" value={formData.reorderPoint} onChange={handleChange} required min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" /> Unit Price (ETB) *
              </label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier *</label>
              <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Order (featured)</label>
              <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="w-4 h-4 text-geely-blue rounded" />
              <span className="text-sm text-gray-700 flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> Featured</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 text-geely-blue rounded" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between rounded-b-lg">
          <Link href="/admin/parts" className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">Cancel</Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-geely-blue text-white px-6 py-2 rounded-lg hover:bg-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}