import { Metadata } from 'next';
import { MainLayout } from '@/components/MainLayout';
import { serverApiClient } from '@/lib/serverApiClient';
import { Cookie } from 'lucide-react';



export const metadata: Metadata = {
  title: 'Cookie Policy - Geely Ethiopia',
  description: 'Learn about how Geely Ethiopia uses cookies on our website.',
};

async function getCookiePolicy() {
  try {
    const client = await serverApiClient();
    const { data } = await client.get('/public/settings/cookie_policy');
    return data?.value || null;
  } catch (error) {
    console.error('Error fetching cookie policy:', error);
    return null;
  }
}

export default async function CookiePolicyPage() {
  const cookieContent = await getCookiePolicy();

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-sm p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Cookie className="text-orange-600" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy dark:text-ice">Cookie Policy</h1>
                <p className="text-gray-600">How we use cookies to improve your experience</p>
              </div>
            </div>
            <div className="border-t pt-4 text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-sm p-8">
            {cookieContent ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {cookieContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Cookie className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Cookie Policy Not Available</h3>
                <p className="text-gray-600 mb-6">
                  Our cookie policy is currently being updated. Please check back soon.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
                  <h4 className="font-bold text-orange-900 mb-3">What Are Cookies?</h4>
                  <p className="text-sm text-orange-800 mb-3">
                    Cookies are small text files stored on your device when you visit our website. They help us provide a better experience.
                  </p>
                  <h4 className="font-bold text-orange-900 mb-3">Types of Cookies We Use:</h4>
                  <ul className="text-sm text-orange-800 space-y-2">
                    <li>• <strong>Essential:</strong> Required for the website to function properly</li>
                    <li>• <strong>Analytics:</strong> Help us understand how visitors use our site</li>
                    <li>• <strong>Functional:</strong> Remember your preferences and settings</li>
                    <li>• <strong>Marketing:</strong> Track your browsing to show relevant content</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Managing Cookies */}
          <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-sm p-8 mt-8">
            <h3 className="text-xl font-bold text-navy dark:text-ice mb-4">How to Manage Cookies</h3>
            <p className="text-gray-600 mb-4">
              You can control and manage cookies in your browser settings. Here's how:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-bold mb-2">Google Chrome</h4>
                <p className="text-sm text-gray-600">
                  Settings → Privacy and Security → Cookies and other site data
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold mb-2">Mozilla Firefox</h4>
                <p className="text-sm text-gray-600">
                  Options → Privacy & Security → Cookies and Site Data
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold mb-2">Safari</h4>
                <p className="text-sm text-gray-600">
                  Preferences → Privacy → Manage Website Data
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-bold mb-2">Microsoft Edge</h4>
                <p className="text-sm text-gray-600">
                  Settings → Privacy, search, and services → Cookies
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="font-bold text-yellow-900 mb-3">⚠️ Note</h3>
            <p className="text-yellow-800 text-sm">
              Blocking or deleting cookies may affect your experience on our website. Some features may not work properly without cookies enabled.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="font-bold text-blue-900 mb-3">Questions About Cookies?</h3>
            <p className="text-blue-800 text-sm mb-4">
              If you have questions about how we use cookies, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/contact"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center"
              >
                Contact Us
              </a>
              <a
                href="mailto:info@geelyethiopia.com"
                className="inline-block bg-white dark:bg-midnight-surface text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 text-center"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
