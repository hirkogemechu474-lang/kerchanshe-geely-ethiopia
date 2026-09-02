'use client';

import { useEffect, useState } from 'react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export function useFAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/public/faq')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.faqs)) setFaqs(data.faqs);
      })
      .catch(() => {
        if (active) setFaqs([]);
      });
    return () => { active = false; };
  }, []);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return { faqs, expandedId, toggle };
}
