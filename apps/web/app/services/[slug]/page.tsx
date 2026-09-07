import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getServicePage(slug: string) {
  try {
    // Self-fetch from this same server — must use the internal (localhost)
    // origin, not the public NEXT_PUBLIC_SITE_URL. Behind a reverse proxy
    // (production, or a local prod-mode build simulating one) that var is
    // the public-facing domain, which this server can't reliably reach a
    // loopback request to. Mirrors the NEXTAUTH_URL/NEXTAUTH_URL_INTERNAL
    // split already used for auth.
    const internalBaseUrl =
      process.env.SITE_URL_INTERNAL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:7501';
    const response = await fetch(
      `${internalBaseUrl}/api/public/services/pages/${slug}`,
      { cache: 'no-store' }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.page || null;
  } catch (error) {
    console.error('Error fetching service page:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getServicePage(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || page.title,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.excerpt || page.title,
      images: page.heroImage ? [page.heroImage] : [],
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getServicePage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {(page.heroImage || page.heroVideo) && (
        <div className="relative h-[400px] bg-gray-900">
          {page.heroVideo ? (
            <iframe
              src={page.heroVideo}
              className="absolute inset-0 w-full h-full object-cover"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : page.heroImage ? (
            <Image
              src={page.heroImage}
              alt={page.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-[1280px] mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {page.title}
              </h1>
              {page.excerpt && (
                <p className="text-xl text-gray-200 max-w-3xl">
                  {page.excerpt}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="max-w-[1280px] mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Page Header (if no hero) */}
        {!page.heroImage && !page.heroVideo && (
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="text-xl text-gray-600 max-w-3xl">
                {page.excerpt}
              </p>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">
              Published: {new Date(page.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span className="text-sm">
              Updated: {new Date(page.updatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-sm border border-gray-200 p-8">
              {page.content ? (
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              ) : (
                <p className="text-gray-600">
                  Content is being updated. Please check back soon.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* CTA Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-3">Interested?</h3>
                <p className="text-blue-100 mb-4">
                  Get in touch with our team to learn more about this service.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/test-drive"
                    className="block w-full bg-white dark:bg-midnight-surface text-blue-600 text-center py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
                  >
                    Book Test Drive
                  </Link>
                  <Link
                    href="/quote"
                    className="block w-full bg-blue-800 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors"
                  >
                    Get a Quote
                  </Link>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Call Us</div>
                    <a href="tel:+251111234567" className="text-blue-600 hover:text-blue-700">
                      +251 11 123 4567
                    </a>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Email</div>
                    <a href="mailto:info@geelyethiopia.com" className="text-blue-600 hover:text-blue-700">
                      info@geelyethiopia.com
                    </a>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Visit Us</div>
                    <Link href="/dealers" className="text-blue-600 hover:text-blue-700">
                      Find Nearest Dealer
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/service" className="block text-gray-700 hover:text-blue-600 transition-colors">
                    → Service Booking
                  </Link>
                  <Link href="/parts" className="block text-gray-700 hover:text-blue-600 transition-colors">
                    → Spare Parts
                  </Link>
                  <Link href="/warranty" className="block text-gray-700 hover:text-blue-600 transition-colors">
                    → Warranty Information
                  </Link>
                  <Link href="/roadside" className="block text-gray-700 hover:text-blue-600 transition-colors">
                    → Roadside Assistance
                  </Link>
                  <Link href="/financing" className="block text-gray-700 hover:text-blue-600 transition-colors">
                    → Financing Options
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Services Section */}
      <div className="bg-white dark:bg-midnight-surface border-t border-gray-200 py-12">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/test-drive"
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-blue-600 hover:shadow-md transition-all"
            >
              <h3 className="font-bold text-gray-900 mb-2">Test Drive</h3>
              <p className="text-sm text-gray-600">Book a test drive today</p>
            </Link>
            <Link
              href="/financing"
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-blue-600 hover:shadow-md transition-all"
            >
              <h3 className="font-bold text-gray-900 mb-2">Financing</h3>
              <p className="text-sm text-gray-600">Flexible payment options</p>
            </Link>
            <Link
              href="/warranty"
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-blue-600 hover:shadow-md transition-all"
            >
              <h3 className="font-bold text-gray-900 mb-2">Warranty</h3>
              <p className="text-sm text-gray-600">5-year comprehensive warranty</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
