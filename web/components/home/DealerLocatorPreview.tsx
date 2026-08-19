"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

export default function DealerLocatorPreview() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/dealers?search=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <section className="relative bg-[#0d1b3a] text-white overflow-hidden">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute right-[-80px] top-[-80px] w-72 h-72 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute right-[40px] bottom-[-120px] w-80 h-80 rounded-full border border-white/10" />

      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Copy */}
          <div>
            <div className="text-[12px] tracking-[0.2em] text-gold font-bold mb-4 uppercase">
              Nationwide Network
            </div>
            <h2 className="disp text-[30px] md:text-[40px] font-extrabold leading-tight mb-4">
              Find Your Nearest Dealer
            </h2>
            <p className="text-[#c3d2ea] text-[15px] leading-relaxed mb-8 max-w-lg">
              Search by city or region to find showrooms, service centers, opening hours and contact
              details — and book a test drive or service directly.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your city, e.g. Addis Ababa"
                className="flex-1 px-4 py-3.5 text-[13px] text-navy rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gold/60"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-gold text-[#2c2308] px-6 py-3.5 text-[13px] font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                <Search size={16} />
                Find Dealer
              </button>
            </form>

            <Link
              href="/dealers"
              className="inline-flex items-center gap-1.5 mt-6 text-[13px] font-semibold text-white/80 hover:text-white border-b border-white/30 pb-0.5 transition-colors"
            >
              View All Dealers & Service Centers
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>

          {/* Map */}
          <div className="relative h-[260px] md:h-[300px] rounded-2xl overflow-hidden ring-1 ring-white/10">
            <iframe
              title="Geely Ethiopia showroom map"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              src="https://www.google.com/maps?q=Sarbet,Addis%20Ababa,Ethiopia&output=embed"
            />
            <div className="pointer-events-none absolute inset-0 ring-inset ring-1 ring-white/10" />
            <div className="absolute top-[40%] left-[38%] w-3.5 h-3.5 bg-gold rounded-full border-2 border-white transform rotate-45 rounded-br-none" />
            <div className="absolute top-[60%] left-[58%] w-3.5 h-3.5 bg-gold rounded-full border-2 border-white transform rotate-45 rounded-br-none" />
            <div className="absolute top-[30%] left-[70%] w-3.5 h-3.5 bg-gold rounded-full border-2 border-white transform rotate-45 rounded-br-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
