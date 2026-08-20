// Schema.org structured data utilities for SEO

import { Vehicle } from '@/types/vehicle';
import { Dealer } from '@/types/dealer';

// Organization Schema (Geely Ethiopia)
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    "@id": "https://geelyethiopia.com/#organization",
    "name": "Geely Ethiopia",
    "alternateName": "Geely Auto Ethiopia",
    "legalName": "Geely Ethiopia by Kerchanshe Auto",
    "url": "https://geelyethiopia.com",
    "logo": "https://geelyethiopia.com/images/geely-logo.png",
    "image": "https://geelyethiopia.com/images/geely-showroom.jpg",
    "description": "Official distributor of Geely vehicles in Ethiopia. Explore SUVs, sedans, and electric vehicles with nationwide dealer support.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bole Road, Atlas Area",
      "addressLocality": "Addis Ababa",
      "addressCountry": "ET",
      "postalCode": "1000"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+251-11-000-0000",
        "contactType": "customer service",
        "areaServed": "ET",
        "availableLanguage": ["English", "Amharic"]
      },
      {
        "@type": "ContactPoint",
        "telephone": "+251-11-000-0001",
        "contactType": "sales",
        "areaServed": "ET",
        "availableLanguage": ["English", "Amharic"]
      }
    ],
    "sameAs": [
      "https://www.facebook.com/geelyethiopia",
      "https://www.instagram.com/geelyethiopia",
      "https://www.youtube.com/@geelyethiopia",
      "https://twitter.com/geelyethiopia",
      "https://www.linkedin.com/company/geely-ethiopia"
    ],
    "parentOrganization": {
      "@type": "Corporation",
      "name": "Kerchanshe Group",
      "url": "https://kerchanshe.com"
    },
    "brand": {
      "@type": "Brand",
      "name": "Geely",
      "logo": "https://geelyethiopia.com/images/geely-logo.png"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Ethiopia"
    },
    "paymentAccepted": "Cash, Bank Transfer, Financing",
    "currenciesAccepted": "ETB"
  };
}

// Vehicle Schema
export function getVehicleSchema(vehicle: Vehicle) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": `https://geelyethiopia.com/models/${vehicle.id}#vehicle`,
    "name": vehicle.name,
    "description": vehicle.description,
    "brand": {
      "@type": "Brand",
      "name": "Geely"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "Geely Automobile"
    },
    "model": vehicle.name,
    "vehicleConfiguration": vehicle.specs.trim || "Standard",
    "bodyType": vehicle.category,
    "fuelType": vehicle.fuelType,
    "vehicleTransmission": vehicle.specs.transmission || "Automatic",
    "driveWheelConfiguration": vehicle.specs.drivetrain || "Front Wheel Drive",
    "numberOfDoors": vehicle.specs.doors || 4,
    "seatingCapacity": vehicle.specs.seating || 5,
    "vehicleEngine": {
      "@type": "EngineSpecification",
      "engineType": vehicle.specs.engine,
      "enginePower": {
        "@type": "QuantitativeValue",
        "value": vehicle.specs.power,
        "unitText": "HP"
      },
      "fuelType": vehicle.fuelType
    },
    "fuelConsumption": {
      "@type": "QuantitativeValue",
      "value": vehicle.specs.fuelEconomy || vehicle.specs.range,
      "unitText": vehicle.fuelType === "Electric" ? "km" : "L/100km"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "ETB",
      "price": vehicle.price,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "AutomotiveBusiness",
        "name": "Geely Ethiopia"
      },
      "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
      "itemCondition": "https://schema.org/NewCondition",
      "url": `https://geelyethiopia.com/models/${vehicle.id}`
    },
    "image": [
      vehicle.image,
      ...(vehicle.gallery || [])
    ],
    "color": vehicle.colors?.map(color => typeof color === "string" ? color : color.name).join(", ") || "Multiple colors available",
    "aggregateRating": vehicle.rating ? {
      "@type": "AggregateRating",
      "ratingValue": vehicle.rating,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined,
    "url": `https://geelyethiopia.com/models/${vehicle.id}`
  };
}

// Local Business Schema (for dealer locations)
export function getDealerSchema(dealer: Dealer) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `https://geelyethiopia.com/dealers/${dealer.id}#dealer`,
    "name": dealer.name,
    "image": dealer.image || "https://geelyethiopia.com/images/dealer-default.jpg",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": dealer.address,
      "addressLocality": dealer.city,
      "addressRegion": dealer.region,
      "addressCountry": "ET"
    },
    "geo": dealer.location ? {
      "@type": "GeoCoordinates",
      "latitude": dealer.location.lat,
      "longitude": dealer.location.lng
    } : undefined,
    "telephone": dealer.phone,
    "email": dealer.email,
    "openingHoursSpecification": dealer.hours ? [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "17:00"
      }
    ] : undefined,
    "url": `https://geelyethiopia.com/dealers/${dealer.id}`,
    "parentOrganization": {
      "@type": "AutomotiveBusiness",
      "name": "Geely Ethiopia"
    }
  };
}

// Special Offer Schema
export function getOfferSchema(offer: {
  id: string;
  title: string;
  description: string;
  discount: number;
  validUntil: string;
  applicableVehicles?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "@id": `https://geelyethiopia.com/offers/${offer.id}#offer`,
    "name": offer.title,
    "description": offer.description,
    "discount": {
      "@type": "MonetaryAmount",
      "value": offer.discount,
      "currency": "ETB"
    },
    "priceValidUntil": offer.validUntil,
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "AutomotiveBusiness",
      "name": "Geely Ethiopia"
    },
    "url": `https://geelyethiopia.com/offers/${offer.id}`,
    "eligibleRegion": {
      "@type": "Country",
      "name": "Ethiopia"
    }
  };
}

// Breadcrumb Schema
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// FAQ Schema
export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Product Collection Schema (for model listings)
export function getProductCollectionSchema(vehicles: Vehicle[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Geely Vehicle Models in Ethiopia",
    "description": "Browse all Geely vehicle models available in Ethiopia including SUVs, sedans, and electric vehicles",
    "url": "https://geelyethiopia.com/models",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": vehicles.map((vehicle, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Car",
          "name": vehicle.name,
          "url": `https://geelyethiopia.com/models/${vehicle.id}`,
          "image": vehicle.image,
          "offers": {
            "@type": "Offer",
            "price": vehicle.price,
            "priceCurrency": "ETB"
          }
        }
      }))
    }
  };
}

// Website Schema
export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://geelyethiopia.com/#website",
    "url": "https://geelyethiopia.com",
    "name": "Geely Ethiopia",
    "description": "Official Geely Ethiopia website - Browse vehicles, book test drives, find dealers",
    "publisher": {
      "@id": "https://geelyethiopia.com/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://geelyethiopia.com/models?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["en-ET", "am-ET"]
  };
}

// Helper to render JSON-LD script tag
export function renderJSONLD(schema: object | object[]) {
  return {
    __html: JSON.stringify(Array.isArray(schema) ? schema : [schema])
  };
}
