interface BreadcrumbItem {
  name: string;
  url: string;
}

export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
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

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Geely Ethiopia',
    url: 'https://geelyethiopia.com',
    logo: 'https://geelyethiopia.com/icons/icon-192x192.png',
    description: 'Official Geely dealer in Ethiopia',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ET',
    },
    sameAs: [],
  };
}

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Geely Ethiopia',
    url: 'https://geelyethiopia.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://geelyethiopia.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getProductSchema(product: {
  name: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: product.price
      ? {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency || 'ETB',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };
}

export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Geely Ethiopia',
    url: 'https://geelyethiopia.com',
    description: 'Official Geely dealer in Ethiopia by Kerchanshe Group',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ET',
    },
  };
}
