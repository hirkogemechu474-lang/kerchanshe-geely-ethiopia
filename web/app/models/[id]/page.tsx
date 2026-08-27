import { notFound } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Check, Phone, MessageCircle, Download } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { getBreadcrumbSchema } from "@/lib/schema";
import { Metadata } from "next";
import { getAvailabilityBadge } from "@/lib/vehicleData";
import { Model360Section } from "@/components/Model360Section";
import { StickyCTABar } from "@/components/StickyCTABar";
import { ModelPageTabs } from "@/components/ModelPageTabs";
import { VehicleOptionsShowcase } from "@/components/VehicleOptionsShowcase";
import { QuickRequestCallback } from "@/components/QuickRequestCallback";
import { withBasePath } from "@/lib/publicPath";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://geelyethiopia.com";
const SETTING_KEY = "vehicle_settings";

function publicBrochureUrl(url: string | undefined, fallback: string) {
  if (!url) return fallback;
  if (/^https?:\/\//i.test(url)) return url;
  // Admin owns uploaded files. In development it runs on port 7500; in
  // production NEXT_PUBLIC_ADMIN_URL can point at its public asset host.
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:7500' : '');
  return `${adminUrl}${url}`;
}

function publicMediaUrl(url: string | null | undefined) {
  return withBasePath(url);
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

const CONTACT_SETTING_KEY = "contact_information";
const FALLBACK_CONTACT_PHONE = "+251110000000";

// Same admin-managed Contact Information data the footer reads
// (web/components/Footer.tsx), so this page's "Call Us"/"WhatsApp" links
// never diverge from the rest of the site.
async function getContactPhone() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: CONTACT_SETTING_KEY } });
    if (!setting?.value) return FALLBACK_CONTACT_PHONE;
    const parsed = JSON.parse(setting.value);
    return parsed?.phone?.sales || parsed?.phone?.primary || FALLBACK_CONTACT_PHONE;
  } catch {
    return FALLBACK_CONTACT_PHONE;
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

  const pageUrl = `${BASE_URL}/models/${vehicle.slug}`;

  return {
    title: `${vehicle.name} | Geely Ethiopia`,
    description: `${vehicle.description || vehicle.name} Explore specs, features, and book a test drive.`,
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

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ visitId?: string }>;
}) {
  const { id } = await params;
  const { visitId } = await searchParams;
  const vehicle = await getVehicle(id);
  const [brochure, contactPhone] = await Promise.all([getBrochureSetting(), getContactPhone()]);

  if (!vehicle) {
    notFound();
  }

  // Showroom QR walk-in flow: a visitor arriving from /models carries their
  // visit id so the downstream quote/test-drive/purchase pages can prefill
  // their already-captured name/phone/email without re-asking.
  const visitParam = visitId ? `&visitId=${encodeURIComponent(visitId)}` : "";
  const detailsHrefFor = (slug: string) => `/models/${slug}${visitId ? `?visitId=${encodeURIComponent(visitId)}` : ""}`;

  const brochureUrl = publicBrochureUrl(brochure?.url, `/api/vehicles/${vehicle.slug}/brochure`);
  const contactPhoneHref = `tel:${contactPhone.replace(/[^0-9+]/g, "")}`;
  const whatsappNumber = contactPhone.replace(/[^0-9]/g, "");
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
  const badge = vehicle.badge || getAvailabilityBadge(vehicle.status || "published").label;
  const specs = (vehicle.specifications || {}) as any;

  // Real per-vehicle options from the admin panel (/admin/vehicles/colors,
  // /admin/vehicles/models-variants). Price is intentionally never selected
  // here — this is a browsing page, and price stays visible only on the
  // Financing Calculator / Configurator per the site's pricing convention.
  const [optionColors, optionInteriors, optionWheels, optionPackages, optionAccessories] =
    await Promise.all([
      prisma.vehicleColor.findMany({
        where: { vehicleId: vehicle.id, inStock: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, colorCode: true, imageUrl: true, isDefault: true },
      }),
      prisma.vehicleInterior.findMany({
        where: { vehicleId: vehicle.id, inStock: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, description: true, materialType: true, imageUrl: true, isDefault: true },
      }),
      prisma.vehicleWheel.findMany({
        where: { OR: [{ vehicleId: vehicle.id }, { vehicleId: null }], inStock: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, size: true, imageUrl: true, isDefault: true },
      }),
      prisma.vehiclePackage.findMany({
        where: { vehicleId: vehicle.id },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, description: true, features: true, isDefault: true },
      }),
      prisma.vehicleAccessory.findMany({
        where: { OR: [{ vehicleId: vehicle.id }, { vehicleId: null }], inStock: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, description: true, category: true, imageUrl: true },
      }),
    ]);

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

  const publicOptionColors = optionColors.map((c) => ({ ...c, imageUrl: publicMediaUrl(c.imageUrl) }));

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

      {/* ── HERO SECTION — full-bleed image, minimal chrome, no price on this
           browsing page (matches the pattern on Geely's regional model pages,
           e.g. geely.com.eg/models/gx3-pro, which show no pricing at all) ── */}
      <div id="section-overview" className="relative bg-ink text-white scroll-mt-16">
        <div className="relative h-[70vh] min-h-[420px] max-h-[720px] w-full overflow-hidden">
          {publicHeroVideoUrl ? (
            <video
              src={publicHeroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
              aria-label={`${vehicle.name} hero video`}
            />
          ) : publicHeroImageUrl ? (
            <img
              src={publicHeroImageUrl}
              alt={vehicle.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-geely-blue" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <div className="absolute inset-x-0 bottom-0">
            <div className="max-w-[1280px] mx-auto px-4 md:px-10 pb-10">
              <div className="flex items-center gap-2 text-[11px] tracking-wider mb-3 text-white/70">
                <Link href={`/models${visitId ? `?visitId=${encodeURIComponent(visitId)}` : ""}`} className="hover:text-white transition-colors">
                  Models
                </Link>
                <span>›</span>
                <span className="text-white">{vehicle.name}</span>
              </div>
              <div className="text-[11px] text-gold-bright font-bold tracking-wider mb-2 uppercase">
                {vehicle.vehicleCategory?.name || vehicle.category}
              </div>
              <h1 className="disp text-4xl md:text-6xl font-extrabold mb-6 max-w-2xl">{vehicle.name}</h1>

              <div className="flex gap-3 flex-wrap">
                <Link
                  href={`/test-drive?model=${vehicle.slug}${visitParam}`}
                  className="bg-white text-ink font-bold text-sm px-7 py-4 rounded hover:bg-opacity-90 transition-all"
                >
                  Schedule Test Drive
                </Link>
                <Link
                  href="/compare"
                  className="border border-white/50 text-white font-semibold text-sm px-7 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                >
                  Compare
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KEY FACTS STRIP — a few headline specs, not the full table ── */}
      <div className="bg-white border-b border-line">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {(() => {
              const fromSpecs: [string, string][] = [
                ["Engine", specs?.engine?.type || specs?.engine],
                ["Transmission", specs?.engine?.transmission || specs?.transmission],
                ["0-100 km/h", specs?.engine?.acceleration],
                ["Drivetrain / Power", specs?.engine?.drivetrain || specs?.engine?.power || specs?.power],
              ].filter(([, value]) => Boolean(value)) as [string, string][];

              // Specs aren't always filled in from the admin panel — fall
              // back to facts every vehicle always has, so the strip never
              // renders empty.
              const fallback: [string, string][] = [
                ["Category", vehicle.vehicleCategory?.name || vehicle.category],
                ["Availability", badge],
                ["Brand", vehicle.brand?.name || "Geely"],
              ];

              return [...fromSpecs, ...fallback].slice(0, 3).map(([label, value]) => (
                <div key={label}>
                  <div className="text-lg md:text-xl font-display font-bold text-ink">{value}</div>
                  <div className="text-xs text-steel uppercase tracking-wider mt-1">{label}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* ── OVERVIEW COPY + SECONDARY ACTIONS ─────────────────────────── */}
      <div className="bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-10">
          <p className="text-steel text-base leading-relaxed max-w-3xl mb-6">
            {vehicle.description || "Vehicle details are managed from the admin panel."}
          </p>
          <div className="flex gap-5 flex-wrap items-center text-sm">
            <a href={contactPhoneHref} className="flex items-center gap-2 font-semibold text-navy hover:text-geely-blue transition-colors">
              <Phone size={16} /> Call Us
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in the Geely ${vehicle.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-semibold text-navy hover:text-geely-blue transition-colors"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <Link href={`/quote?model=${vehicle.slug}${visitParam}`} className="font-semibold text-navy hover:text-geely-blue transition-colors">
              Get a Quote
            </Link>
            <a href={brochureUrl} download className="flex items-center gap-2 font-semibold text-navy hover:text-geely-blue transition-colors">
              <Download size={15} /> Download Brochure
            </a>
            <QuickRequestCallback vehicleModel={vehicle.name} />
            <ShareButton title={vehicle.name} />
          </div>
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

      {/* ── COLORS, TRIMS & ACCESSORIES (no price — see convention note above) ── */}
      <VehicleOptionsShowcase
        vehicleSlug={vehicle.slug}
        vehicleName={vehicle.name}
        heroImage={publicHeroImageUrl || undefined}
        colors={publicOptionColors}
        interiors={optionInteriors.map((i) => ({ ...i, imageUrl: publicMediaUrl(i.imageUrl) }))}
        wheels={optionWheels.map((w) => ({ ...w, imageUrl: publicMediaUrl(w.imageUrl) }))}
        packages={optionPackages.map((p) => ({
          ...p,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
        }))}
        accessories={optionAccessories.map((a) => ({ ...a, imageUrl: publicMediaUrl(a.imageUrl) }))}
        visitId={visitId}
      />

      {/* ── 360° SPOTLIGHT SECTION — color swatches (from the same admin-managed
           Vehicle Colors used above) let a visitor swap the displayed color,
           mirroring geely.com.eg/models/gx3-pro#360's "Discover Every Angle" ── */}
      <Model360Section
        modelName={vehicle.name}
        modelId={vehicle.slug}
        images={publicImageList}
        heroImageUrl={publicHeroImageUrl}
        showcaseViews={showcaseViews}
        showcaseVideoUrl={showcaseVideoUrl}
        colors={publicOptionColors}
      />

      {/* ── SPECIFICATIONS — plain tabular layout, light typography, no
           boxed cards, matching the reference's spec table treatment ── */}
      <section id="section-specs" className="py-16 bg-white scroll-mt-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <h2 className="disp text-3xl text-navy font-bold mb-10">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {[
              {
                title: "Engine & Performance",
                rows: [
                  ["Engine", specs?.engine?.type || specs?.engine],
                  ["Power", specs?.engine?.power || specs?.power],
                  ["Transmission", specs?.engine?.transmission || specs?.transmission],
                  ["Fuel Type", specs?.engine?.fuelType || specs?.fuelType],
                  ["Drivetrain", specs?.engine?.drivetrain || specs?.drivetrain],
                  ["Range (EV)", specs?.engine?.range || specs?.range],
                  ["Battery", specs?.engine?.batteryCapacity || specs?.batteryCapacity],
                ],
              },
              {
                title: "Dimensions & Capacity",
                rows: [
                  ["Length", specs?.dimensions?.length],
                  ["Width", specs?.dimensions?.width],
                  ["Height", specs?.dimensions?.height],
                  ["Wheelbase", specs?.dimensions?.wheelbase],
                  ["Ground Clearance", specs?.dimensions?.groundClearance],
                  ["Seating Capacity", specs?.dimensions?.seatingCapacity || specs?.seating],
                  ["Cargo Volume", specs?.dimensions?.cargoVolume || specs?.dimensions?.bootSpace],
                ],
              },
            ].map(({ title, rows }) => {
              const filled = rows.filter(([, value]) => Boolean(value));
              return (
                <div key={title}>
                  <h3 className="text-base font-bold text-navy mb-4 uppercase tracking-wider">{title}</h3>
                  {filled.length > 0 ? (
                    <div>
                      {filled.map(([label, value]) => (
                        <div key={label} className="flex justify-between py-3 border-b border-line text-sm">
                          <span className="text-steel">{label}</span>
                          <span className="font-semibold text-navy">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-steel text-sm">Specifications managed in admin panel.</p>
                  )}
                </div>
              );
            })}
          </div>
          {publicHeroVideoUrl && (
            <a
              href={publicHeroVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-8 text-sm text-geely-blue font-semibold hover:underline"
            >
              ▶ Watch Full Video →
            </a>
          )}
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────────── */}
      {featuredFeatures.length > 0 && (
        <section className="py-16 bg-ice">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <h2 className="disp text-3xl text-navy font-bold mb-8">Vehicle Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {featuredFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 py-1">
                  <Check size={18} className="text-geely-blue flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-navy">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DIRECT PURCHASE CTA ──────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="bg-gradient-to-br from-navy to-[#123a72] text-white rounded-2xl p-10 text-center">
            <div className="text-gold text-xs font-bold tracking-wider mb-3 uppercase">Direct Vehicle Purchase</div>
            <h2 className="disp text-3xl font-bold mb-3">Own the {vehicle.name}</h2>
            <p className="text-[#d8e4f5] text-sm mb-6 max-w-xl mx-auto">
              Purchase directly through a supported Ethiopian bank and receive a purchase confirmation reference.
            </p>
            <Link
              href={`/financing/apply?vehicle=${vehicle.id}${visitParam}`}
              className="inline-block bg-gold text-[#2c2308] font-bold text-sm px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all"
            >
              Purchase This Vehicle
            </Link>
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
              href={`/test-drive?model=${vehicle.slug}${visitParam}`}
              className="bg-gold text-[#2c2308] font-bold text-sm px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all"
            >
              Book a Test Drive
            </Link>
            <Link
              href={`/quote?model=${vehicle.slug}${visitParam}`}
              className="border border-white border-opacity-50 text-white font-semibold text-sm px-8 py-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
            >
              Request a Quote
            </Link>
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
                  href={detailsHrefFor(rv.slug)}
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
                      Price on request
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
        price="Price on request"
        brochureUrl={brochureUrl}
        visitId={visitId}
        contactPhone={contactPhone}
      />
    </MainLayout>
  );
}
