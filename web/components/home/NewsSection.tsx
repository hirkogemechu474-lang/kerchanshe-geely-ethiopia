import Link from "next/link";
import Image from "next/image";
import imageLoader from "@/lib/imageLoader";

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  publishDate: string | null;
  createdAt: string;
  imageUrl: string | null;
  excerpt: string | null;
}

interface NewsSectionProps {
  // Fetched server-side (see app/page.tsx) so cards render on first paint
  // instead of a "Loading news..." shell that pops in after a client fetch.
  initialArticles: NewsArticle[];
}

export default function NewsSection({ initialArticles }: NewsSectionProps) {
  const articles = initialArticles;

  if (articles.length === 0) {
    return null; // Don't show section if no articles
  }

  return (
    <section className="py-[70px] pt-0">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex justify-between items-end mb-9">
          <div>
            <h2 className="disp text-[30px] text-navy dark:text-ice font-bold mb-2">
              News & Stories
            </h2>
            <p className="text-steel dark:text-steel-light text-sm">
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
                <div className="relative h-[140px] bg-[#eef2f8] dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-t-lg overflow-hidden">
                  {article.imageUrl ? (
                    <Image
                      src={article.imageUrl}
                      alt=""
                      loader={imageLoader}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-[11px] text-steel dark:text-steel-light text-center px-4 h-full">
                      {article.title}
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="border border-t-0 border-line dark:border-midnight-line rounded-b-lg p-5 group-hover:border-geely-blue transition-colors">
                  <div className="text-[11px] text-gold font-bold tracking-wider mb-2">
                    {formattedDate}
                  </div>
                  <h3 className="text-[15px] text-navy dark:text-ice font-semibold leading-snug group-hover:text-geely-blue transition-colors">
                    {article.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
