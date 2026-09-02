import { getBreadcrumbSchema, getOrganizationSchema, getWebsiteSchema } from '@/lib/schema';
import { ServicesPageClient } from './ServicesPageClient';

export default function ServicesPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://geelyethiopia.com' },
    { name: 'Services', url: 'https://geelyethiopia.com/services' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            getOrganizationSchema(),
            getWebsiteSchema(),
            breadcrumbSchema,
          ]),
        }}
      />
      <ServicesPageClient />
    </>
  );
}
