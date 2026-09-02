import { MainLayout } from "@/components/MainLayout";
import { serverApiClient } from "@/lib/serverApiClient";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, User, ArrowLeft, Share2 } from "lucide-react";
import NewsImageWithFallback from "./NewsImageWithFallback";
import { withBasePath } from "@/lib/publicPath";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewsArticlePage({ params }: Props) {
  const { id } = await params;

  // Fetches the article, increments its view count, and returns related
  // articles in one call (see backend/src/routes/public.routes.ts GET /news/:id).
  const client = await serverApiClient();
  const article = await client
    .get(`/public/news/${id}`)
    .then((r) => r.data)
    .catch(() => null);

  if (!article) {
    notFound();
  }

  const relatedArticles = article.related || [];

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <MainLayout>
      {/* Breadcrumbs */}
      <div className="bg-ice dark:bg-midnight py-4 border-b border-line dark:border-midnight-line">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2 text-sm text-steel dark:text-steel-light">
            <Link href="/" className="hover:text-geely-blue">Home</Link>
            <span>/</span>
            <Link href="/news" className="hover:text-geely-blue">News</Link>
            <span>/</span>
            <span className="text-navy dark:text-ice font-medium">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-white dark:bg-midnight-surface py-12 border-b border-line dark:border-midnight-line">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-geely-blue hover:underline"
            >
              <ArrowLeft size={18} />
              Back to News
            </Link>
          </div>

          <div className="mb-6">
            <span className="inline-block bg-geely-blue text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
              {article.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-navy dark:text-ice mb-4">
              {article.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-steel dark:text-steel-light">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{formatDate(article.publishDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{article.views} views</span>
            </div>
            <button className="flex items-center gap-2 text-geely-blue hover:underline ml-auto">
              <Share2 size={16} />
              Share
            </button>
          </div>

          {/* Featured Image */}
          {article.imageUrl && (
            <div className="mt-8">
              <NewsImageWithFallback
                src={withBasePath(article.imageUrl)}
                alt={article.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg border border-line dark:border-midnight-line"
              />
            </div>
          )}
        </div>
      </div>

      {/* Article Content */}
      <article className="py-12">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="prose prose-lg max-w-none">
            <div
              dangerouslySetInnerHTML={{ __html: article.content }}
              className="text-gray-800 leading-relaxed"
            />
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-12 bg-ice dark:bg-midnight border-t border-line dark:border-midnight-line">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <h2 className="text-2xl font-bold text-navy dark:text-ice mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/news/${related.id}`}
                  className="bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-lg overflow-hidden hover:border-geely-blue hover:shadow-lg transition-all group"
                >
                  <div className="p-6">
                    <div className="text-xs text-gold font-bold mb-2">
                      {related.category}
                    </div>
                    <h3 className="text-lg font-bold text-navy dark:text-ice mb-2 group-hover:text-geely-blue transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <div className="text-sm text-steel dark:text-steel-light flex items-center gap-4">
                      <span>{formatDate(related.publishDate)}</span>
                      <span>•</span>
                      <span>{related.author}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to News */}
      <div className="py-12 text-center">
        <Link
          href="/news"
          className="inline-block bg-navy text-white font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          View All News
        </Link>
      </div>
    </MainLayout>
  );
}
