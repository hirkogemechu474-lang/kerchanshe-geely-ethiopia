import Link from "next/link";
import { MainLayout } from "@/components/MainLayout";
import FAQSection from "@/components/home/FAQSection";
import { serverApiClient } from "@/lib/serverApiClient";
import { getFAQSchema } from "@/lib/schema";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Geely Ethiopia",
  description:
    "Find answers to common questions about Geely vehicles in Ethiopia: warranty coverage, financing, test drives, trade-ins, servicing, electric vehicle charging, and more.",
  keywords:
    "Geely Ethiopia FAQ, Geely questions, Geely warranty, Geely financing, Geely service, electric vehicle charging Ethiopia, Geely trade-in",
  alternates: {
    canonical: "https://geelyethiopia.com/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | Geely Ethiopia",
    description:
      "Find answers to common questions about Geely vehicles in Ethiopia: warranty, financing, test drives, servicing, and more.",
    url: "https://geelyethiopia.com/faq",
    siteName: "Geely Ethiopia",
    locale: "en_ET",
    type: "website",
  },
};

export const revalidate = 3600;

export default async function FAQPage() {
  let faqSchema: object | null = null;

  try {
    const client = await serverApiClient();
    const { data: faqs } = await client.get("/public/faq");

    if (Array.isArray(faqs) && faqs.length > 0) {
      faqSchema = getFAQSchema(
        faqs.map((faq: any) => ({
          question: faq.question,
          answer: faq.answer.replace(/<[^>]*>/g, ""),
        }))
      );
    }
  } catch (error) {
    console.error("Error fetching FAQs for schema:", error);
  }

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: faqSchema ? JSON.stringify(faqSchema) : "",
        }}
      />

      {/* Page Header */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            HELP CENTER
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Got questions about Geely vehicles, ownership, or our services in
            Ethiopia? Browse the answers below or contact our team for further
            assistance.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <FAQSection />

      {/* Still Have Questions CTA */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 py-16">
        <div className="max-w-[1280px] mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Still Have Questions?
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Our team is ready to help you with anything from choosing the right
            model to arranging financing and after-sales service.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/test-drive"
              className="inline-flex items-center justify-center bg-gold text-navy dark:text-ice px-8 py-4 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
            >
              Book a Test Drive
            </a>
            <Link
              href="/dealers"
              className="inline-flex items-center justify-center bg-white dark:bg-midnight-surface/10 text-white border border-white/30 px-8 py-4 rounded-lg font-bold hover:bg-white/20 transition-colors"
            >
              Find a Dealer
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
