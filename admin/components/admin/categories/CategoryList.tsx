'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Edit, Trash2, GripVertical } from 'lucide-react';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, Badge } from '@/components/admin/ui';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  brand: { id: string; name: string } | null;
  _count: {
    vehicles: number;
  };
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories?includeInactive=true');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== id));
        setDeleteId(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <TableCard>
      <THead>
        <tr>
          <Th className="w-12">Order</Th>
          <Th>Name</Th>
          <Th>Slug</Th>
          <Th>Brand</Th>
          <Th>Vehicles</Th>
          <Th>Status</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </THead>
      <TBody>
        {categories.length === 0 ? (
          <EmptyTableRow colSpan={7} message="No categories found. Create your first category to get started." />
        ) : (
          categories.map((category) => (
            <Tr key={category.id}>
              <Td>
                <div className="flex items-center gap-2">
                  <GripVertical className="text-gray-400" size={16} />
                  <span className="text-gray-600">{category.displayOrder}</span>
                </div>
              </Td>
              <Td>
                <div className="font-medium text-gray-900">{category.name}</div>
                {category.description && (
                  <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                    {category.description}
                  </div>
                )}
              </Td>
              <Td>
                <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  /{category.slug}
                </code>
              </Td>
              <Td className="text-gray-600">{category.brand?.name || 'All Brands'}</Td>
              <Td className="font-medium text-gray-900">{category._count.vehicles}</Td>
              <Td>
                <Badge tone={category.isActive ? 'green' : 'gray'}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3002'}/category/${category.slug}`}
                    target="_blank"
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="View page"
                  >
                    <Eye size={18} />
                  </Link>
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={deleting || category._count.vehicles > 0}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={category._count.vehicles > 0 ? 'Remove vehicles first' : 'Delete'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))
        )}
      </TBody>
    </TableCard>
  );
}
