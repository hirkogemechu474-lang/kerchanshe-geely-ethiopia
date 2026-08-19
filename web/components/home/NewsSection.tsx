'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  publishDate: string | null;
  createdAt: string;
  imageUrl: string | null;
  excerpt: string | null;
}

export default function NewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/news')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading news:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="py-[70px] pt-0">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="text-center text-gray-500">Loading news...</div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null; // Don't show section if no articles
  }

  return (
    <section className="py-[70px] pt-0">
      <div className="max-w-[1280px] mx-auto px-10">
        {/* Section Header */}
        <div className="flex justify-between items-end mb-9">
          <div>
            <h2 className="disp text-[30px] text-navy font-bold mb-2">
              News & Stories
            </h2>
            <p className="text-steel text-sm">
              Product launches, market news and ownership guides.
            </p>
          </div>
          <Link
            href="/news"
            className="text-[13px] font-bold text-geely-blue border-b border-geely-blue pb-1 hover:opacity-80 transition-opacity"
          >
            View all →
          </Link>
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {articles.slice(0, 3).map((article) => {
            const date = article.publishDate 
              ? new Date(article.publishDate) 
              : new Date(article.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            }).toUpperCase();

            return (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                className="group"
              >
                {/* Image */}
                <div className="h-[140px] bg-[#eef2f8] border border-line rounded-t-lg overflow-hidden">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="flex items-center justify-center text-[11px] text-steel text-center px-4 h-full">
                            ${article.title}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center text-[11px] text-steel text-center px-4 h-full">
                      {article.title}
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="border border-t-0 border-line rounded-b-lg p-5 group-hover:border-geely-blue transition-colors">
                  <div className="text-[11px] text-gold font-bold tracking-wider mb-2">
                    {formattedDate}
                  </div>
                  <h4 className="text-[15px] text-navy font-semibold leading-snug group-hover:text-geely-blue transition-colors">
                    {article.title}
                  </h4>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
