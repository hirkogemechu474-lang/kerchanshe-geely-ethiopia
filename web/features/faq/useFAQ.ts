'use client';

import { useState } from 'react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const mockFAQs: FAQ[] = [
  {
    id: '1',
    question: 'What is the warranty period for Geely vehicles?',
    answer: '5 years or 150,000 km, whichever comes first.',
    category: 'warranty',
  },
  {
    id: '2',
    question: 'Do you offer financing options?',
    answer: 'Yes, we partner with major Ethiopian banks for flexible financing.',
    category: 'financing',
  },
];

export function useFAQ() {
  const [faqs] = useState(mockFAQs);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return { faqs, expandedId, toggle };
}
