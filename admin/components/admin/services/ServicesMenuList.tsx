'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Plus, Eye, EyeOff, ChevronDown, ChevronRight, FileText, Menu } from 'lucide-react';

interface ServicePage {
  id: string;
  slug: string;
  isPublished: boolean;
}

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  page: ServicePage | null;
}

interface ServiceSection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  items: ServiceItem[];
}

export default function ServicesMenuList() {
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/services/sections');
      const data = await response.json();
      if (data.success) {
        setSections(data.sections || []);
        // Expand all sections by default
        setExpandedSections(new Set(data.sections.map((s: ServiceSection) => s.id)));
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

  const handleDeleteSection = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the section "${title}"? This will also delete all items in this section.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/services/sections/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSections(sections.filter(s => s.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section');
    }
  };

  const handleDeleteItem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the menu item "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/services/items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSections(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading services menu...</div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Menu className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sections Yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first section to start building the Services menu
        </p>
        <Link
          href="/admin/services-menu/sections/new"
          className="inline-flex items-center gap-2 bg-geely-blue text-white px-6 py-3 rounded-lg hover:bg-navy transition-colors"
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
        <div
          key={section.id}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          {/* Section Header */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => toggleSection(section.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {expandedSections.has(section.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                  {section.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <Eye size={12} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <EyeOff size={12} />
                      Inactive
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {section.description && (
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/services-menu/items/new?sectionId=${section.id}`}
                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Add item to this section"
              >
                <Plus size={18} />
              </Link>
              <Link
                href={`/admin/services-menu/sections/${section.id}/edit`}
                className="p-2 text-geely-blue hover:bg-blue-50 rounded transition-colors"
                title="Edit section"
              >
                <Edit size={18} />
              </Link>
              <button
                onClick={() => handleDeleteSection(section.id, section.title)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete section"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Section Items */}
          {expandedSections.has(section.id) && (
            <div className="divide-y divide-gray-200">
              {section.items.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p className="mb-3">No items in this section yet</p>
                  <Link
                    href={`/admin/services-menu/items/new?sectionId=${section.id}`}
                    className="inline-flex items-center gap-2 text-geely-blue hover:text-navy font-medium"
                  >
                    <Plus size={16} />
                    Add First Item
                  </Link>
                </div>
              ) : (
                section.items.map((item) => (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {item.iconUrl && (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <img src={item.iconUrl} alt="" className="w-6 h-6" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            {item.isFeatured && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                Featured
                              </span>
                            )}
                            {item.isActive ? (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                Inactive
                              </span>
                            )}
                            {item.page ? (
                              item.page.isPublished ? (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  Published
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                  Draft
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                No Page
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                          {item.page && (
                            <code className="text-xs text-gray-500 mt-1 inline-block">
                              /services/{item.page.slug}
                            </code>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.page && item.page.isPublished && (
                          <Link
                            href={`/services/${item.page.slug}`}
                            target="_blank"
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="View page"
                          >
                            <Eye size={18} />
                          </Link>
                        )}
                        {item.page && (
                          <Link
                            href={`/admin/services-menu/pages/${item.page.id}/edit`}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Edit page content"
                          >
                            <FileText size={18} />
                          </Link>
                        )}
                        <Link
                          href={`/admin/services-menu/items/${item.id}/edit`}
                          className="p-2 text-geely-blue hover:bg-blue-50 rounded transition-colors"
                          title="Edit menu item"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
