import Link from 'next/link';
import Image from 'next/image';
import { Download, ArrowRight } from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { serverApiClient } from '@/lib/serverApiClient';
import { getBreadcrumbSchema, getOrganizationSchema, getWebsiteSchema } from '@/lib/schema';

interface BrochureModel {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string | null;
  brochureUrl: string;
}

export default async function DownloadBrochurePage() {
  const client = await serverApiClient();
  const [vehicles, showcases] = await Promise.all([
    client.get('/public/vehicles').then((r) => r.data).catch(() => []),
    client.get('/public/showcase').then((r) => r.data).catch(() => []),
  ]);

  const brochureOverrideByVehicleId = new Map<string, string>(
    (Array.isArray(showcases) ? showcases : [])
      .filter((s: any) => s.brochureUrl)
      .map((s: any) => [s.vehicleId, s.brochureUrl as string])
  );

  const models: BrochureModel[] = (Array.isArray(vehicles) ? vehicles : []).map((v: any) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    category: v.vehicleCategory?.name || v.category || '',
    image: v.heroImageUrl || (Array.isArray(v.images) ? v.images[0] : null) || null,
    brochureUrl: brochureOverrideByVehicleId.get(v.slug) || `/api/vehicles/${v.slug}/brochure`,
  }));

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://geelyethiopia.com' },
    { name: 'Download Brochure', url: 'https://geelyethiopia.com/download-brochure' },
  ]);

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([getOrganizationSchema(), getWebsiteSchema(), breadcrumbSchema]),
        }}
      />

      {/* Page Header */}
      <section className="bg-white dark:bg-midnight-surface py-16 border-b border-line dark:border-midnight-line">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex items-center gap-2 text-[11px] tracking-wider mb-4 text-steel dark:text-steel-light">
            <Link href="/" className="hover:text-geely-blue transition-colors">
              Home
            </Link>
            <span>›</span>
            <span>Download Brochure</span>
          </div>
          <h1 className="disp text-4xl md:text-5xl font-bold text-navy dark:text-ice mb-4">
            Download Brochures
          </h1>
          <p className="text-steel dark:text-steel-light text-base max-w-2xl leading-relaxed">
            Full specifications, equipment and colours for every Geely model &mdash; yours to keep as a PDF.
          </p>
        </div>
      </section>

      {/* Model Grid */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {models.map((model) => (
              <div
                key={model.id}
                className="bg-white dark:bg-midnight-surface rounded-xl overflow-hidden border border-line dark:border-midnight-line shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-ice dark:bg-midnight">
                  {model.image && (
                    <Image
                      src={model.image}
                      alt={model.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-contain p-4"
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-navy dark:text-ice text-lg">{model.name}</h3>
                  {model.category && (
                    <p className="text-sm text-steel dark:text-steel-light mb-4">{model.category}</p>
                  )}
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <a
                      href={model.brochureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-navy dark:bg-white text-white dark:text-navy px-4 py-2.5 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors"
                    >
                      <Download size={16} />
                      Download PDF
                    </a>
                    <Link
                      href={`/models/${model.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-geely-blue hover:underline shrink-0"
                    >
                      Explore
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-steel dark:text-steel-light text-sm mt-12">
            Looking for a model that isn&apos;t listed? Its brochure is on the way &mdash;{' '}
            <Link href="/contact" className="text-geely-blue font-semibold hover:underline">
              contact us
            </Link>{' '}
            and we&apos;ll send it over.
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
