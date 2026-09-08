import { notFound } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { Check, Phone, MessageCircle, Download, ShieldCheck, ChevronDown } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { getBreadcrumbSchema } from "@/lib/schema";
import { Metadata } from "next";
import { getAvailabilityBadge } from "@/lib/vehicleData";
import { Model360Section } from "@/components/Model360Section";
import { ModelPageTabs } from "@/components/ModelPageTabs";
import { VehicleOptionsShowcase } from "@/components/VehicleOptionsShowcase";
import { QuickRequestCallback } from "@/components/QuickRequestCallback";
import { withBasePath } from "@/lib/publicPath";
import { env } from "@/lib/env";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

const BASE_URL = env.app.url;

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

// Matches the admin ImageUpload component's own convention (apps/admin/components/admin/vehicles/ImageUpload.tsx)
// so a walkthrough video added to the Interior/Exterior galleries renders as a video here too, not a broken image.
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.m4v'];
function isVideoUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

// Picks a grid column count and tile aspect ratio from how many images/videos
// are actually there, instead of a fixed 2-column grid that leaves an empty
// cell (and a slab of whitespace) when a vehicle only has one or two photos.
function mediaGridLayout(count: number): { gridClass: string; aspectClass: string } {
  if (count <= 1) return { gridClass: 'grid-cols-1', aspectClass: 'aspect-[16/9]' };
  if (count === 2) return { gridClass: 'grid-cols-1 sm:grid-cols-2', aspectClass: 'aspect-[4/3]' };
  if (count === 3) return { gridClass: 'grid-cols-1 sm:grid-cols-3', aspectClass: 'aspect-[4/3]' };
  return { gridClass: 'grid-cols-1 md:grid-cols-2', aspectClass: 'aspect-[4/3]' };
}

// One "feature story" entry (specs.interior.highlights / specs.exterior.highlights
// — see apps/admin/lib/vehicle-specifications.ts for the authoring shape). Brand
// new field, so values are treated as string-safe-but-possibly-missing/empty.
type SpecHighlight = { title: string; description: string; imageUrl: string };

function normalizeHighlights(raw: unknown): SpecHighlight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h): h is Record<string, unknown> => Boolean(h) && typeof h === "object")
    .map((h) => ({
      title: typeof h.title === "string" ? h.title.trim() : "",
      description: typeof h.description === "string" ? h.description.trim() : "",
      imageUrl: typeof h.imageUrl === "string" && h.imageUrl ? publicMediaUrl(h.imageUrl) : "",
    }))
    // A highlight without both a headline and a paragraph has nothing to
    // show — skip it rather than rendering a half-empty story block.
    .filter((h) => h.title && h.description);
}

// Settings are stored as a JSON-or-plain-text string column (backend
// `Setting.value`), so the public settings endpoints hand back that raw
// string rather than a parsed object — parse defensively either way.
function parseSettingValue(raw: unknown): any {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

async function getVehicle(id: string) {
  try {
    const { data: vehicle } = await apiClient.get(`/public/vehicles/${id}`);
    if (!vehicle || vehicle.status !== "published") return null;
    return vehicle;
  } catch {
    return null;
  }
}

async function getShowcase(vehicleId: string) {
  try {
    const { data } = await apiClient.get(`/public/showcase?vehicleId=${encodeURIComponent(vehicleId)}`);
    const showcases = Array.isArray(data) ? data : [];
    return showcases[0] ?? null;
  } catch {
    return null;
  }
}

const FALLBACK_CONTACT_PHONE = "+251 11 000 0000";

// Same admin-managed Contact Information data the footer reads
// (web/components/Footer.tsx), so this page's "Call Us"/"WhatsApp" links
// never diverge from the rest of the site.
async function getContactPhone() {
  try {
    const { data } = await apiClient.get("/public/contact-information");
    const parsed = parseSettingValue(data);
    return parsed?.phone?.sales || parsed?.phone?.primary || FALLBACK_CONTACT_PHONE;
  } catch {
    return FALLBACK_CONTACT_PHONE;
  }
}

// Shared alternating image+text "feature story" block — used by both the
// Exterior Highlights and Interior Highlights sections (specs.exterior/
// interior.highlights), one block per admin-authored highlight, alternating
// image-left/text-right then image-right/text-left.
function FeatureStorySection({
  id,
  eyebrow,
  heading,
  intro,
  highlights,
  vehicleName,
  tone = "light",
}: {
  id: string;
  eyebrow: string;
  heading: string;
  intro: string;
  highlights: SpecHighlight[];
  vehicleName: string;
  tone?: "light" | "ice";
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-[76px] ${tone === "ice" ? "bg-ice" : "bg-white"} py-16`}
    >
      <div className="page-container">
        <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-active-blue/10 text-active-blue px-4 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
            {eyebrow}
          </div>
          <h2 className="disp text-3xl text-navy font-bold mb-4">{heading}</h2>
          <p className="text-steel text-base max-w-2xl">{intro}</p>
        </div>
        <div className="space-y-14 md:space-y-20">
          {highlights.map((highlight, index) => {
            const reversed = index % 2 === 1;
            return (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                <div className={reversed ? "lg:order-2" : ""}>
                  {highlight.imageUrl ? (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4">
                      <ImageWithFallback
                        src={highlight.imageUrl}
                        alt={`${vehicleName}: ${highlight.title}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        iconClassName="h-10 w-10"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] rounded-xl flex items-center justify-center bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4 text-steel text-sm">
                      {vehicleName}
                    </div>
                  )}
                </div>
                <div className={reversed ? "lg:order-1" : ""}>
                  <h3 className="disp text-2xl md:text-3xl text-navy font-bold mb-4">{highlight.title}</h3>
                  <p className="text-steel text-base leading-relaxed max-w-lg">{highlight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const { data } = await apiClient.get("/public/vehicles");
    const vehicles = Array.isArray(data) ? data : [];
    return vehicles
      .filter((vehicle: { status: string }) => vehicle.status === "published")
      .map((vehicle: { slug: string }) => ({ id: vehicle.slug }));
  } catch {
    return [];
  }
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
  // Doesn't depend on the vehicle at all — start it alongside getVehicle()
  // instead of after, so its round-trip isn't pure added latency on top.
  const contactPhonePromise = getContactPhone();
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  const [contactPhone, showcase] = await Promise.all([
    contactPhonePromise,
    getShowcase(vehicle.slug || id),
  ]);

  // Showroom QR walk-in flow: a visitor arriving from /models carries their
  // visit id so the downstream quote/test-drive/purchase pages can prefill
  // their already-captured name/phone/email without re-asking.
  const visitParam = visitId ? `&visitId=${encodeURIComponent(visitId)}` : "";
  const detailsHrefFor = (slug: string) => `/models/${slug}${visitId ? `?visitId=${encodeURIComponent(visitId)}` : ""}`;

  // Each vehicle owns its own brochure (Admin → Vehicles → Settings → 360°
  // Showcase); when none has been uploaded, fall back to the auto-generated
  // PDF built from this vehicle's own specs rather than any other vehicle's.
  const brochureUrl = publicBrochureUrl(showcase?.brochureUrl, `/api/vehicles/${vehicle.slug}/brochure`);
  const contactPhoneHref = `tel:${contactPhone.replace(/[^0-9+]/g, "")}`;
  const whatsappNumber = contactPhone.replace(/[^0-9]/g, "");
  // Uploaded in Admin → Vehicles → Settings → 360° Showcase for this
  // vehicle's slug — the 360 section falls back to plain gallery images
  // when there's no showcase data.
  const rawShowcaseViews: Array<{ angle?: string; imageUrl?: string; label?: string; colorId?: string }> = Array.isArray(showcase?.views) ? showcase.views : [];
  const showcaseViews = rawShowcaseViews
    .filter((v): v is { angle: string; imageUrl: string; label: string; colorId?: string } => typeof v?.imageUrl === "string" && !!v.imageUrl)
    .map((v) => ({ angle: v.angle ?? "", imageUrl: publicMediaUrl(v.imageUrl), label: v.label ?? "", colorId: v.colorId }));
  const showcaseVideoUrl: string | null = publicMediaUrl(showcase?.videoUrl) || null;
  const showcaseModelUrl: string | null = publicMediaUrl(showcase?.modelUrl) || null;

  const imageList: string[] = Array.isArray(vehicle.images)
    ? vehicle.images.filter((image: unknown): image is string => typeof image === "string")
    : [];
  const publicImageList = imageList.map((image) => publicMediaUrl(image));
  const publicHeroImageUrl = publicMediaUrl(vehicle.heroImageUrl) || publicImageList[0] || '';
  const publicHeroVideoUrl = publicMediaUrl(vehicle.heroVideoUrl);
  const badge = vehicle.badge || getAvailabilityBadge(vehicle.status || "published").label;
  const specs = (vehicle.specifications || {}) as any;
  const overviewImageUrl = publicImageList[1] || publicHeroImageUrl;

  // Real per-vehicle options from the admin panel (/admin/vehicles/colors,
  // /admin/vehicles/models-variants), already included by the public vehicle
  // endpoint. Price is intentionally never selected here — this is a
  // browsing page, and price stays visible only on the Financing
  // Calculator / Configurator per the site's pricing convention.
  const optionColors = (vehicle.colors || []).filter((c: any) => c.inStock);
  const optionInteriors = (vehicle.interiors || []).filter((i: any) => i.inStock);
  const optionWheels = (vehicle.wheels || []).filter((w: any) => w.inStock);
  const optionPackages = vehicle.packages || [];
  const optionAccessories = (vehicle.accessories || []).filter((a: any) => a.inStock);

  const { data: allVehicles } = await apiClient
    .get("/public/vehicles")
    .catch(() => ({ data: [] as any[] }));
  const relatedVehicles = (Array.isArray(allVehicles) ? allVehicles : [])
    .filter((v: any) => v.id !== vehicle.id && v.isActive && v.status === "published")
    .filter((v: any) => {
      const categoryMatch = vehicle.categoryId
        ? v.categoryId === vehicle.categoryId
        : v.category === vehicle.category;
      const brandMatch = vehicle.brandId ? v.brandId === vehicle.brandId : false;
      return categoryMatch || brandMatch;
    })
    .sort((a: any, b: any) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
      Number(b.isFeatured) - Number(a.isFeatured) ||
      String(a.name).localeCompare(String(b.name))
    )
    .slice(0, 3);

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

  const publicOptionColors = optionColors.map((c: any) => ({
    ...c,
    imageUrl: publicMediaUrl(c.imageUrl),
    // Additional photos from other angles/sides (admin-managed, still mostly
    // empty while this is brand new) — resolved the same way the primary
    // imageUrl is, so a relative upload path renders correctly in the lightbox.
    images: Array.isArray(c.images)
      ? c.images.filter((img: unknown): img is string => typeof img === "string").map((img: string) => publicMediaUrl(img))
      : null,
  }));

  const galleries = publicImageList.slice(0, 8);

  // Dedicated per-section media (admin: Vehicle Sections → Interior/Exterior
  // tabs) — falls back to the general gallery/first few photos when a
  // vehicle hasn't had these set yet, so nothing goes blank mid-rollout.
  const dedicatedInteriorImages: string[] = Array.isArray(specs?.interior?.images) ? specs.interior.images : [];
  const dedicatedExteriorImages: string[] = Array.isArray(specs?.exterior?.images) ? specs.exterior.images : [];
  const technologyMedia: string[] = (Array.isArray(specs?.technology?.images) ? specs.technology.images : []).map((url: string) => publicMediaUrl(url));
  const safetyMedia: string[] = (Array.isArray(specs?.safety?.images) ? specs.safety.images : []).map((url: string) => publicMediaUrl(url));
  const interiorMedia = dedicatedInteriorImages.length > 0
    ? dedicatedInteriorImages.map((url: string) => publicMediaUrl(url))
    : publicImageList.slice(1, 5);
  const exteriorMedia = dedicatedExteriorImages.length > 0
    ? dedicatedExteriorImages.map((url: string) => publicMediaUrl(url))
    : galleries;
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

  // Warranty & Service (admin: Vehicle Sections → Warranty tab) — captured
  // for a long time but never actually rendered anywhere on the public site
  // until now. Mirrors the reference site's "Warranty Promise" section.
  const warrantyRows: [string, string][] = [
    ["Vehicle Warranty", specs?.warranty?.basic],
    ["Powertrain Warranty", specs?.warranty?.powertrain],
    ["Corrosion Warranty", specs?.warranty?.corrosion],
    ["Roadside Assistance", specs?.warranty?.roadside],
    ["Maintenance", specs?.warranty?.maintenance],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  // Real, per-vehicle "feature story" content (admin: Vehicle Sections →
  // Interior/Exterior tabs → Highlights) — brand new field, so most vehicles
  // will have [] for a while; both sections render nothing when empty.
  const exteriorHighlights = normalizeHighlights(specs?.exterior?.highlights);
  const interiorHighlights = normalizeHighlights(specs?.interior?.highlights);
  const technologyHighlights = normalizeHighlights(specs?.technology?.highlights);
  const safetyHighlights = normalizeHighlights(specs?.safety?.highlights);

  // Comfort & Experience, Technology, and Safety/ADAS used to render a
  // hardcoded, identical-for-every-vehicle feature list. These now read the
  // real per-vehicle strings already captured in Vehicle Sections (admin)
  // but never previously surfaced here — only fields that are actually
  // filled in become cards, and a section with zero filled fields renders
  // nothing at all.
  const comfortCards = (
    [
      ["Climate Control", specs?.interior?.climate],
      ["Seating", specs?.interior?.seats],
      ["Seating Capacity", specs?.interior?.seatingCapacity],
      ["Cargo Volume", specs?.interior?.cargoVolume],
    ] as [string, string | undefined][]
  ).filter(([, value]) => Boolean(value && String(value).trim())) as [string, string][];

  const technologyCards = (
    [
      ["Smart Infotainment", specs?.technology?.infotainment, "📱"],
      ["Connectivity", specs?.technology?.connectivity, "📡"],
    ] as [string, string | undefined, string][]
  ).filter(([, value]) => Boolean(value && String(value).trim())) as [string, string, string][];

  const safetyCards = (
    [
      ["Airbags", specs?.safety?.airbags],
      ["Anti-lock Braking System (ABS)", specs?.safety?.abs],
      ["Electronic Stability Control (ESC)", specs?.safety?.esc],
      ["Tire Pressure Monitoring (TPMS)", specs?.safety?.tpms],
      ["Camera System", specs?.safety?.cameras],
      ["Parking Sensors", specs?.safety?.sensors],
      ["Driver Assistance (ADAS)", specs?.safety?.adas],
    ] as [string, string | undefined][]
  ).filter(([, value]) => Boolean(value && String(value).trim())) as [string, string][];

  // Dimension diagram (Specifications section) — canonical `specs.exterior.*`
  // with a fallback to the legacy dual-written `specs.dimensions.*` for
  // vehicles saved before the Vehicle Sections rework.
  const dimLength = specs?.exterior?.length || specs?.dimensions?.length || "";
  const dimWidth = specs?.exterior?.width || specs?.dimensions?.width || "";
  const dimHeight = specs?.exterior?.height || specs?.dimensions?.height || "";
  const dimWheelbase = specs?.exterior?.wheelbase || specs?.dimensions?.wheelbase || "";
  const hasDimensionDiagram = Boolean(dimLength || dimWidth || dimHeight || dimWheelbase);

  // A photo for the new Download Brochure section — reuse a real gallery
  // photo (never a walkthrough video from the same gallery array), but not
  // the same one already shown as the sole hero image right above the fold,
  // so the same picture doesn't repeat back-to-back.
  const brochurePhotoCandidates = publicImageList.filter((img) => img && !isVideoUrl(img));
  const brochureImageUrl = brochurePhotoCandidates.find((img) => img !== publicHeroImageUrl) || brochurePhotoCandidates[0] || publicHeroImageUrl || "";

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
      <div id="section-overview" className="relative scroll-mt-[76px] bg-ink text-white">
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
            <ImageWithFallback
              src={publicHeroImageUrl}
              alt={vehicle.name}
              className="absolute inset-0 h-full w-full object-cover"
              iconClassName="h-12 w-12"
            />
          ) : (
            <div className="absolute inset-0 bg-mesh-blue" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <div className="absolute inset-x-0 bottom-0">
            <div className="page-container pb-10">
              <div className="flex items-center gap-2 text-[11px] tracking-wider mb-3 text-white/70">
                <Link href={`/models${visitId ? `?visitId=${encodeURIComponent(visitId)}` : ""}`} className="hover:text-white transition-colors">
                  Models
                </Link>
                <span>›</span>
                <span className="text-white">{vehicle.name}</span>
              </div>
              <div className="text-[11px] text-active-blue-80 font-bold tracking-wider mb-2 uppercase">
                {vehicle.vehicleCategory?.name || vehicle.category}
              </div>
              <h1 className="disp text-4xl md:text-6xl font-extrabold mb-6 max-w-2xl">{vehicle.name}</h1>

              <div className="flex gap-3 flex-wrap">
                <Button href={`/test-drive?model=${vehicle.slug}${visitParam}`} variant="solid" size="lg">
                  Schedule Test Drive
                </Button>
                <Button href="/compare" variant="outline" tone="dark" size="lg">
                  Compare
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KEY FACTS STRIP — a few headline specs, not the full table ── */}
      <div className="bg-white border-b border-line">
        <div className="page-container py-8">
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
      <section className="bg-white py-14 md:py-20">
        <div className="page-container grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-active-blue">Overview</div>
            <h2 className="disp mb-5 max-w-xl text-3xl font-bold text-navy md:text-5xl">Designed to move you forward.</h2>
            <p className="mb-7 max-w-xl text-base leading-relaxed text-steel">
              {vehicle.description || `The ${vehicle.name} brings confident performance, intelligent technology, and everyday comfort together in one distinctive Geely vehicle.`}
            </p>
            <div className="mb-8 flex flex-wrap items-center gap-5 text-sm">
            <a href={contactPhoneHref} className="flex items-center gap-2 font-semibold text-navy hover:text-active-blue transition-colors">
              <Phone size={16} /> Call Us
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in the Geely ${vehicle.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-semibold text-navy hover:text-active-blue transition-colors"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <Link href={`/quote?model=${vehicle.slug}${visitParam}`} className="font-semibold text-navy hover:text-active-blue transition-colors">
              Get a Quote
            </Link>
            <a href={brochureUrl} download className="flex items-center gap-2 font-semibold text-navy hover:text-active-blue transition-colors">
              <Download size={15} /> Download Brochure
            </a>
            <QuickRequestCallback vehicleModel={vehicle.name} />
            <ShareButton title={vehicle.name} />
          </div>
          </div>
          <div className="order-1 overflow-hidden bg-brand-neutral-3 lg:order-2">
            {overviewImageUrl ? (
              <ImageWithFallback src={overviewImageUrl} alt={`${vehicle.name} overview`} className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-navy text-sm text-white/60">{vehicle.name}</div>
            )}
          </div>
        </div>
      </section>

      {/* ── TAB NAVIGATION ────────────────────────────────────────────── */}
      <ModelPageTabs
        vehicleName={vehicle.name}
        testDriveHref={`/test-drive?model=${vehicle.slug}${visitParam}`}
      />

      {/* ── GALLERY SECTION — moved up to follow the reference site's flow
           (geelyauto.co.za/models/geely-e5-electric-suv): a showroom photo
           grid and the color/variant picker both come right after the tab
           nav, before the Interior/Comfort/Technology/Safety storytelling
           sections, not after them ── */}
      <section id="section-exteriors" className="scroll-mt-[76px] bg-white py-12">
        <div className="page-container">
          <h2 className="disp text-3xl text-navy font-bold mb-6">Exterior</h2>
          {exteriorMedia.length > 0 ? (
            <div className="space-y-6">
              {exteriorMedia.map((media: string, index: number) => (
                <div
                  key={`${media}-${index}`}
                  className="w-full aspect-[16/9] max-h-[720px] rounded-xl overflow-hidden bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4"
                >
                  {isVideoUrl(media) ? (
                    <video
                      src={media}
                      className="w-full h-full object-cover"
                      autoPlay
                      controls
                      muted
                      loop
                      playsInline
                      preload="auto"
                    />
                  ) : (
                    <ImageWithFallback
                      src={media}
                      alt={`${vehicle.name} gallery ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading={index === 0 ? "eager" : "lazy"}
                      iconClassName="h-10 w-10"
                    />
                  )}
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
        interiors={optionInteriors.map((i: any) => ({ ...i, imageUrl: publicMediaUrl(i.imageUrl) }))}
        wheels={optionWheels.map((w: any) => ({ ...w, imageUrl: publicMediaUrl(w.imageUrl) }))}
        packages={optionPackages.map((p: any) => ({
          ...p,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
          imageUrl: publicMediaUrl(p.imageUrl),
        }))}
        accessories={optionAccessories.map((a: any) => ({ ...a, imageUrl: publicMediaUrl(a.imageUrl) }))}
        specifications={specs}
        visitId={visitId}
      />

      {/* ── EXTERIOR HIGHLIGHTS — real, per-vehicle feature-story blocks
           (admin: Vehicle Sections → Exterior tab → Highlights). Brand new
           field; renders nothing until a vehicle has at least one entry —
           the plain Exterior gallery section above already covers the
           "no exterior content yet" case, so no placeholder here. ── */}
      {exteriorHighlights.length > 0 && (
        <FeatureStorySection
          id="section-exterior-highlights"
          eyebrow="Exterior"
          heading="Exterior Highlights"
          intro={`A closer look at what makes the ${vehicle.name}'s design stand out.`}
          highlights={exteriorHighlights}
          vehicleName={vehicle.name}
          tone="light"
        />
      )}

      {/* ── INTERIOR GALLERY SECTION ──────────────────────────────────── */}
      <section id="section-interior-gallery" className="scroll-mt-[76px] bg-white py-16">
        <div className="page-container">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-active-blue/10 text-active-blue px-4 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
              Interior
            </div>
            <h2 className="disp text-3xl text-navy font-bold mb-4">Interior Design</h2>
            <p className="text-steel text-base max-w-2xl">
              Where intuitive technology meets refined comfort, the {vehicle.name} transforms every journey into a seamless, rewarding experience.
            </p>
          </div>
          {(() => {
            if (interiorMedia.length === 0) {
              return (
                <div className="text-center text-steel py-12 border border-dashed border-line rounded-xl">
                  Interior images are managed from the admin panel.
                </div>
              );
            }
            const { gridClass, aspectClass } = mediaGridLayout(interiorMedia.length);
            return (
              <div className={`grid ${gridClass} gap-6`}>
                {interiorMedia.map((media: string, index: number) => (
                  <div
                    key={`interior-${index}`}
                    className={`${aspectClass} rounded-xl overflow-hidden bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4`}
                  >
                    {isVideoUrl(media) ? (
                      <video
                        src={media}
                        className="w-full h-full object-cover"
                        autoPlay
                        controls
                        muted
                        loop
                        playsInline
                        preload="auto"
                      />
                    ) : (
                      <ImageWithFallback
                        src={media}
                        alt={`${vehicle.name} interior ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        iconClassName="h-10 w-10"
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── INTERIOR HIGHLIGHTS — real, per-vehicle feature-story blocks
           (admin: Vehicle Sections → Interior tab → Highlights). Brand new
           field; renders nothing until a vehicle has at least one entry. ── */}
      {interiorHighlights.length > 0 && (
        <FeatureStorySection
          id="section-interior-highlights"
          eyebrow="Interior"
          heading="Interior Highlights"
          intro={`The details that shape everyday life inside the ${vehicle.name}.`}
          highlights={interiorHighlights}
          vehicleName={vehicle.name}
          tone="ice"
        />
      )}

      {/* ── COMFORT & EXPERIENCE SECTION — real per-vehicle data (admin:
           Vehicle Sections → Interior tab: climate/seats/seatingCapacity/
           cargoVolume). Only fields that are actually filled in become a
           card; if nothing is filled in for this vehicle, the section
           doesn't render at all. ── */}
      {comfortCards.length > 0 && (
        <section id="section-comfort" className="scroll-mt-[76px] bg-ice py-16">
          <div className="page-container">
            <div className="mb-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-active-blue/10 text-active-blue px-4 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
                Comfort & Experience
              </div>
              <h2 className="disp text-3xl text-navy font-bold mb-4">Comfort & Experience</h2>
              <p className="text-steel text-base max-w-2xl">
                Step inside the {vehicle.name} and discover a cabin where comfort meets intelligence. Every detail is thoughtfully designed to make every journey effortless.
              </p>
            </div>
            {(() => {
              const comfortImages = publicImageList.slice(2, 6).slice(0, 2);
              const comfortGridClass = comfortImages.length <= 1 ? 'grid-cols-1' : 'grid-cols-2';
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  <div className="space-y-6">
                    {comfortCards.map(([label, value], index) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-active-blue/10 flex items-center justify-center shrink-0">
                          <Check size={18} className="text-active-blue" />
                        </div>
                        <div>
                          <h3 className="font-bold text-navy mb-1">{label}</h3>
                          <p className="text-sm text-steel">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`grid ${comfortGridClass} gap-4`}>
                    {comfortImages.map((img: string, index: number) => (
                      <div
                        key={`comfort-${index}`}
                        className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4"
                      >
                        <ImageWithFallback
                          src={img}
                          alt={`${vehicle.name} comfort ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          iconClassName="h-8 w-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── TECHNOLOGY SECTION — real per-vehicle data (admin: Vehicle
           Sections → Technology tab: infotainment/connectivity). ── */}
      {technologyCards.length > 0 && (
        <section id="section-technology" className="scroll-mt-[76px] bg-white py-16">
          <div className="page-container">
            <div className="mb-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-active-blue/10 text-active-blue px-4 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
                Technology
              </div>
              <h2 className="disp text-3xl text-navy font-bold mb-4">Next Generation Tech</h2>
              <p className="text-steel text-base max-w-2xl">
                At the core of the {vehicle.name} lies advanced technology, engineered for exceptional efficiency, uncompromising safety, and seamless everyday practicality.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {technologyCards.map(([label, value, icon], index) => (
                <div key={index} className="text-center p-6 rounded-xl bg-ice hover:shadow-lg transition-shadow duration-300">
                  <div className="text-4xl mb-4">{icon}</div>
                  <h3 className="font-bold text-navy mb-2">{label}</h3>
                  <p className="text-sm text-steel">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TECHNOLOGY MEDIA — dedicated photos/videos (admin: Vehicle Sections
           → Technology tab → Photos & Videos). Renders nothing until a
           vehicle has at least one entry. ── */}
      {technologyMedia.length > 0 && (
        <section id="section-technology-media" className="scroll-mt-[76px] bg-ice py-12">
          <div className="page-container">
            <h2 className="disp text-3xl text-navy font-bold mb-6">Technology Media</h2>
            {(() => {
              const { gridClass, aspectClass } = mediaGridLayout(technologyMedia.length);
              return (
                <div className={`grid ${gridClass} gap-6`}>
                  {technologyMedia.map((media, index) => (
                    <div
                      key={`technology-${index}`}
                      className={`${aspectClass} rounded-xl overflow-hidden bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4`}
                    >
                      {isVideoUrl(media) ? (
                        <video
                          src={media}
                          className="w-full h-full object-cover"
                          autoPlay
                          controls
                          muted
                          loop
                          playsInline
                          preload="auto"
                        />
                      ) : (
                        <ImageWithFallback
                          src={media}
                          alt={`${vehicle.name} technology ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          iconClassName="h-10 w-10"
                        />
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── TECHNOLOGY DEEP DIVE — real, per-vehicle feature-story blocks
           (admin: Vehicle Sections → Technology tab → Highlights). Brand new
           field; renders nothing until a vehicle has at least one entry. ── */}
      {technologyHighlights.length > 0 && (
        <FeatureStorySection
          id="section-technology-highlights"
          eyebrow="Technology"
          heading="Technology Deep Dive"
          intro={`The engineering behind the ${vehicle.name}'s performance and efficiency.`}
          highlights={technologyHighlights}
          vehicleName={vehicle.name}
          tone="ice"
        />
      )}

      {/* ── SAFETY/ADAS SECTION — real per-vehicle data (admin: Vehicle
           Sections → Safety tab: airbags/abs/esc/tpms/cameras/sensors/adas). ── */}
      {safetyCards.length > 0 && (
        <section id="section-safety-adas" className="scroll-mt-[76px] bg-ink text-white py-16">
          <div className="page-container">
            <div className="mb-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-active-blue/20 text-active-blue-80 px-4 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
                Safety
              </div>
              <h2 className="disp text-3xl font-bold mb-4">Smart Driving, Enhanced Safety</h2>
              <p className="text-white/70 text-base max-w-2xl">
                Drive with greater confidence, thanks to the {vehicle.name}'s intelligent advanced driver assistance systems.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {safetyCards.map(([label, value], index) => (
                <div key={index} className="flex items-start gap-4 p-5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-full bg-active-blue/20 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-active-blue-80" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{label}</h3>
                    <p className="text-sm text-white/70">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SAFETY MEDIA — dedicated photos/videos (admin: Vehicle Sections
           → Safety tab → Photos & Videos). Renders nothing until a vehicle
           has at least one entry. ── */}
      {safetyMedia.length > 0 && (
        <section id="section-safety-media" className="scroll-mt-[76px] bg-white py-12">
          <div className="page-container">
            <h2 className="disp text-3xl text-navy font-bold mb-6">Safety Media</h2>
            {(() => {
              const { gridClass, aspectClass } = mediaGridLayout(safetyMedia.length);
              return (
                <div className={`grid ${gridClass} gap-6`}>
                  {safetyMedia.map((media, index) => (
                    <div
                      key={`safety-${index}`}
                      className={`${aspectClass} rounded-xl overflow-hidden bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4`}
                    >
                      {isVideoUrl(media) ? (
                        <video
                          src={media}
                          className="w-full h-full object-cover"
                          autoPlay
                          controls
                          muted
                          loop
                          playsInline
                          preload="auto"
                        />
                      ) : (
                        <ImageWithFallback
                          src={media}
                          alt={`${vehicle.name} safety ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          iconClassName="h-10 w-10"
                        />
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── SAFETY ENGINEERING — real, per-vehicle feature-story blocks
           (admin: Vehicle Sections → Safety tab → Highlights). Brand new
           field; renders nothing until a vehicle has at least one entry. ── */}
      {safetyHighlights.length > 0 && (
        <FeatureStorySection
          id="section-safety-highlights"
          eyebrow="Safety"
          heading="Safety Engineering"
          intro={`How the ${vehicle.name} is built to protect everyone inside it.`}
          highlights={safetyHighlights}
          vehicleName={vehicle.name}
          tone="light"
        />
      )}

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
        showcaseModelUrl={showcaseModelUrl}
        colors={publicOptionColors}
      />

      {/* ── SPECIFICATIONS — plain tabular layout, light typography, no
           boxed cards, matching the reference's spec table treatment ── */}
      <section id="section-specs" className="scroll-mt-[76px] bg-white py-16">
        <div className="page-container">
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
          {hasDimensionDiagram && (
            <details className="group mt-12 rounded-xl border border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider text-navy">
                <span>Dimension Diagram</span>
                <ChevronDown size={18} className="shrink-0 text-steel transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="border-t border-line px-6 py-8">
                <svg
                  viewBox="0 0 640 330"
                  className="mx-auto w-full max-w-2xl"
                  role="img"
                  aria-label={`${vehicle.name} dimension diagram`}
                >
                  {/* Ground line */}
                  <line x1="20" y1="256" x2="500" y2="256" stroke="#AEB5BE" strokeWidth="1.5" strokeDasharray="4 4" />

                  {/* Stylized, brand-neutral car side silhouette (not vehicle-specific) */}
                  <rect x="40" y="176" width="440" height="58" rx="16" fill="#F6F3F5" stroke="#E8E7E7" strokeWidth="2" />
                  <rect x="170" y="124" width="180" height="60" rx="20" fill="#F6F3F5" stroke="#E8E7E7" strokeWidth="2" />
                  <circle cx="110" cy="230" r="26" fill="#111318" />
                  <circle cx="110" cy="230" r="9" fill="#F6F3F5" />
                  <circle cx="410" cy="230" r="26" fill="#111318" />
                  <circle cx="410" cy="230" r="9" fill="#F6F3F5" />

                  {/* Height (C) */}
                  <line x1="20" y1="124" x2="20" y2="256" stroke="#194BFF" strokeWidth="1.5" />
                  <line x1="14" y1="124" x2="26" y2="124" stroke="#194BFF" strokeWidth="1.5" />
                  <line x1="14" y1="256" x2="26" y2="256" stroke="#194BFF" strokeWidth="1.5" />
                  <circle cx="20" cy="190" r="11" fill="#194BFF" />
                  <text x="20" y="194" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">C</text>

                  {/* Wheelbase (D) */}
                  <line x1="110" y1="278" x2="410" y2="278" stroke="#194BFF" strokeWidth="1.5" />
                  <line x1="110" y1="272" x2="110" y2="284" stroke="#194BFF" strokeWidth="1.5" />
                  <line x1="410" y1="272" x2="410" y2="284" stroke="#194BFF" strokeWidth="1.5" />
                  <circle cx="260" cy="278" r="11" fill="#194BFF" />
                  <text x="260" y="282" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">D</text>

                  {/* Length (A) */}
                  <line x1="40" y1="304" x2="480" y2="304" stroke="#194BFF" strokeWidth="1.5" />
                  <line x1="40" y1="298" x2="40" y2="310" stroke="#194BFF" strokeWidth="1.5" />
                  <line x1="480" y1="298" x2="480" y2="310" stroke="#194BFF" strokeWidth="1.5" />
                  <circle cx="260" cy="304" r="11" fill="#194BFF" />
                  <text x="260" y="308" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">A</text>

                  {/* Width (B) — a side profile can't show width, so a small top-view inset stands in */}
                  <rect x="480" y="44" width="130" height="46" rx="10" fill="#F6F3F5" stroke="#E8E7E7" strokeWidth="2" />
                  <line x1="480" y1="34" x2="610" y2="34" stroke="#194BFF" strokeWidth="1.5" />
                  <line x1="480" y1="28" x2="480" y2="40" stroke="#194BFF" strokeWidth="1.5" />
                  <line x1="610" y1="28" x2="610" y2="40" stroke="#194BFF" strokeWidth="1.5" />
                  <circle cx="545" cy="34" r="11" fill="#194BFF" />
                  <text x="545" y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">B</text>
                  <text x="545" y="106" textAnchor="middle" fontSize="10" fill="#69717B">Top view</text>
                </svg>

                <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-4 text-center sm:grid-cols-4">
                  {(
                    [
                      ["A", "Length", dimLength],
                      ["B", "Width", dimWidth],
                      ["C", "Height", dimHeight],
                      ["D", "Wheelbase", dimWheelbase],
                    ] as [string, string, string][]
                  )
                    .filter(([, , value]) => Boolean(value))
                    .map(([letter, label, value]) => (
                      <div key={letter}>
                        <div className="mb-1 text-xs font-bold text-active-blue">{letter} · {label}</div>
                        <div className="text-sm font-semibold text-navy">{value}</div>
                      </div>
                    ))}
                </div>
              </div>
            </details>
          )}
          {publicHeroVideoUrl && (
            <a
              href={publicHeroVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-8 text-sm text-active-blue font-semibold hover:underline"
            >
              ▶ Watch Full Video →
            </a>
          )}
        </div>
      </section>

      {/* ── FEATURES SECTION (id fixed — used to collide with the Safety/ADAS
           section's #section-safety-adas... actually with the OLD #section-safety
           id, which meant the tab-scroll IntersectionObserver could only ever
           find whichever of the two rendered first in the DOM) ── */}
      {featuredFeatures.length > 0 && (
        <section id="section-features-list" className="scroll-mt-[76px] bg-ice py-16">
          <div className="page-container">
            <h2 className="disp text-3xl text-navy font-bold mb-8">Vehicle Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {featuredFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 py-1">
                  <Check size={18} className="text-active-blue flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-navy">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WARRANTY PROMISE — admin-captured (Vehicle Sections → Warranty tab)
           since early in this project but never actually rendered anywhere on
           the public site until now; mirrors the reference site's own
           "Warranty Promise" section, placed right after Specifications ── */}
      {warrantyRows.length > 0 && (
        <section id="section-warranty" className="scroll-mt-[76px] bg-white py-16 border-t border-line">
          <div className="page-container">
            <div className="mb-8 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-active-blue/10 text-active-blue px-4 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
                Peace of Mind
              </div>
              <h2 className="disp text-3xl text-navy font-bold mb-4">Warranty Promise</h2>
              <p className="text-steel text-base max-w-2xl">
                Every {vehicle.name} is backed by Geely Ethiopia's comprehensive warranty coverage.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {warrantyRows.map(([label, value]) => (
                <div key={label} className="p-5 rounded-xl bg-ice">
                  <div className="text-xs font-bold uppercase tracking-wider text-active-blue mb-2">{label}</div>
                  <div className="text-lg font-bold text-navy">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DOWNLOAD BROCHURE — the Overview section already has a small inline
           text link (kept as-is); this is a more prominent, dedicated section
           with a real lifestyle photo (deliberately not the same photo as the
           hero, so the same image doesn't repeat back-to-back). No price, no
           financing/promo callout — this is a browsing page. ── */}
      {brochureImageUrl && (
        <section className="bg-ice py-16">
          <div className="page-container">
            <div className="grid grid-cols-1 items-stretch overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-2">
              <div className="aspect-[16/10] lg:aspect-auto">
                <ImageWithFallback
                  src={brochureImageUrl}
                  alt={`${vehicle.name} brochure`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  iconClassName="h-10 w-10"
                />
              </div>
              <div className="flex flex-col justify-center p-8 lg:p-14">
                <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-active-blue/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-active-blue">
                  Brochure
                </div>
                <h2 className="disp mb-4 text-3xl font-bold text-navy">Explore Every Detail</h2>
                <p className="mb-8 max-w-md text-base text-steel">
                  Download the full {vehicle.name} brochure for complete specifications, features, and imagery you can browse anytime, anywhere.
                </p>
                <a
                  href={brochureUrl}
                  download
                  className="inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-black px-8 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-active-blue md:text-base"
                >
                  <Download size={18} /> Download Brochure
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── DIRECT PURCHASE CTA ──────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <div className="bg-mesh-blue text-white rounded-2xl p-10 text-center">
            <div className="text-active-blue-80 text-xs font-bold tracking-wider mb-3 uppercase">Direct Vehicle Purchase</div>
            <h2 className="disp text-3xl font-bold mb-3">Own the {vehicle.name}</h2>
            <p className="text-[#d8e4f5] text-sm mb-6 max-w-xl mx-auto">
              Purchase directly through a supported Ethiopian bank and receive a purchase confirmation reference.
            </p>
            <Button href={`/financing/apply?vehicle=${vehicle.id}${visitParam}`} variant="solid" size="lg">
              Purchase This Vehicle
            </Button>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ─────────────────────────────────────────── */}
      <div className="bg-navy text-white py-16">
        <div className="page-container text-center">
          <h3 className="disp text-3xl font-bold mb-4">
            Ready to experience the {vehicle.name}?
          </h3>
          <p className="text-[#b9cbe4] text-base mb-8 max-w-2xl mx-auto">
            Book a test drive at your nearest showroom or request a personalized quote today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button href={`/test-drive?model=${vehicle.slug}${visitParam}`} variant="outline" tone="dark" size="lg">
              Book a Test Drive
            </Button>
            <Button href={`/quote?model=${vehicle.slug}${visitParam}`} variant="outline" tone="dark" size="lg">
              Request a Quote
            </Button>
          </div>
        </div>
      </div>

      {/* ── RELATED VEHICLES ──────────────────────────────────────────── */}
      {relatedVehicles.length > 0 && (
        <section className="py-12 bg-ice">
          <div className="page-container">
            <h2 className="disp text-3xl text-navy font-bold mb-8">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {relatedVehicles.map((rv: any) => (
                <Card key={rv.id} href={detailsHrefFor(rv.slug)} variant="boxed" className="group">
                  <div className="h-[160px] bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4 flex items-center justify-center text-xs text-steel overflow-hidden">
                    {rv.heroImageUrl || (Array.isArray(rv.images) && rv.images[0]) ? (
                      <ImageWithFallback
                        src={rv.heroImageUrl || (Array.isArray(rv.images) && typeof rv.images[0] === "string" ? rv.images[0] : "")}
                        alt={rv.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        iconClassName="h-7 w-7"
                      />
                    ) : (
                      rv.name
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-[11px] text-active-blue font-bold tracking-wider mb-2">{rv.category}</div>
                    <h3 className="text-lg text-navy font-bold mb-2 group-hover:text-active-blue transition-colors">
                      {rv.name}
                    </h3>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

    </MainLayout>
  );
}
