import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { PageHeader, Card, Button } from '@/components/admin/ui';
import {
  CreditCard,
  Phone,
  Car,
  Building,
  Cookie,
  Share2,
  Globe,
  Mail,
  MessageCircle,
  Key,
  Bell,
  ChevronRight,
  FileText,
  UserCircle2,
} from 'lucide-react';

export default async function SettingsPage() {
  await requirePermission('canManageSettings');

  const settingsSections = [
    {
      title: 'Financing Programs & Banks',
      description: 'Manage bank partners, financing offers, Apply Now / Direct Pay / Visit Showroom actions per program, and configure the calculator, fees, process, and support settings.',
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-600',
      accent: 'text-blue-600',
      bgAccent: 'bg-blue-50',
      borderAccent: 'border-blue-200',
      href: '/admin/financing',
      badge: 'Finance · LIVE',
    },
    {
      title: 'Business Info',
      description: 'Company legal name, VAT/TIN, trade license, operating hours, currency, and timezone.',
      icon: Building,
      color: 'from-indigo-500 to-indigo-600',
      accent: 'text-indigo-600',
      bgAccent: 'bg-indigo-50',
      borderAccent: 'border-indigo-200',
      href: '/admin/settings/business-settings',
      badge: 'General',
    },
    {
      title: 'About / Company Story',
      description: 'Content for the /about page (hero, partnership narrative, Geely global, Kerchanshe Group, Why Choose, CTA) and the About section on the home page.',
      icon: UserCircle2,
      color: 'from-amber-500 to-orange-600',
      accent: 'text-amber-700',
      bgAccent: 'bg-amber-50',
      borderAccent: 'border-amber-200',
      href: '/admin/settings/about',
      badge: 'Content',
    },
    {
      title: 'Contact Information',
      description: 'Headquarters address, GPS coordinates, phone lines, email addresses, and WhatsApp support.',
      icon: Phone,
      color: 'from-orange-500 to-orange-600',
      accent: 'text-orange-600',
      bgAccent: 'bg-orange-50',
      borderAccent: 'border-orange-200',
      href: '/admin/settings/contact-information',
      badge: 'General',
    },
    {
      title: 'Social Media',
      description: 'Links to Facebook, Instagram, Twitter/X, YouTube, LinkedIn, TikTok, and Telegram profiles.',
      icon: Share2,
      color: 'from-pink-500 to-pink-600',
      accent: 'text-pink-600',
      bgAccent: 'bg-pink-50',
      borderAccent: 'border-pink-200',
      href: '/admin/settings/social-media',
      badge: 'Marketing',
    },
    {
      title: 'Policies & Legal',
      description: 'Privacy Policy, Terms of Service, Return/Cancellation and other legal page content.',
      icon: FileText,
      color: 'from-slate-500 to-slate-600',
      accent: 'text-slate-600',
      bgAccent: 'bg-slate-50',
      borderAccent: 'border-slate-200',
      href: '/admin/settings/policies',
      badge: 'Legal',
    },
    {
      title: 'Cookie Banner',
      description: 'GDPR cookie consent settings: banner text, button labels, and cookie policy link.',
      icon: Cookie,
      color: 'from-amber-500 to-amber-600',
      accent: 'text-amber-600',
      bgAccent: 'bg-amber-50',
      borderAccent: 'border-amber-200',
      href: '/admin/settings/cookie-banner',
      badge: 'Legal',
    },
  ];

  const quickSections = [
    {
      title: 'Site Configuration',
      description: 'Core site identity and public contact details.',
      icon: Globe,
      color: 'from-blue-500 to-blue-600',
      accent: 'text-blue-600',
      bgAccent: 'bg-blue-50',
      borderAccent: 'border-blue-200',
      href: '/admin/settings/business-settings',
    },
    {
      title: 'SMTP Configuration',
      description: 'Transactional email delivery for notifications and quotes.',
      icon: Mail,
      color: 'from-green-500 to-green-600',
      accent: 'text-green-600',
      bgAccent: 'bg-green-50',
      borderAccent: 'border-green-200',
      href: '#smtp',
    },
    {
      title: 'WhatsApp API',
      description: 'Cloud API for automated sales and support messages.',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      accent: 'text-purple-600',
      bgAccent: 'bg-purple-50',
      borderAccent: 'border-purple-200',
      href: '#whatsapp',
    },
    {
      title: 'Payment Gateway',
      description: 'Chapa / Telebirr / Stripe payment credentials.',
      icon: CreditCard,
      color: 'from-orange-500 to-orange-600',
      accent: 'text-orange-600',
      bgAccent: 'bg-orange-50',
      borderAccent: 'border-orange-200',
      href: '#payments',
    },
    {
      title: 'API Keys',
      description: 'Google Maps, Analytics, Facebook Pixel, and more.',
      icon: Key,
      color: 'from-red-500 to-red-600',
      accent: 'text-red-600',
      bgAccent: 'bg-red-50',
      borderAccent: 'border-red-200',
      href: '#apikeys',
    },
    {
      title: 'Notifications',
      description: 'Preferences for email, SMS and WhatsApp alerts.',
      icon: Bell,
      color: 'from-yellow-500 to-yellow-600',
      accent: 'text-yellow-600',
      bgAccent: 'bg-yellow-50',
      borderAccent: 'border-yellow-200',
      href: '#notifications',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="System Settings"
        description="Configure CMS content, integrations, and content that appears on the public website."
        actions={
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            All saved changes appear live on the website immediately
          </div>
        }
      />

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
          Website Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.title} href={section.href} className="group block h-full">
                <Card interactive className={`relative h-full ${section.borderAccent}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.color} shadow-lg flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${section.accent} ${section.bgAccent} px-2.5 py-1 rounded-full border ${section.borderAccent}`}>
                      {section.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-blue-700 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {section.description}
                  </p>
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${section.accent} group-hover:gap-2 transition-all`}>
                    Open Settings
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
        Integrations & Notifications
      </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {quickSections.map((section) => {
            const Icon = section.icon;
            const isAnchor = section.href.startsWith('#');
            const content = (
              <Card
                interactive={!isAnchor}
                className="group relative h-full"
                {...(isAnchor ? { id: section.href.substring(1) } : {})}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} shadow-md flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{section.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {section.description}
                </p>
                {!isAnchor ? (
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${section.accent} group-hover:gap-2 transition-all`}>
                    Configure
                    <ChevronRight className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 italic">
                    Configure below
                  </div>
                )}
              </Card>
            );
            return isAnchor ? (
              <div key={section.title}>{content}</div>
            ) : (
              <Link key={section.title} href={section.href} className="block h-full">
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card id="smtp">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">SMTP Configuration</h3>
              <p className="text-xs text-gray-500">Outbound email delivery</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                placeholder="smtp.example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  placeholder="587"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encryption
                </label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option>TLS (recommended)</option>
                  <option>SSL</option>
                  <option>None</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username
              </label>
              <input
                type="text"
                placeholder="your-email@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button>Test &amp; Save</Button>
            <Button variant="secondary">Send Test Email</Button>
          </div>
        </Card>

        <Card id="whatsapp">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">WhatsApp Business API</h3>
              <p className="text-xs text-gray-500">Automated notifications and customer support</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="password"
                placeholder="Enter your WhatsApp Cloud API access token"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                placeholder="123456789012345"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Account ID (WABA)
              </label>
              <input
                type="text"
                placeholder="987654321098765"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verified Business Phone
              </label>
              <input
                type="tel"
                placeholder="+251 911 000 000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-5">
            <Button className="w-full">Save Configuration</Button>
          </div>
        </Card>

        <Card id="payments">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Payment Gateway</h3>
              <p className="text-xs text-gray-500">Merchant processing for online orders</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Provider
              </label>
              <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option value="">Select Provider</option>
                <option>Chapa (Ethiopia)</option>
                <option>Telebirr</option>
                <option>Stripe (International)</option>
                <option>PayPal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Key
              </label>
              <input
                type="text"
                placeholder="pk_live_..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key
              </label>
              <input
                type="password"
                placeholder="sk_live_..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" defaultChecked />
                Enable Test (Sandbox) Mode
              </label>
            </div>
          </div>
          <div className="mt-5">
            <Button className="w-full">Save Gateway</Button>
          </div>
        </Card>

        <Card id="apikeys">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Third-Party API Keys</h3>
              <p className="text-xs text-gray-500">External services the site integrates with</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Maps API Key
              </label>
              <input
                type="password"
                placeholder="AIza..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Analytics 4 ID
              </label>
              <input
                type="text"
                placeholder="G-XXXXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook / Meta Pixel ID
              </label>
              <input
                type="text"
                placeholder="1234567890123456"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-5">
            <Button className="w-full">Save API Keys</Button>
          </div>
        </Card>
      </div>

      <Card id="notifications">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Notification Preferences</h3>
            <p className="text-xs text-gray-500">Control which alerts admins receive</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" className="rounded w-4 h-4 text-yellow-500 focus:ring-yellow-500" defaultChecked />
              <div>
                <div className="font-medium text-gray-900 text-sm">Email — new leads & quote requests</div>
                <div className="text-xs text-gray-500">Delivered to configured admin emails</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" className="rounded w-4 h-4 text-yellow-500 focus:ring-yellow-500" defaultChecked />
              <div>
                <div className="font-medium text-gray-900 text-sm">SMS — test drive booking alerts</div>
                <div className="text-xs text-gray-500">Immediate SMS to sales team</div>
              </div>
            </label>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" className="rounded w-4 h-4 text-yellow-500 focus:ring-yellow-500" />
              <div>
                <div className="font-medium text-gray-900 text-sm">WhatsApp — quotations & follow-ups</div>
                <div className="text-xs text-gray-500">Requires active WhatsApp API above</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input type="checkbox" className="rounded w-4 h-4 text-yellow-500 focus:ring-yellow-500" defaultChecked />
              <div>
                <div className="font-medium text-gray-900 text-sm">Daily email digest</div>
                <div className="text-xs text-gray-500">Roll-up of the day's leads and bookings (8am local)</div>
              </div>
            </label>
          </div>
        </div>
        <div className="mt-5">
          <Button>Save Preferences</Button>
        </div>
      </Card>
    </div>
  );
}
