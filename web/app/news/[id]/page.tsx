import { MainLayout } from "@/components/MainLayout";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, User, ArrowLeft, Share2, Edit } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import NewsImageWithFallback from "./NewsImageWithFallback";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewsArticlePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  // Fetch article from database
  const article = await prisma.newsArticle.findUnique({
    where: { id },
  });

  if (!article) {
    notFound();
  }

  // Increment view count
  await prisma.newsArticle.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  // Fetch related articles
  const relatedArticles = await prisma.newsArticle.findMany({
    where: {
      id: { not: id },
      category: article.category,
      status: 'published',
    },
    take: 3,
    orderBy: { publishDate: 'desc' },
  });

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const isAdmin = session?.user?.role === 'admin' || session?.user?.permissions?.canManageContent;

  return (
    <MainLayout>
      {/* Breadcrumbs */}
      <div className="bg-ice py-4 border-b border-line">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="flex items-center gap-2 text-sm text-steel">
            <Link href="/" className="hover:text-geely-blue">Home</Link>
            <span>/</span>
            <Link href="/news" className="hover:text-geely-blue">News</Link>
            <span>/</span>
            <span className="text-navy font-medium">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <div className="bg-white py-12 border-b border-line">
        <div className="max-w-[900px] mx-auto px-10">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-geely-blue hover:underline"
            >
              <ArrowLeft size={18} />
              Back to News
            </Link>
            
            {isAdmin && (
              <Link
                href={`/admin/news/${article.id}/edit`}
                className="inline-flex items-center gap-2 text-white bg-geely-blue hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Edit size={16} />
                Edit Article
              </Link>
            )}
          </div>

          <div className="mb-6">
            <span className="inline-block bg-geely-blue text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
              {article.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">
              {article.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-steel">
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
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg border border-line"
              />
            </div>
          )}
        </div>
      </div>

      {/* Article Content */}
      <article className="py-12">
        <div className="max-w-[900px] mx-auto px-10">
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
        <section className="py-12 bg-ice border-t border-line">
          <div className="max-w-[1280px] mx-auto px-10">
            <h2 className="text-2xl font-bold text-navy mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/news/${related.id}`}
                  className="bg-white border border-line rounded-lg overflow-hidden hover:border-geely-blue hover:shadow-lg transition-all group"
                >
                  <div className="p-6">
                    <div className="text-xs text-gold font-bold mb-2">
                      {related.category}
                    </div>
                    <h3 className="text-lg font-bold text-navy mb-2 group-hover:text-geely-blue transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <div className="text-sm text-steel flex items-center gap-4">
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
