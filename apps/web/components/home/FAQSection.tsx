'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Loader2 } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  isFeatured: boolean;
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/public/faq');
      const data = await response.json();

      // The backend returns a bare array of FAQ rows (not a
      // { success, faqs, categories } envelope) — derive categories
      // client-side from whatever real categories are actually present.
      const rows: FAQ[] = Array.isArray(data) ? data : [];
      setFaqs(rows);
      setCategories([...new Set(rows.map((f) => f.category).filter((c): c is string => Boolean(c)))]);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-midnight-surface transition-colors">
        <div className="page-container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-active-blue" />
            <span className="ml-2 text-gray-600 dark:text-steel-light">Loading FAQs...</span>
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) {
    return null; // Don't render if no FAQs
  }

  // Filter FAQs
  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  // Prioritize featured FAQs
  const sortedFAQs = filteredFAQs.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  return (
    <section className="py-16 bg-white">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-active-blue/10 text-active-blue px-4 py-2 rounded-full text-sm font-bold mb-4">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-navy dark:text-ice mb-4">
            Got Questions? We Have Answers
          </h2>
          <p className="text-steel dark:text-steel-light text-lg max-w-2xl mx-auto">
            Find quick answers to the most common questions about Geely vehicles, services, and ownership.
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-active-blue text-white'
                    : 'bg-gray-100 dark:bg-midnight text-gray-700 dark:text-steel-light hover:bg-gray-200 dark:hover:bg-midnight-surface'
                }`}
              >
                All Questions
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    selectedCategory === category
                      ? 'bg-active-blue text-white'
                      : 'bg-gray-100 dark:bg-midnight text-gray-700 dark:text-steel-light hover:bg-gray-200 dark:hover:bg-midnight-surface'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {sortedFAQs.map((faq, index) => (
              <div
                key={faq.id}
                className={`bg-white dark:bg-midnight border border-gray-200 dark:border-midnight-line rounded-lg overflow-hidden transition-all duration-300 ${
                  openFAQ === faq.id ? 'shadow-lg border-active-blue' : 'hover:shadow-md'
                } ${faq.isFeatured ? 'ring-2 ring-accent-yellow ring-opacity-30' : ''}`}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-active-blue focus:ring-inset"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {faq.isFeatured && (
                        <div className="flex-shrink-0 w-2 h-2 bg-accent-yellow rounded-full mt-3"></div>
                      )}
                      <h3 className="font-semibold text-navy dark:text-ice text-lg pr-4">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      {openFAQ === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 dark:text-steel-light" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 dark:text-steel-light" />
                      )}
                    </div>
                  </div>
                </button>
                
                {openFAQ === faq.id && (
                  <div className="px-6 pb-4">
                    <div className={`pt-2 ${faq.isFeatured ? 'pl-5' : ''}`}>
                      <div 
                        className="text-steel dark:text-steel-light leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Featured Legend */}
          {sortedFAQs.some(faq => faq.isFeatured) && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-accent-yellow rounded-full"></div>
                Featured questions
              </div>
            </div>
          )}
        </div>

        {/* No Results */}
        {filteredFAQs.length === 0 && selectedCategory !== 'all' && (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No questions found in the "{selectedCategory}" category
            </p>
          </div>
        )}
      </div>
    </section>
  );
}