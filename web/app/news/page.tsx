import { MainLayout } from "@/components/MainLayout";
import { Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withBasePath } from "@/lib/publicPath";

export default async function NewsPage() {
  const articles = await prisma.newsArticle.findMany({
    where: {
      status: "published",
    },
    orderBy: [{ publishDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      author: true,
      content: true,
      imageUrl: true,
      excerpt: true,
      publishDate: true,
      createdAt: true,
    },
  });

  return (
    <MainLayout>
      <div className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="mb-3 text-[13px] font-bold tracking-[0.14em] text-gold">
            LATEST UPDATES
          </div>
          <h1 className="disp mb-4 text-5xl font-bold">News & Stories</h1>
          <p className="max-w-2xl text-base text-[#d8e4f5]">
            Stay up to date with the latest Geely Ethiopia news, product launches, industry insights,
            and company updates.
          </p>
        </div>
      </div>

      <section className="bg-ice dark:bg-midnight py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          {articles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-gray-500">No news articles published yet</p>
              <p className="text-sm text-gray-400">Check back soon for updates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const publishDate = article.publishDate || article.createdAt;
                const excerpt = article.excerpt || article.content.substring(0, 150) + "...";

                return (
                  <Link
                    key={article.id}
                    href={`/news/${article.id}`}
                    className="group overflow-hidden rounded-lg border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface transition-all hover:shadow-lg"
                  >
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec]">
                      {article.imageUrl ? (
                        <img
                          src={withBasePath(article.imageUrl)}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-steel dark:text-steel-light">
                          {article.title}
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="mb-3 flex items-center gap-4 text-xs text-steel dark:text-steel-light">
                        <div className="flex items-center gap-1">
                          <Tag size={14} />
                          <span className="capitalize">{article.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>
                            {new Date(publishDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <h3 className="mb-3 text-xl font-bold text-navy dark:text-ice transition-colors group-hover:text-geely-blue line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-steel dark:text-steel-light line-clamp-3">
                        {excerpt}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-steel dark:text-steel-light">By {article.author}</span>
                        <span className="font-semibold text-geely-blue group-hover:underline">
                          Read more -
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
