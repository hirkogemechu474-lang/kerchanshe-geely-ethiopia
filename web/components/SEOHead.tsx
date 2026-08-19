import { renderJSONLD } from '@/lib/schema';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  ogImageAlt?: string;
  schema?: object | object[];
  keywords?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export function SEOHead({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  ogImageAlt,
  schema,
  keywords,
  noIndex = false,
  noFollow = false,
}: SEOHeadProps) {
  const fullTitle = title.includes('Geely Ethiopia')
    ? title
    : `${title} | Geely Ethiopia`;

  const defaultImage = ogImage || 'https://geelyethiopia.com/images/og-default.jpg';
  const defaultImageAlt = ogImageAlt || 'Geely Ethiopia - Official Distributor';

  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={defaultImage} />
      <meta property="og:image:alt" content={defaultImageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content="Geely Ethiopia" />
      <meta property="og:locale" content="en_ET" />
      <meta property="og:locale:alternate" content="am_ET" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultImage} />
      <meta name="twitter:image:alt" content={defaultImageAlt} />
      <meta name="twitter:site" content="@geelyethiopia" />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="Geely Ethiopia" />
      <meta name="publisher" content="Geely Ethiopia by Kerchanshe Auto" />
      <meta name="language" content="English, Amharic" />
      <meta name="geo.region" content="ET" />
      <meta name="geo.placename" content="Ethiopia" />
      
      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={renderJSONLD(schema)}
        />
      )}
    </>
  );
}

// Pre-configured SEO for common pages
export const CommonSEO = {
  home: {
    title: "Geely Ethiopia | Official Distributor by Kerchanshe Auto",
    description: "Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles, discover global engineering built for Ethiopian roads. Official distributor with nationwide support.",
    keywords: "Geely Ethiopia, Geely cars, SUV Ethiopia, Geely Coolray, Geely Emgrand, Electric vehicles Ethiopia, Kerchanshe Auto, car dealer Ethiopia",
    canonical: "https://geelyethiopia.com",
  },
  models: {
    title: "Geely Vehicle Models in Ethiopia | SUVs, Sedans & Electric",
    description: "Browse all Geely vehicle models available in Ethiopia. Explore compact SUVs, family sedans, luxury vehicles, and electric cars with competitive pricing and financing options.",
    keywords: "Geely models, Geely SUV, Geely sedan, Geely electric car, Coolray, Emgrand, Monjaro, Azkarra, Geometry EX5",
    canonical: "https://geelyethiopia.com/models",
  },
  dealers: {
    title: "Geely Dealers in Ethiopia | Showrooms & Service Centers",
    description: "Find Geely dealers across Ethiopia. Locate authorized showrooms and service centers in Addis Ababa, Bahir Dar, Hawassa, and other major cities.",
    keywords: "Geely dealer Ethiopia, Geely showroom, car dealer Addis Ababa, Geely service center",
    canonical: "https://geelyethiopia.com/dealers",
  },
  financing: {
    title: "Geely Vehicle Financing in Ethiopia | Car Loans & Payment Plans",
    description: "Flexible financing options for your Geely vehicle. Partner with major Ethiopian banks offering competitive interest rates, flexible terms, and easy approval.",
    keywords: "car financing Ethiopia, auto loan Ethiopia, Geely payment plan, car loan calculator",
    canonical: "https://geelyethiopia.com/financing",
  },
  testDrive: {
    title: "Book a Test Drive | Experience Geely in Ethiopia",
    description: "Schedule your Geely test drive today. Experience comfort, technology, and performance firsthand at any of our dealer locations across Ethiopia.",
    keywords: "test drive Geely, book test drive Ethiopia, Geely test drive booking",
    canonical: "https://geelyethiopia.com/test-drive",
  },
  quote: {
    title: "Get a Quote | Geely Vehicle Pricing in Ethiopia",
    description: "Request a personalized quote for your Geely vehicle. Get detailed pricing, available trims, optional packages, and financing estimates.",
    keywords: "Geely price Ethiopia, car quote, vehicle pricing, Geely cost",
    canonical: "https://geelyethiopia.com/quote",
  },
  electric: {
    title: "Electric Vehicles by Geely | Geometry EX5 in Ethiopia",
    description: "Discover Geely's electric vehicle lineup in Ethiopia. Experience the future of mobility with zero emissions, lower running costs, and advanced technology.",
    keywords: "electric car Ethiopia, Geely EV, Geometry EX5, electric SUV, zero emissions",
    canonical: "https://geelyethiopia.com/electric",
  },
  about: {
    title: "About Geely Ethiopia | Kerchanshe Auto Partnership",
    description: "Learn about Geely Ethiopia, the official distributor backed by Kerchanshe Group's 20+ years of automotive excellence in Ethiopia.",
    keywords: "about Geely Ethiopia, Kerchanshe Group, Geely distributor, Geely history",
    canonical: "https://geelyethiopia.com/about",
  },
};
