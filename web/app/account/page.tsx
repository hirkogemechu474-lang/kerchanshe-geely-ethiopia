import { requireCustomer } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  User, Mail, LogOut, Newspaper, Tag, Calendar,
  Car, Wrench, FileText, ChevronRight,
} from 'lucide-react';

export const metadata = { title: 'My Account | Geely Ethiopia' };

export default async function AccountPage() {
  const customer = await requireCustomer();

  // Fetch latest published news and active promotions in parallel
  const [news, promotions] = await Promise.all([
    prisma.newsArticle.findMany({
      where: { status: 'published' },
      orderBy: { publishDate: 'desc' },
      take: 4,
      select: { id: true, title: true, category: true, excerpt: true, imageUrl: true, publishDate: true },
    }),
    prisma.promotion.findMany({
      where: { isActive: true, endDate: { gte: new Date() } },
      orderBy: { displayOrder: 'asc' },
      take: 3,
      select: { id: true, title: true, description: true, bannerImage: true, endDate: true, ctaButtonText: true, ctaButtonLink: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-gradient-to-r from-navy to-geely-blue text-white py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="mt-1 text-blue-100">Welcome back, {customer.name}!</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── Profile card ──────────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-midnight-surface rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-geely-blue flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{customer.name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {customer.email}
              </p>
              <span className="inline-block mt-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                {customer.role}
              </span>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </section>

        {/* ── Quick actions ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/test-drive', icon: Car, label: 'Book a Test Drive', desc: 'Schedule time with our team' },
              { href: '/quote', icon: FileText, label: 'Request a Quote', desc: 'Get pricing on any model' },
              { href: '/service', icon: Wrench, label: 'Book a Service', desc: 'Schedule vehicle maintenance' },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 bg-white dark:bg-midnight-surface border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-geely-blue/30 transition-all group"
              >
                <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-geely-blue group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5 text-geely-blue group-hover:text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-500 truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Active promotions ─────────────────────────────────────────────── */}
        {promotions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-geely-blue" /> Current Offers
              </h2>
              <Link href="/promotions" className="text-sm text-geely-blue hover:underline">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {promotions.map((promo: any) => (
                <div
                  key={promo.id}
                  className="bg-white dark:bg-midnight-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                >
                  {promo.bannerImage && (
                    <img
                      src={promo.bannerImage}
                      alt={promo.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{promo.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 flex-1">{promo.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Ends {new Date(promo.endDate).toLocaleDateString('en-ET', { day: 'numeric', month: 'short' })}
                      </span>
                      {promo.ctaButtonLink && (
                        <Link
                          href={promo.ctaButtonLink}
                          className="text-xs font-semibold text-geely-blue hover:underline"
                        >
                          {promo.ctaButtonText || 'Learn more'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Latest news & updates ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-geely-blue" /> Latest Updates
            </h2>
            <Link href="/news" className="text-sm text-geely-blue hover:underline">
              See all →
            </Link>
          </div>

          {news.length === 0 ? (
            <div className="bg-white dark:bg-midnight-surface rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              No updates yet — check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {news.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="flex gap-4 bg-white dark:bg-midnight-surface rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-geely-blue/30 transition-all group"
                >
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Newspaper className="w-8 h-8 text-geely-blue/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-geely-blue">
                      {article.category}
                    </span>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5 line-clamp-2 group-hover:text-geely-blue transition-colors">
                      {article.title}
                    </p>
                    {article.excerpt && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{article.excerpt}</p>
                    )}
                    {article.publishDate && (
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(article.publishDate).toLocaleDateString('en-ET', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
