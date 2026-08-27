import { Metadata } from 'next';
import { MainLayout } from '@/components/MainLayout';
import { prisma } from '@/lib/prisma';
import { FileText } from 'lucide-react';



export const metadata: Metadata = {
  title: 'Terms of Service - Geely Ethiopia',
  description: 'Read the terms and conditions for using Geely Ethiopia services.',
};

async function getTermsOfService() {
  try {
    const terms = await prisma.setting.findUnique({
      where: { key: 'terms_of_service' }
    });
    return terms?.value || null;
  } catch (error) {
    console.error('Error fetching terms of service:', error);
    return null;
  }
}

export default async function TermsOfServicePage() {
  const termsContent = await getTermsOfService();

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-sm p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="text-green-600" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy dark:text-ice">Terms of Service</h1>
                <p className="text-gray-600">Rules and conditions for using our services</p>
              </div>
            </div>
            <div className="border-t pt-4 text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-midnight-surface rounded-lg shadow-sm p-8">
            {termsContent ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {termsContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Terms of Service Not Available</h3>
                <p className="text-gray-600 mb-6">
                  Our terms of service are currently being updated. Please check back soon.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
                  <h4 className="font-bold text-green-900 mb-3">General Guidelines:</h4>
                  <ul className="text-sm text-green-800 space-y-2">
                    <li>• By using our website, you agree to our terms</li>
                    <li>• Prices and availability are subject to change</li>
                    <li>• Test drives require a valid driver's license</li>
                    <li>• Quotations are valid for the specified period</li>
                    <li>• We reserve the right to refuse service for any reason</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="font-bold text-yellow-900 mb-3">⚠️ Important Notice</h3>
            <p className="text-yellow-800 text-sm">
              By using our website and services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
              If you do not agree with any part of these terms, please do not use our services.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="font-bold text-blue-900 mb-3">Questions About Our Terms?</h3>
            <p className="text-blue-800 text-sm mb-4">
              If you have any questions about our terms of service, please contact us.
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
