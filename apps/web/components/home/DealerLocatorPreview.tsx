"use client";

import { useState } from "react";
import { Search, Wrench, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { MapEmbedFacade } from "@/components/MapEmbedFacade";
import { withBasePath } from "@/lib/basePath";
import Button from "@/components/ui/Button";

const HIGHLIGHT_CARDS = [
  {
    icon: Wrench,
    title: "After-Sale Service",
    description: "Certified technicians, genuine parts and scheduled maintenance across our network.",
    href: "/services",
    cta: "Book Service",
  },
  {
    icon: ShieldCheck,
    title: "24/7 Roadside Assistance",
    description: "Round-the-clock support wherever the road takes you, nationwide.",
    href: "/roadside",
    cta: "Learn More",
  },
  {
    icon: Sparkles,
    title: "Innovation & Technology",
    description: "Explore the safety, connectivity and electrification tech inside every Geely.",
    href: "/technology",
    cta: "Discover",
  },
];

export default function DealerLocatorPreview() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = withBasePath(`/dealers?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <section className="relative bg-black text-white overflow-hidden">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute right-[-80px] top-[-80px] w-72 h-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute right-[40px] bottom-[-120px] w-80 h-80 rounded-full border border-white/10" />

      <div className="relative page-container py-16 md:py-20">
        <div className="mb-12 max-w-lg">
          <div className="text-[12px] tracking-[0.2em] text-active-blue font-bold mb-4 uppercase">
            Nationwide Network
          </div>
          <h2 className="disp text-[30px] md:text-[40px] font-extrabold leading-tight mb-4">
            Find Your Nearest Dealer
          </h2>
          <p className="text-[#c3d2ea] text-[15px] leading-relaxed">
            Search by city or region to find showrooms, service centers, opening hours and contact
            details, and book a test drive or service directly.
          </p>
        </div>

        {/* Stacked-card bento: map + search on the left, service/innovation
            highlight cards on the right — matching geely.com.eg's location
            & services layout rather than a single copy/map split. */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="relative h-[280px] md:h-full min-h-[280px] rounded-2xl overflow-hidden ring-1 ring-white/10">
              <MapEmbedFacade
                title="Geely Ethiopia showroom map"
                className="absolute inset-0 w-full h-full border-0"
                src="https://www.google.com/maps?q=Sarbet,Addis%20Ababa,Ethiopia&output=embed"
              />
              <div className="pointer-events-none absolute inset-0 ring-inset ring-1 ring-white/10" />
              <div className="absolute top-[40%] left-[38%] w-3.5 h-3.5 bg-accent-red rounded-full border-2 border-white transform rotate-45 rounded-br-none" />
              <div className="absolute top-[60%] left-[58%] w-3.5 h-3.5 bg-accent-red rounded-full border-2 border-white transform rotate-45 rounded-br-none" />
              <div className="absolute top-[30%] left-[70%] w-3.5 h-3.5 bg-accent-red rounded-full border-2 border-white transform rotate-45 rounded-br-none" />
            </div>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your city, e.g. Addis Ababa"
                className="flex-1 px-4 py-3.5 text-[13px] text-navy rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-active-blue/60"
              />
              <Button type="submit" variant="solid" size="md">
                <Search size={16} />
                Find Dealer
              </Button>
            </form>

            <Link
              href="/dealers"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/80 hover:text-white border-b border-white/30 pb-0.5 transition-colors self-start"
            >
              View All Dealers & Service Centers
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-5">
            {HIGHLIGHT_CARDS.map(({ icon: Icon, title, description, href, cta }) => (
              <Link
                key={title}
                href={href}
                className="group flex-1 bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur rounded-2xl p-5 ring-1 ring-white/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-active-blue/15 text-active-blue flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white mb-1.5">{title}</h3>
                    <p className="text-[12.5px] text-[#c3d2ea] leading-relaxed mb-2.5">
                      {description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-active-blue group-hover:translate-x-0.5 transition-transform">
                      {cta}
                      <span aria-hidden>&rarr;</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
