'use client';

import { useState, useEffect } from 'react';
import { Search, X, Car, Newspaper, MapPin, Wrench } from 'lucide-react';
import Link from 'next/link';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, selectedCategory]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&category=${selectedCategory}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'dealers', label: 'Dealers', icon: MapPin },
    { id: 'services', label: 'Services', icon: Wrench },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 md:p-20">
        <div className="relative bg-white dark:bg-midnight-surface rounded-lg shadow-2xl w-full max-w-3xl">
          {/* Search Input */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vehicles, news, dealers..."
                className="flex-1 text-lg outline-none"
                autoFocus
              />
              <button
                onClick={onClose}
                aria-label="Close search"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="p-4 border-b flex gap-2 overflow-x-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                Searching...
              </div>
            ) : query.length < 2 ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Type at least 2 characters to search</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="divide-y">
                {results.map((result, index) => (
                  <Link
                    key={index}
                    href={result.url}
                    onClick={onClose}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {result.type === 'vehicle' && <Car className="w-5 h-5 text-blue-600 mt-1" />}
                      {result.type === 'news' && <Newspaper className="w-5 h-5 text-green-600 mt-1" />}
                      {result.type === 'dealer' && <MapPin className="w-5 h-5 text-red-600 mt-1" />}
                      {result.type === 'service' && <Wrench className="w-5 h-5 text-purple-600 mt-1" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{result.title}</h3>
                        {result.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {result.description}
                          </p>
                        )}
                        <span className="text-xs text-gray-400 mt-1 inline-block capitalize">
                          {result.type}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
            Press <kbd className="px-2 py-1 bg-white dark:bg-midnight-surface border rounded">ESC</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}
