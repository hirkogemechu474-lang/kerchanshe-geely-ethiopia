/**
 * SEO / Schema.org structured data utilities.
 * Fixed: was lib/schema.ts importing non-existent @/types/vehicle and @/types/dealer.
 * Now imports from the canonical types folder.
 */

import type { Vehicle } from '@/types/vehicle';
import type { Dealer } from '@/types/dealer';

// ─── Organization ─────────────────────────────────────────────────────────────

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    '@id': 'https://geelyethiopia.com/#organization',
    name: 'Geely Ethiopia',
    alternateName: 'Geely Auto Ethiopia',
    legalName: 'Geely Ethiopia by Kerchanshe Auto',
    url: 'https://geelyethiopia.com',
    logo: 'https://geelyethiopia.com/images/geely-logo.png',
    description:
      'Official distributor of Geely vehicles in Ethiopia. Explore SUVs, sedans, and electric vehicles with nationwide dealer support.',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Bole Road, Atlas Area',
      addressLocality: 'Addis Ababa',
      addressCountry: 'ET',
      postalCode: '1000',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+251-11-000-0000',
        contactType: 'customer service',
        areaServed: 'ET',
        availableLanguage: ['English', 'Amharic'],
      },
    ],
    sameAs: [
      'https://www.facebook.com/geelyethiopia',
      'https://www.instagram.com/geelyethiopia',
      'https://www.youtube.com/@geelyethiopia',
    ],
    parentOrganization: {
      '@type': 'Corporation',
      name: 'Kerchanshe Group',
      url: 'https://kerchanshe.com',
    },
    areaServed: { '@type': 'Country', name: 'Ethiopia' },
    priceRange: 'ETB 800,000 - 3,500,000',
    paymentAccepted: 'Cash, Bank Transfer, Financing',
    currenciesAccepted: 'ETB',
  };
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export function getVehicleSchema(vehicle: Vehicle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    '@id': `https://geelyethiopia.com/models/${vehicle.id}#vehicle`,
    name: vehicle.name,
    description: vehicle.description,
    brand: { '@type': 'Brand', name: 'Geely' },
    manufacturer: { '@type': 'Organization', name: 'Geely Automobile' },
    model: vehicle.name,
    bodyType: vehicle.category,
    fuelType: vehicle.fuelType,
    vehicleTransmission: vehicle.specs.transmission ?? 'Automatic',
    driveWheelConfiguration: vehicle.specs.drivetrain ?? 'Front Wheel Drive',
    numberOfDoors: vehicle.specs.doors ?? 4,
    seatingCapacity: vehicle.specs.seating ?? 5,
    vehicleEngine: {
      '@type': 'EngineSpecification',
      engineType: vehicle.specs.engine,
      enginePower: {
        '@type': 'QuantitativeValue',
        value: vehicle.specs.power,
        unitText: 'HP',
      },
      fuelType: vehicle.fuelType,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ETB',
      price: vehicle.price,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'AutomotiveBusiness', name: 'Geely Ethiopia' },
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      url: `https://geelyethiopia.com/models/${vehicle.id}`,
    },
    image: [vehicle.image, ...(vehicle.gallery ?? [])],
    ...(vehicle.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: vehicle.rating,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    url: `https://geelyethiopia.com/models/${vehicle.id}`,
  };
}

// ─── Dealer ───────────────────────────────────────────────────────────────────

export function getDealerSchema(dealer: Dealer) {
  const addressStr =
    typeof dealer.address === 'string' ? dealer.address : dealer.address?.street ?? '';
  const lat = dealer.location?.lat ?? (dealer.coordinates as any)?.latitude;
  const lng = dealer.location?.lng ?? (dealer.coordinates as any)?.longitude;

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `https://geelyethiopia.com/dealers/${dealer.id}#dealer`,
    name: dealer.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: addressStr,
      addressLocality: dealer.city,
      addressRegion: dealer.region,
      addressCountry: 'ET',
    },
    ...(lat && lng && { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } }),
    telephone: dealer.phone,
    email: dealer.email,
    priceRange: 'ETB 800,000 - 3,500,000',
    url: `https://geelyethiopia.com/dealers/${dealer.id}`,
    parentOrganization: { '@type': 'AutomotiveBusiness', name: 'Geely Ethiopia' },
  };
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://geelyethiopia.com/#website',
    url: 'https://geelyethiopia.com',
    name: 'Geely Ethiopia',
    description: 'Official Geely Ethiopia website',
    publisher: { '@id': 'https://geelyethiopia.com/#organization' },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://geelyethiopia.com/models?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['en-ET', 'am-ET'],
  };
}

export function getOfferSchema(offer: {
  id: string;
  title: string;
  description: string;
  discount: number;
  validUntil: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: offer.title,
    description: offer.description,
    priceValidUntil: offer.validUntil,
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'AutomotiveBusiness', name: 'Geely Ethiopia' },
    url: `https://geelyethiopia.com/offers/${offer.id}`,
  };
}

export function renderJSONLD(schema: object | object[]) {
  return { __html: JSON.stringify(Array.isArray(schema) ? schema : [schema]) };
}
