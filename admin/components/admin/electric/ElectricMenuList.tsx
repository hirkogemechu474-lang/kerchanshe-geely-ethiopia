'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Edit, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface ElectricItem {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  url: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  page?: {
    id: string;
    slug: string;
    isPublished: boolean;
  } | null;
}

interface ElectricSection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  displayOrder: number;
  items: ElectricItem[];
}

export default function ElectricMenuList() {
  const [sections, setSections] = useState<ElectricSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/electric/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
        // Expand sections that have items
        const sectionsWithItems = data.sections?.filter((s: ElectricSection) => s.items?.length > 0) || [];
        setExpandedSections(new Set(sectionsWithItems.map((s: ElectricSection) => s.id)));
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!confirm(`Are you sure you want to delete the "${sectionTitle}" section? This will also delete all items in this section.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/electric/sections/${sectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSections(); // Refresh the list
      } else {
        alert('Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const handleDeleteItem = async (itemId: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to delete the "${itemTitle}" item?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/electric/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSections(); // Refresh the list
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading electric menu...</span>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No electric menu sections yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first section to get started with the electric menu
        </p>
        <Link
          href="/admin/electric/sections/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          Create First Section
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => toggleSection(section.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>

              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">⚡</div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {section.title}
                    {section.isActive ? (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {section.items?.length || 0} item{(section.items?.length || 0) !== 1 ? 's' : ''}
                    {section.description && ` • ${section.description}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/electric/items/new?sectionId=${section.id}`}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Add item to this section"
              >
                <Plus className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/electric/sections/${section.id}/edit`}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit section"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleDeleteSection(section.id, section.title)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Items */}
          {expandedSections.has(section.id) && (
            <div className="bg-white">
              {section.items?.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {section.items
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((item) => (
                      <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="ml-8 text-xl">{item.icon || '🔗'}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              {item.title}
                              {item.isFeatured && (
                                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">Featured</span>
                              )}
                              {item.isActive ? (
                                <Eye className="w-4 h-4 text-green-600" aria-label="Active" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" aria-label="Inactive" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {item.description || 'No description'}
                              {item.url && (
                                <span className="ml-2 text-blue-600">→ {item.url}</span>
                              )}
                            </p>
                            {item.page && (
                              <p className="text-xs text-gray-500 mt-1">
                                Page: {item.page.slug} 
                                {item.page.isPublished ? (
                                  <span className="text-green-600 ml-1">✓ Published</span>
                                ) : (
                                  <span className="text-gray-500 ml-1">○ Draft</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/electric/items/${item.id}/edit`}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit item"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  <p className="mb-2">No items in this section yet</p>
                  <Link
                    href={`/admin/electric/items/new?sectionId=${section.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add the first item →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
