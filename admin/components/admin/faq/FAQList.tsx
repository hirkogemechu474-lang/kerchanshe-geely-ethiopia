'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Eye, EyeOff, Star, HelpCircle, Loader2 } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FAQList() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/admin/faq');
      const data = await response.json();
      
      if (data.success) {
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading FAQs...</span>
      </div>
    );
  }

  // Get unique categories
  const categories = ['all', ...new Set(faqs.map(faq => faq.category).filter((category): category is string => Boolean(category)))];

  // Filter FAQs by category
  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  if (faqs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 mb-4">
          <HelpCircle className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No FAQs yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first FAQ to help customers find answers quickly
        </p>
        <Link
          href="/admin/faq/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <HelpCircle className="w-5 h-5" />
          Create First FAQ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      {categories.length > 2 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <select
            value={selectedCategory ?? ''}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total FAQs</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{faqs.length}</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {faqs.filter(faq => faq.isActive).length}
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Featured</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {faqs.filter(faq => faq.isFeatured).length}
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Categories</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {categories.length - 1}
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {filteredFAQs.map((faq) => (
          <div key={faq.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {faq.question}
                  </h3>
                  
                  {faq.isFeatured && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                      <Star className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                  
                  {faq.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      <Eye className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      <EyeOff className="w-3 h-3" />
                      Inactive
                    </span>
                  )}

                  {faq.category && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {faq.category}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                  {faq.answer.replace(/<[^>]*>/g, '')} {/* Strip HTML tags for preview */}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Order: {faq.displayOrder}</span>
                  <span>Created: {new Date(faq.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(faq.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/admin/faq/${faq.id}/edit`}
                  className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
                  title="Edit FAQ"
                >
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredFAQs.length === 0 && selectedCategory !== 'all' && (
        <div className="text-center py-8 text-gray-500">
          No FAQs found in the "{selectedCategory}" category
        </div>
      )}
    </div>
  );
}
