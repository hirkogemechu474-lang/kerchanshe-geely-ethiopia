/**
 * SEO Meta Helpers
 * Generate OpenGraph, Twitter Cards, JSON-LD structured data
 */

interface SEOMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

export function generateSEOMeta(props: SEOMetaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://geelyethiopia.com';
  const fullUrl = props.url ? `${baseUrl}${props.url}` : baseUrl;
  const ogImage = props.image || `${baseUrl}/images/og-default.jpg`;

  return {
    title: `${props.title} | Geely Ethiopia`,
    description: props.description,
    openGraph: {
      type: props.type || 'website',
      url: fullUrl,
      title: props.title,
      description: props.description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: props.title }],
      siteName: 'Geely Ethiopia',
      ...(props.publishedTime && { publishedTime: props.publishedTime }),
      ...(props.modifiedTime && { modifiedTime: props.modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: props.title,
      description: props.description,
      images: [ogImage],
      creator: '@geelyethiopia',
    },
    ...(props.tags && { keywords: props.tags.join(', ') }),
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  image: string;
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedTime,
    dateModified: article.modifiedTime || article.publishedTime,
    author: {
      '@type': 'Organization',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Geely Ethiopia',
      logo: {
        '@type': 'ImageObject',
        url: 'https://geelyethiopia.com/images/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  sku?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { '@type': 'Brand', name: product.brand || 'Geely' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'ETB',
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      seller: { '@type': 'Organization', name: 'Geely Ethiopia' },
    },
    ...(product.sku && { sku: product.sku }),
  };
}
