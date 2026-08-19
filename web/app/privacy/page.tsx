import { Metadata } from 'next';
import { MainLayout } from '@/components/MainLayout';
import { prisma } from '@/lib/prisma';
import { Shield } from 'lucide-react';



export const metadata: Metadata = {
  title: 'Privacy Policy - Geely Ethiopia',
  description: 'Learn how Geely Ethiopia collects, uses, and protects your personal information.',
};

async function getPrivacyPolicy() {
  try {
    const policy = await prisma.setting.findUnique({
      where: { key: 'privacy_policy' }
    });
    return policy?.value || null;
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    return null;
  }
}

export default async function PrivacyPolicyPage() {
  const privacyContent = await getPrivacyPolicy();

  return (
    <MainLayout>
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="text-blue-600" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy">Privacy Policy</h1>
                <p className="text-gray-600">How we collect, use, and protect your data</p>
              </div>
            </div>
            <div className="border-t pt-4 text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            {privacyContent ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {privacyContent}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Privacy Policy Not Available</h3>
                <p className="text-gray-600 mb-6">
                  Our privacy policy is currently being updated. Please check back soon.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
                  <h4 className="font-bold text-blue-900 mb-3">What You Should Know:</h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>• We take your privacy seriously</li>
                    <li>• We only collect information necessary to provide our services</li>
                    <li>• We never sell your personal information to third parties</li>
                    <li>• You have the right to access, correct, or delete your data</li>
                    <li>• For privacy concerns, contact us at info@geelyethiopia.com</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="font-bold text-blue-900 mb-3">Questions About Our Privacy Policy?</h3>
            <p className="text-blue-800 text-sm mb-4">
              If you have any questions or concerns about how we handle your data, please don't hesitate to contact us.
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
                className="inline-block bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 text-center"
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
