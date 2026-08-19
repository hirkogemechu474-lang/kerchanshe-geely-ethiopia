import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Code2,
  Database,
  ExternalLink,
  Gauge,
  Linkedin,
  LockKeyhole,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';

export const metadata: Metadata = {
  title: 'Website Developer | Geely Ethiopia',
  description: 'Meet the developer behind the Geely Ethiopia digital experience.',
  alternates: { canonical: '/developer' },
};

const LINKEDIN_URL = 'https://www.linkedin.com/in/hirko-gemechu80/';

const platformHighlights = [
  { icon: Smartphone, title: 'Responsive by design', text: 'A clear experience across phones, tablets, and desktop screens.' },
  { icon: Database, title: 'Connected operations', text: 'Public journeys connect with vehicles, dealers, leads, financing, and admin workflows.' },
  { icon: Gauge, title: 'Built for action', text: 'Customers can move from discovery to configuration, enquiry, booking, and support.' },
];

const principles = [
  { icon: Sparkles, title: 'Simple', text: 'Important actions stay easy to find and understand.' },
  { icon: LockKeyhole, title: 'Trustworthy', text: 'Forms, consent, validation, and clear status messages support customer confidence.' },
  { icon: Code2, title: 'Maintainable', text: 'Reusable components and structured content make the platform easier to extend.' },
];

const developerSkills = [
  { name: 'Next.js & React', detail: 'Modern page architecture, reusable components, and customer journeys.' },
  { name: 'TypeScript', detail: 'Typed interfaces and safer application development across the platform.' },
  { name: 'Prisma & PostgreSQL', detail: 'Structured data models connecting vehicles, leads, dealers, and operations.' },
  { name: 'API Integration', detail: 'Connected public and admin APIs for content, forms, financing, and CRM workflows.' },
  { name: 'Responsive UI', detail: 'Mobile-first interfaces designed for real customer devices and screen sizes.' },
  { name: 'SEO & Performance', detail: 'Metadata, sitemap, structured content, and performance-conscious page design.' },
];

export default function DeveloperPage() {
  return (
    <MainLayout showFooter={false}>
      <main>
        <section className="relative overflow-hidden bg-navy text-white">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold tracking-[0.2em] text-gold">DIGITAL EXPERIENCE</p>
              <h1 className="disp text-4xl font-bold leading-tight sm:text-6xl">Built with purpose. Designed for progress.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                The Geely Ethiopia digital experience is crafted to make discovering vehicles,
                booking support, and connecting with the team simple for every customer.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-ice py-16 lg:py-24">
          <div className="mx-auto grid max-w-[1100px] gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
            <div>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Code2 size={28} />
              </div>
              <p className="text-xs font-bold tracking-[0.2em] text-blue-600">WEBSITE DEVELOPER</p>
              <h2 className="disp mt-3 text-4xl font-bold text-navy">Hirko Gemechu</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-steel">
                Meet the developer responsible for bringing this digital platform to life for
                Geely Ethiopia and its customers.
              </p>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#0a66c2] px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#084d91]"
              >
                <Linkedin size={19} />
                View LinkedIn profile
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-navy/5">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Sparkles size={24} />
              </div>
              <h3 className="text-2xl font-bold text-navy">A connected customer journey</h3>
              <p className="mt-4 leading-7 text-steel">
                From model discovery and configuration to dealer contact, test drives, service,
                and financing, the platform brings the Geely Ethiopia journey together in one place.
              </p>
              <div className="mt-7 space-y-4 border-t border-slate-100 pt-6">
                {['Modern vehicle discovery', 'Clear customer actions', 'Mobile-ready experience'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-semibold text-navy">
                    <span className="h-2 w-2 rounded-full bg-gold" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
            <div>
              <p className="text-sm font-semibold text-blue-600">Explore the platform</p>
              <h2 className="mt-2 text-2xl font-bold text-navy">Your Geely journey starts here.</h2>
            </div>
            <Link href="/configure" className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 font-semibold text-white transition hover:bg-blue-700">
              Explore models <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="bg-ice py-16 lg:py-20">
          <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.2em] text-blue-600">THE WORK</p>
              <h2 className="disp mt-3 text-3xl font-bold text-navy sm:text-4xl">One platform for the complete journey</h2>
              <p className="mt-4 leading-7 text-steel">
                The website is designed as more than a brochure: it gives customers useful tools
                and gives the business a connected foundation for managing digital enquiries.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {platformHighlights.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-navy">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-steel">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto grid max-w-[1100px] gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-blue-600">DEVELOPMENT APPROACH</p>
              <h2 className="disp mt-3 text-3xl font-bold text-navy sm:text-4xl">Technology should feel human.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {principles.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-ice p-5">
                  <Icon className="text-gold" size={22} />
                  <h3 className="mt-4 font-bold text-navy">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-steel">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ice py-16 lg:py-20">
          <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.2em] text-blue-600">SKILLS USED IN THIS PROJECT</p>
              <h2 className="disp mt-3 text-3xl font-bold text-navy sm:text-4xl">Technology with a practical purpose.</h2>
              <p className="mt-4 leading-7 text-steel">
                The platform combines product development, data integration, design systems, and
                digital operations to support the full Geely Ethiopia experience.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {developerSkills.map((skill) => (
                <article key={skill.name} className="rounded-2xl border border-blue-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/5">
                  <div className="mb-4 h-1.5 w-12 rounded-full bg-gradient-to-r from-blue-600 to-gold" />
                  <h3 className="text-lg font-bold text-navy">{skill.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-steel">{skill.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-navy py-16 text-white">
          <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-7 px-6 sm:flex-row sm:items-center lg:px-10">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-gold">CONNECT</p>
              <h2 className="mt-3 text-3xl font-bold">Want to learn more about the work?</h2>
              <p className="mt-3 max-w-xl text-blue-100">Visit Hirko Gemechu&apos;s professional profile on LinkedIn.</p>
            </div>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-3 rounded-xl bg-white px-5 py-3 font-semibold text-navy transition hover:bg-blue-50">
              <Linkedin size={19} />
              Connect on LinkedIn
              <ExternalLink size={16} />
            </a>
          </div>
        </section>
      </main>
    </MainLayout>
  );
}
