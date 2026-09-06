'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Edit, Trash2, GripVertical } from 'lucide-react';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, Badge, Card, EmptyState } from '@/components/admin/ui';

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
    <>
      {/* Tablet / desktop: full table, unchanged */}
      <div className="hidden md:block">
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
                    <code className="text-sm text-geely-blue bg-blue-50 px-2 py-1 rounded">
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
                        href={`${process.env.NEXT_PUBLIC_SITE_URL}/category/${category.slug}`}
                        target="_blank"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="View page"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className="p-2 text-geely-blue hover:bg-blue-50 rounded transition-colors"
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
      </div>

      {/* Phone: vertical card stack with larger tap targets */}
      <div className="md:hidden space-y-3">
        {categories.length === 0 ? (
          <Card padding="none">
            <EmptyState
              title="No categories found"
              description="Create your first category to get started."
            />
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} padding="sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {category.name}
                  </div>
                  <code className="inline-block mt-1 text-xs text-geely-blue bg-blue-50 dark:bg-geely-blue/20 dark:text-blue-bright px-2 py-0.5 rounded">
                    /{category.slug}
                  </code>
                </div>
                <Badge tone={category.isActive ? 'green' : 'gray'}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {category.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2">
                  {category.description}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span>{category.brand?.name || 'All Brands'}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {category._count.vehicles} vehicle{category._count.vehicles === 1 ? '' : 's'}
                </span>
                <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                  <GripVertical size={14} />
                  Order {category.displayOrder}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href={`${process.env.NEXT_PUBLIC_SITE_URL}/category/${category.slug}`}
                  target="_blank"
                  className="p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="View page"
                >
                  <Eye size={20} />
                </Link>
                <Link
                  href={`/admin/categories/${category.id}/edit`}
                  className="p-3 text-geely-blue hover:bg-blue-50 dark:hover:bg-geely-blue/20 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit size={20} />
                </Link>
                <button
                  onClick={() => handleDelete(category.id)}
                  disabled={deleting || category._count.vehicles > 0}
                  className="p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={category._count.vehicles > 0 ? 'Remove vehicles first' : 'Delete'}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
