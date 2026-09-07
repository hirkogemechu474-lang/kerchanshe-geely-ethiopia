import { MainLayout } from "@/components/MainLayout";
import { Calendar, Tag, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { serverApiClient } from "@/lib/serverApiClient";
import { withBasePath } from "@/lib/publicPath";
import { settingRepository } from "@/repositories/settingRepository";

// News and Geely Team are CMS-managed database content. Render this route on
// request so the production server (7502) sees the same saved content as the
// development server (7501), without requiring a rebuild after every edit.
export const dynamic = "force-dynamic";

type TeamMember = { id: string; name: string; role: string; bio: string; imageUrl: string; displayOrder: number; isActive: boolean };

const FALLBACK_TEAM: TeamMember[] = [
  { id: 'people', name: 'Our People', role: 'Geely Ethiopia Team', bio: 'A knowledgeable team focused on making every customer interaction clear and welcoming.', imageUrl: '', displayOrder: 0, isActive: true },
  { id: 'sales', name: 'Sales Team', role: 'Sales & Vehicle Specialists', bio: 'Guidance from choosing the right model to arranging your test drive and quotation.', imageUrl: '', displayOrder: 1, isActive: true },
  { id: 'service', name: 'Service Team', role: 'Service & Technical Support', bio: 'Professional support to keep your Geely performing at its best throughout ownership.', imageUrl: '', displayOrder: 2, isActive: true },
  { id: 'care', name: 'Customer Care', role: 'Customer Experience', bio: 'Friendly assistance whenever you need information, support, or a quick answer.', imageUrl: '', displayOrder: 3, isActive: true },
];

function teamImageUrl(imageUrl: string): string {
  if (!imageUrl.startsWith('/uploads/')) return withBasePath(imageUrl);
  const adminBase = process.env.NEXT_PUBLIC_ADMIN_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL;
  return adminBase ? `${adminBase.replace(/\/$/, '')}${imageUrl}` : withBasePath(imageUrl);
}

export default async function NewsPage() {
  const client = await serverApiClient();
  const { data: newsResponse } = await client
    .get("/public/news", { params: { pageSize: 50 } })
    .catch(() => ({ data: { items: [] } }));
  const articles = Array.isArray(newsResponse?.items) ? newsResponse.items : [];
  let team = FALLBACK_TEAM;
  const teamSetting = await settingRepository.findByKey('geely_team');
  if (teamSetting) {
    try {
      const stored = JSON.parse(teamSetting.value);
      if (Array.isArray(stored)) team = stored.filter((member) => member?.isActive !== false).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    } catch { /* use fallback content */ }
  }

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
              <p className="text-sm text-gray-600">Check back soon for updates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article: any) => {
                const publishDate = article.publishDate || article.createdAt;
                const excerpt = article.excerpt || "";

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

      <section className="border-t border-line bg-white py-16 dark:border-midnight-line dark:bg-midnight-surface">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 text-[13px] font-bold tracking-[0.14em] text-geely-blue">
              PEOPLE BEHIND THE JOURNEY
            </div>
            <h2 className="disp mb-4 text-4xl font-bold text-navy dark:text-ice">Geely Team</h2>
            <p className="text-base leading-relaxed text-steel dark:text-steel-light">
              Meet the people dedicated to helping you find, enjoy, and care for your Geely vehicle in Ethiopia.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.id} className="overflow-hidden rounded-xl border border-line bg-ice dark:border-midnight-line dark:bg-midnight">
                {member.imageUrl ? <div className="relative h-48 w-full"><Image src={teamImageUrl(member.imageUrl)} alt={member.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /></div> : <div className="flex h-48 items-center justify-center bg-gradient-to-br from-navy to-geely-blue text-white"><Users size={42} strokeWidth={1.4} /></div>}
                <div className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-geely-blue/10 text-geely-blue"><Users size={21} strokeWidth={1.8} />
                  </div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-geely-blue">{member.role}</p>
                  <h3 className="mb-2 text-lg font-bold text-navy dark:text-ice">{member.name}</h3>
                  <p className="text-sm leading-relaxed text-steel dark:text-steel-light">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
