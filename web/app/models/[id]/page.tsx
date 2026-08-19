import { notFound } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Check, Phone, MessageCircle, Download, FileDown } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { getBreadcrumbSchema } from "@/lib/schema";
import { Metadata } from "next";
import { formatVehiclePrice, getAvailabilityBadge } from "@/lib/vehicleData";
import { Model360Section } from "@/components/Model360Section";
import { StickyCTABar } from "@/components/StickyCTABar";
import { ModelPageTabs } from "@/components/ModelPageTabs";
import { TrimColorWheelPicker } from "@/components/TrimColorWheelPicker";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://geelyethiopia.com";
const SETTING_KEY = "vehicle_settings";

function publicBrochureUrl(url: string | undefined, fallback: string) {
  if (!url) return fallback;
  if (/^https?:\/\//i.test(url)) return url;
  // Admin owns uploaded files. In development it runs on port 3001; in
  // production NEXT_PUBLIC_ADMIN_URL can point at its public asset host.
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');
  return `${adminUrl}${url}`;
}

function publicMediaUrl(url: string | null | undefined) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');
  return `${adminUrl}${url}`;
}

async function getVehicle(id: string) {
  return prisma.vehicle.findFirst({
    where: {
      slug: id,
      isActive: true,
      status: "published",
    },
    include: {
      brand: true,
      vehicleCategory: true,
    },
  });
}

async function getBrochureSetting() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (!setting?.value) return null;
    const parsed = JSON.parse(setting.value);
    return parsed?.brochure ?? null;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      status: "published",
    },
    select: {
      slug: true,
    },
  });

  return vehicles.map((vehicle: { slug: string }) => ({
    id: vehicle.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    return {
      title: "Vehicle Not Found | Geely Ethiopia",
    };
  }

  const displayPrice = vehicle.finalPrice || vehicle.basePrice;
  const pageUrl = `${BASE_URL}/models/${vehicle.slug}`;

  return {
    title: `${vehicle.name} | Geely Ethiopia`,
    description: `${vehicle.description || vehicle.name} Starting from ${formatVehiclePrice(displayPrice)}. Explore specs, features, and book a test drive.`,
    keywords: `${vehicle.name}, ${vehicle.category}, Geely Ethiopia, ${vehicle.brand?.name || "Geely"}, ${vehicle.vehicleCategory?.name || vehicle.category}`,
    alternates: {
      canonical: pageUrl,
      languages: {
        "en-ET": pageUrl,
        "am-ET": `${pageUrl}?lang=am`,
        "x-default": pageUrl,
      },
    },
    openGraph: {
      title: `${vehicle.name} | Geely Ethiopia`,
      description: vehicle.description || vehicle.name,
      url: pageUrl,
      siteName: "Geely Ethiopia",
      locale: "en_ET",
      images: [
        {
          url: vehicle.heroImageUrl || (Array.isArray(vehicle.images) && typeof vehicle.images[0] === "string" ? vehicle.images[0] : undefined) || `${BASE_URL}/images/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: vehicle.name,
        },
      ],
      type: "website",
    },
  };
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  const brochure = await getBrochureSetting();

  if (!vehicle) {
    notFound();
  }

  const brochureUrl = publicBrochureUrl(brochure?.url, `/api/vehicles/${vehicle.slug}/brochure`);
  // Keep the public app compatible with its independently generated Prisma client
  // while reading the optional showcase video added to the shared database schema.
  const showcaseRows = await prisma.$queryRaw<Array<{ views: unknown; videoUrl: string | null }>>(Prisma.sql`
    SELECT "views", "videoUrl"
    FROM "VehicleShowcase"
    WHERE "isActive" = true
      AND "vehicleId" IN (${vehicle.id}, ${vehicle.slug})
    ORDER BY "sortOrder" ASC
    LIMIT 1
  `);
  const showcase = showcaseRows[0] ?? null;
  const showcaseViews = Array.isArray(showcase?.views)
    ? (showcase.views as Array<{ angle: string; imageUrl: string; label: string }>).map((view) => ({
        ...view,
        imageUrl: publicMediaUrl(view.imageUrl),
      }))
    : [];
  const showcaseVideoUrl = publicMediaUrl(showcase?.videoUrl) || null;

  const imageList: string[] = Array.isArray(vehicle.images)
    ? vehicle.images.filter((image): image is string => typeof image === "string")
    : [];
  const publicImageList = imageList.map((image) => publicMediaUrl(image));
  const publicHeroImageUrl = publicMediaUrl(vehicle.heroImageUrl) || publicImageList[0] || '';
  const publicHeroVideoUrl = publicMediaUrl(vehicle.heroVideoUrl);
  const displayPrice = vehicle.finalPrice || vehicle.basePrice;
  const formattedPrice = formatVehiclePrice(displayPrice);
  const badge = vehicle.badge || getAvailabilityBadge(vehicle.status || "published").label;
  const badgeColor = getAvailabilityBadge(vehicle.status || "published").color;
  const specs = (vehicle.specifications || {}) as any;

  const relatedVehicles = await prisma.vehicle.findMany({
    where: {
      id: { not: vehicle.id },
      isActive: true,
      status: "published",
      OR: [
        vehicle.categoryId ? { categoryId: vehicle.categoryId } : { category: vehicle.category },
        vehicle.brandId ? { brandId: vehicle.brandId } : undefined,
      ].filter(Boolean) as any,
    },
    take: 3,
    orderBy: [{ displayOrder: "asc" }, { isFeatured: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      basePrice: true,
      finalPrice: true,
      hidePrice: true,
      images: true,
      heroImageUrl: true,
      badge: true,
    },
  });

  // ── Schema.org structured data ─────────────────────────────────────────────
  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": `${BASE_URL}/models/${vehicle.slug}#vehicle`,
    name: vehicle.name,
    description: vehicle.description || vehicle.name,
    brand: {
      "@type": "Brand",
      name: vehicle.brand?.name || "Geely",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Geely Ethiopia",
    },
    model: vehicle.model,
    bodyType: vehicle.vehicleCategory?.name || vehicle.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "ETB",
      ...(vehicle.hidePrice ? {} : { price: displayPrice }),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "AutomotiveBusiness",
        name: "Geely Ethiopia",
      },
      url: `${BASE_URL}/models/${vehicle.slug}`,
    },
    image: [vehicle.heroImageUrl, ...imageList].filter(Boolean),
  };

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Models", url: `${BASE_URL}/models` },
    { name: vehicle.name, url: `${BASE_URL}/models/${vehicle.slug}` },
  ]);

  const galleries = publicImageList.slice(0, 8);
  const featuredFeatures: string[] = (() => {
    if (specs?.features) {
      return Object.values(specs.features)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter(Boolean)
        .map(String)
        .slice(0, 12);
    }
    return [];
  })();

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([vehicleSchema, breadcrumbSchema]),
        }}
      />

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <div id="section-overview" className="bg-gradient-to-br from-navy via-[#123a72] to-geely-blue text-white py-12 scroll-mt-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] tracking-wider mb-4">
            <Link href="/models" className="opacity-70 hover:opacity-100 transition-opacity">
              Models
            </Link>
            <span className="opacity-50">›</span>
            <span>{vehicle.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: info */}
            <div>
              <div className="text-[11px] text-gold font-bold tracking-wider mb-3 uppercase">
                {vehicle.vehicleCategory?.name || vehicle.category}
              </div>
              <h1 className="disp text-5xl font-bold mb-4">{vehicle.name}</h1>
              <p className="text-[#d8e4f5] text-base mb-6 leading-relaxed">
                {vehicle.description || "Vehicle details are managed from the admin panel."}
              </p>

              {/* Price + badge */}
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <div className={`${badgeColor} text-white text-xs font-bold px-4 py-2 rounded-full`}>
                  {badge}
                </div>
                <div className="text-2xl font-bold">
                  {vehicle.hidePrice ? "Price on request" : `From ${formattedPrice}`}
                </div>
                <div className="text-sm text-blue-100">
                  {vehicle.brand?.name || "Geely"}
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="flex gap-3 flex-wrap mb-4">
                <Link
                  href={`/quote?model=${vehicle.slug}`}
                  className="bg-gold text-[#2c2308] font-bold text-sm px-7 py-4 rounded hover:bg-opacity-90 transition-all"
                >
                  Get a Quote
                </Link>
                <Link
                  href={`/test-drive?model=${vehicle.slug}`}
                  className="border border-white border-opacity-50 text-white font-semibold text-sm px-7 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                >
                  Book Test Drive
                </Link>
                <a
                    href={brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-white border-opacity-50 text-white font-semibold text-sm px-7 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                  >
                    <FileDown size={16} />
                    Download Brochure
                </a>
              </div>

              {/* Secondary actions */}
              <div className="flex gap-4 flex-wrap">
                <a
                  href={brochureUrl}
                  download
                  className="flex items-center gap-2 text-[#d8e4f5] text-sm hover:text-white transition-colors"
                >
                  <Download size={15} />
                  Download Brochure
                </a>
                <ShareButton title={vehicle.name} />
              </div>
            </div>

            {/* Right: hero image */}
            <div className="h-[350px] bg-white bg-opacity-[0.08] border border-dashed border-white border-opacity-40 rounded-xl overflow-hidden">
              {publicHeroVideoUrl ? (
                <video
                  src={publicHeroVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                  aria-label={`${vehicle.name} hero video`}
                />
              ) : publicHeroImageUrl ? (
                <img
                  src={publicHeroImageUrl}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-white text-opacity-65 text-center">
                  {vehicle.name} Hero Image
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTION BAR (always visible) ─────────────────────────── */}
      <div className="bg-ice border-b border-line">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-3 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-5 flex-wrap">
            <a
              href="tel:+251110000000"
              className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-geely-blue transition-colors"
            >
              <Phone size={16} />
              Call Us
            </a>
            <a
              href={`https://wa.me/251110000000?text=${encodeURIComponent(`Hi, I'm interested in the Geely ${vehicle.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-geely-blue transition-colors"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>
          <Link href="/compare" className="text-sm font-semibold text-geely-blue hover:underline">
            Compare with other models →
          </Link>
        </div>
      </div>

      {/* ── TAB NAVIGATION ────────────────────────────────────────────── */}
      <ModelPageTabs />

      {/* ── GALLERY SECTION ───────────────────────────────────────────── */}
      <section id="section-gallery" className="py-12 bg-white scroll-mt-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <h2 className="disp text-3xl text-navy font-bold mb-6">Gallery</h2>
          {galleries.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleries.map((img: string, index: number) => (
                <div
                  key={`${img}-${index}`}
                  className={`rounded-xl overflow-hidden bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] ${
                    index === 0 ? "col-span-2 row-span-2 h-[400px]" : "h-[190px]"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${vehicle.name} gallery ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-steel py-12 border border-dashed border-line rounded-xl">
              Gallery images are managed from the admin panel.
            </div>
          )}
        </div>
      </section>

      {/* ── INTERACTIVE CONFIGURATOR (BUILD & PRICE) ──────────────────── */}
      <TrimColorWheelPicker
        vehicleSlug={vehicle.slug}
        vehicleName={vehicle.name}
        basePrice={displayPrice}
        heroImage={publicHeroImageUrl || undefined}
        galleryImages={publicImageList}
      />

      {/* ── 360° SPOTLIGHT SECTION ────────────────────────────────────── */}
      <Model360Section
        modelName={vehicle.name}
        modelId={vehicle.slug}
        images={publicImageList}
        heroImageUrl={publicHeroImageUrl}
        showcaseViews={showcaseViews}
        showcaseVideoUrl={showcaseVideoUrl}
      />

      {/* ── SPECIFICATIONS ─────────────────────────────────────────────── */}
      <section id="section-specs" className="py-12 bg-ice scroll-mt-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <h2 className="disp text-3xl text-navy font-bold mb-8">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Engine & Performance */}
            <div className="bg-white p-6 rounded-xl border border-line">
              <h3 className="text-lg font-bold text-navy mb-4">Engine & Performance</h3>
              <div className="space-y-3 text-sm">
                {[
                  ["Engine", specs?.engine?.type || specs?.engine],
                  ["Power", specs?.engine?.power || specs?.power],
                  ["Transmission", specs?.engine?.transmission || specs?.transmission],
                  ["Fuel Type", specs?.engine?.fuelType || specs?.fuelType],
                  ["Drivetrain", specs?.engine?.drivetrain || specs?.drivetrain],
                  ["Range (EV)", specs?.engine?.range || specs?.range],
                  ["Battery", specs?.engine?.batteryCapacity || specs?.batteryCapacity],
                ]
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-line pb-2">
                      <span className="text-steel">{label}</span>
                      <span className="font-semibold text-navy">{value as string}</span>
                    </div>
                  ))}
                {!specs?.engine && (
                  <p className="text-steel text-xs">Specifications managed in admin panel.</p>
                )}
              </div>
            </div>

            {/* Dimensions */}
            <div className="bg-white p-6 rounded-xl border border-line">
              <h3 className="text-lg font-bold text-navy mb-4">Dimensions & Capacity</h3>
              <div className="space-y-3 text-sm">
                {[
                  ["Length", specs?.dimensions?.length],
                  ["Width", specs?.dimensions?.width],
                  ["Height", specs?.dimensions?.height],
                  ["Wheelbase", specs?.dimensions?.wheelbase],
                  ["Ground Clearance", specs?.dimensions?.groundClearance],
                  ["Seating Capacity", specs?.dimensions?.seatingCapacity || specs?.seating],
                  ["Boot Space", specs?.dimensions?.bootSpace],
                ]
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-line pb-2">
                      <span className="text-steel">{label}</span>
                      <span className="font-semibold text-navy">{value as string}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-white p-6 rounded-xl border border-line">
              <h3 className="text-lg font-bold text-navy mb-4">Overview</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-steel block mb-1">Brand</span>
                  <span className="font-semibold text-navy">{vehicle.brand?.name || "Geely"}</span>
                </div>
                <div>
                  <span className="text-steel block mb-1">Category</span>
                  <span className="font-semibold text-navy">
                    {vehicle.vehicleCategory?.name || vehicle.category}
                  </span>
                </div>
                <div>
                  <span className="text-steel block mb-1">Starting Price</span>
                  <span className="font-bold text-geely-blue text-lg">
                    {vehicle.hidePrice ? "Price on request" : formattedPrice}
                  </span>
                </div>
                {publicHeroVideoUrl && (
                  <div className="mt-4">
                    <a
                      href={publicHeroVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-geely-blue font-semibold hover:underline"
                    >
                      ▶ Watch Video →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────────── */}
      {featuredFeatures.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <h2 className="disp text-3xl text-navy font-bold mb-6">Vehicle Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuredFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-ice border border-line">
                  <Check size={18} className="text-geely-blue flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-navy">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FINANCING ESTIMATOR ────────────────────────────────────────── */}
      <section className="py-12 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="bg-gradient-to-br from-navy to-[#123a72] text-white rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-gold text-xs font-bold tracking-wider mb-3 uppercase">Direct Vehicle Purchase</div>
                <h2 className="disp text-3xl font-bold mb-3">Own the {vehicle.name}</h2>
                <p className="text-[#d8e4f5] text-sm mb-6">
                  Purchase directly through a supported Ethiopian bank and receive a purchase confirmation reference.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={`/financing/apply?vehicle=${vehicle.id}`}
                    className="bg-gold text-[#2c2308] font-bold text-sm px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all"
                  >
                    Purchase This Vehicle
                  </Link>
                  <Link
                    href={`/financing/apply?vehicle=${vehicle.id}`}
                    className="border border-white/40 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-white/10 transition-all"
                  >
                    Purchase Vehicle
                  </Link>
                </div>
              </div>

              {/* Quick estimate */}
              <div className="hidden bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-sm text-[#d8e4f5] mb-4 font-semibold">Quick Payment Estimate</div>
                <div className="space-y-3 text-sm">
                  {[
                    { term: "24 months", rate: 15, label: "2 Years" },
                    { term: "36 months", rate: 15, label: "3 Years" },
                    { term: "48 months", rate: 15, label: "4 Years" },
                    { term: "60 months", rate: 15, label: "5 Years" },
                  ].map(({ term, rate, label }) => {
                    const months = parseInt(term);
                    const monthlyRate = rate / 100 / 12;
                    const downPayment = displayPrice * 0.3;
                    const loanAmount = displayPrice - downPayment;
                    const monthly =
                      loanAmount *
                      (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                      (Math.pow(1 + monthlyRate, months) - 1);
                    return (
                      <div key={term} className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-[#d8e4f5]">{label} (30% down)</span>
                        <span className="font-bold text-white">
                          {formatVehiclePrice(Math.round(monthly))}/mo
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-xs text-[#8fafd4]">
                  * Estimates at 15% p.a. interest. Actual rates vary by institution.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ─────────────────────────────────────────── */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 text-center">
          <h3 className="disp text-3xl font-bold mb-4">
            Ready to experience the {vehicle.name}?
          </h3>
          <p className="text-[#b9cbe4] text-base mb-8 max-w-2xl mx-auto">
            Book a test drive at your nearest showroom or request a personalized quote today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href={`/test-drive?model=${vehicle.slug}`}
              className="bg-gold text-[#2c2308] font-bold text-sm px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all"
            >
              Book a Test Drive
            </Link>
            <Link
              href={`/quote?model=${vehicle.slug}`}
              className="border border-white border-opacity-50 text-white font-semibold text-sm px-8 py-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
            >
              Request a Quote
            </Link>
            <a
              href={brochureUrl}
              download
              className="flex items-center gap-2 border border-white border-opacity-30 text-[#d8e4f5] font-semibold text-sm px-8 py-4 rounded-lg hover:bg-white hover:bg-opacity-5 transition-all"
            >
              <Download size={16} />
              Download Brochure
            </a>
          </div>
        </div>
      </div>

      {/* ── RELATED VEHICLES ──────────────────────────────────────────── */}
      {relatedVehicles.length > 0 && (
        <section className="py-12 bg-ice">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <h2 className="disp text-3xl text-navy font-bold mb-8">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {relatedVehicles.map((rv: typeof relatedVehicles[number]) => (
                <Link
                  key={rv.id}
                  href={`/models/${rv.slug}`}
                  className="bg-white border border-line rounded-xl overflow-hidden hover:border-geely-blue hover:shadow-lg transition-all group"
                >
                  <div className="h-[160px] bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center text-xs text-steel overflow-hidden">
                    {rv.heroImageUrl || (Array.isArray(rv.images) && rv.images[0]) ? (
                      <img
                        src={rv.heroImageUrl || (Array.isArray(rv.images) && typeof rv.images[0] === "string" ? rv.images[0] : "")}
                        alt={rv.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      rv.name
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-[11px] text-gold font-bold tracking-wider mb-2">{rv.category}</div>
                    <h3 className="text-lg text-navy font-bold mb-2 group-hover:text-geely-blue transition-colors">
                      {rv.name}
                    </h3>
                    <div className="text-sm text-steel">
                      {rv.hidePrice ? "Price on request" : <>From <span className="text-ink font-bold">{formatVehiclePrice(rv.finalPrice || rv.basePrice)}</span></>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── STICKY CTA BAR (client component) ────────────────────────── */}
      <StickyCTABar
        vehicleSlug={vehicle.slug}
        vehicleName={vehicle.name}
        price={formattedPrice}
        brochureUrl={brochureUrl}
      />
    </MainLayout>
  );
}
