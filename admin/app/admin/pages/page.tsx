import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import {
  Eye,
  EyeOff,
  ExternalLink,
  Edit,
  FileText,
  Wrench,
  Package,
  Layers,
  Shield,
  MessageSquare,
  Star,
  Globe,
} from 'lucide-react';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'All Dynamic Pages',
  description: 'Manage all dynamic content pages across the website',
};

interface PageRow {
  id: string;
  type: string;
  typeLabel: string;
  icon: any;
  title: string;
  subtitle?: string;
  publicUrl: string;
  editHref: string;
  isPublished: boolean;
  updatedAt: Date;
}

export default async function AllPagesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.permissions.canManageContent) {
    redirect('/admin/unauthorized');
  }

  const pages: PageRow[] = [];

  // Service pages
  try {
    const servicePages = await prisma.servicePage.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    servicePages.forEach((p) =>
      pages.push({
        id: p.id,
        type: 'service',
        typeLabel: 'Service',
        icon: Wrench,
        title: p.title,
        subtitle: p.excerpt || undefined,
        publicUrl: `/services/${p.slug}`,
        editHref: `/admin/services-menu/pages/${p.id}/edit`,
        isPublished: p.isPublished,
        updatedAt: p.updatedAt,
      })
    );
  } catch (e) {
    console.error('Service pages:', e);
  }

  // Parts page content (single record)
  try {
    const parts = await prisma.partsPageContent.findFirst();
    if (parts) {
      pages.push({
        id: parts.id,
        type: 'parts',
        typeLabel: 'Parts',
        icon: Package,
        title: 'Parts Center',
        subtitle: parts.heroTitle || undefined,
        publicUrl: '/parts',
        editHref: '/admin/parts/content',
        isPublished: true,
        updatedAt: parts.updatedAt,
      });
    }
  } catch (e) {
    console.error('Parts content:', e);
  }

  // Hero sections
  try {
    const heroes = await prisma.heroSection.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    heroes.forEach((h) =>
      pages.push({
        id: h.id,
        type: 'hero',
        typeLabel: 'Homepage Hero',
        icon: Globe,
        title: h.title,
        subtitle: h.subtitle || undefined,
        publicUrl: '/',
        editHref: '/admin/content/hero',
        isPublished: h.isActive,
        updatedAt: h.updatedAt,
      })
    );
  } catch (e) {
    console.error('Hero sections:', e);
  }

  // Vehicle showcase
  try {
    const showcases = await prisma.vehicleShowcase.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    showcases.forEach((s) =>
      pages.push({
        id: s.id,
        type: 'showcase',
        typeLabel: 'Vehicle Showcase',
        icon: Layers,
        title: s.title,
        subtitle: s.subtitle || undefined,
        publicUrl: '/',
        editHref: '/admin/vehicles/settings#sec-360',
        isPublished: s.isActive,
        updatedAt: s.updatedAt,
      })
    );
  } catch (e) {
    console.error('Vehicle showcase:', e);
  }

  // Policy settings
  try {
    const policies = await prisma.setting.findMany({
      where: { type: 'policy' },
      orderBy: { updatedAt: 'desc' },
    });
    policies.forEach((s) =>
      pages.push({
        id: s.id,
        type: 'policy',
        typeLabel: 'Policy',
        icon: Shield,
        title: s.key
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        publicUrl: `/${s.key.replace('_', '-').replace('policy-', '')}`,
        editHref: '/admin/settings/policies',
        isPublished: Boolean(s.value),
        updatedAt: s.updatedAt,
      })
    );
  } catch (e) {
    console.error('Policies:', e);
  }

  // FAQ counts
  let faqCount = 0;
  let reviewCount = 0;
  try {
    faqCount = await prisma.fAQ.count({ where: { isActive: true } });
    reviewCount = await prisma.review.count({ where: { isActive: true } });
  } catch (e) {
    console.error('Counts:', e);
  }

  const published = pages.filter((p) => p.isPublished).length;
  const drafts = pages.length - published;
  const typeGroups = [...new Set(pages.map((p) => p.typeLabel))];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Dynamic Pages</h1>
          <p className="text-gray-600 mt-1">
            Every dynamic content page managed across the website
          </p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 text-geely-blue border border-geely-blue rounded-lg hover:bg-blue-50 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About Dynamic Pages</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• This is the central directory for all content-managed pages</li>
          <li>• Each row links to its specific editor in the admin panel</li>
          <li>• Published pages are visible to the public, drafts are hidden</li>
          <li>• Static pages are configured elsewhere under Content, Menu and Settings</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{pages.length}</div>
          <div className="text-sm text-gray-600">Content Pages</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{published}</div>
          <div className="text-sm text-gray-600">Published</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-400">{drafts}</div>
          <div className="text-sm text-gray-600">Drafts</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-geely-blue">{typeGroups.length}</div>
          <div className="text-sm text-gray-600">Content Types</div>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">No content pages found</h3>
          <p className="text-gray-600">Create pages from the Services menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <div
                key={`${page.type}-${page.id}`}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-gray-100 shrink-0">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{page.title}</h3>
                        {page.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shrink-0">
                            <Eye className="w-3 h-3" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 shrink-0">
                            <EyeOff className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-geely-blue bg-blue-50 px-2 py-0.5 rounded">
                          {page.typeLabel}
                        </span>
                        <span className="text-xs text-gray-400">
                          Updated {new Date(page.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {page.subtitle && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-1">{page.subtitle}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <code className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                          {page.publicUrl}
                        </code>
                        {page.isPublished && page.publicUrl !== '/' && (
                          <a
                            href={page.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-geely-blue hover:text-navy"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={page.editHref}
                    className="p-2 text-geely-blue hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    title={`Edit ${page.title}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" /> Related Content
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            href="/admin/faq"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">FAQ Library</div>
              <div className="text-xs text-gray-500">{faqCount} active FAQ entries</div>
            </div>
          </Link>
          <Link
            href="/admin/reviews"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Star className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">Customer Reviews</div>
              <div className="text-xs text-gray-500">{reviewCount} active reviews</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
