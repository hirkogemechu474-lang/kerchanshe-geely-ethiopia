"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export default function DealerLocatorPreview() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to dealers page with search query
    window.location.href = `/dealers?search=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <section className="py-[70px]">
      <div className="max-w-[1280px] mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Dealer map preview */}
          <div className="relative h-[300px] bg-ice border border-line rounded-lg overflow-hidden">
            <iframe
              title="Geely Ethiopia showroom map"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              src="https://www.google.com/maps?q=Sarbet,Addis%20Ababa,Ethiopia&output=embed"
            />
            {/* Dealer pins */}
            <div className="absolute top-[40%] left-[38%] w-3.5 h-3.5 bg-geely-blue rounded-full border-2 border-white transform rotate-45 rounded-br-none"></div>
            <div className="absolute top-[60%] left-[58%] w-3.5 h-3.5 bg-geely-blue rounded-full border-2 border-white transform rotate-45 rounded-br-none"></div>
            <div className="absolute top-[30%] left-[70%] w-3.5 h-3.5 bg-geely-blue rounded-full border-2 border-white transform rotate-45 rounded-br-none"></div>
          </div>

          {/* Content */}
          <div>
            <span className="inline-block bg-gold bg-opacity-15 text-gold text-[11px] font-bold px-3 py-1 rounded-full mb-4 tracking-wide">
              6 SHOWROOMS & SERVICE CENTERS
            </span>
            <h2 className="disp text-[28px] text-navy font-bold mb-4">
              Find your nearest showroom
            </h2>
            <p className="text-steel text-sm leading-relaxed mb-5">
              Search by city or region to find showroom hours, contact details,
              and book a service appointment directly.
            </p>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your city, e.g. Addis Ababa"
                className="flex-1 border border-line px-4 py-3 text-[13px] rounded focus:outline-none focus:border-geely-blue"
              />
              <button
                type="submit"
                className="bg-geely-blue text-white px-6 text-[13px] font-bold rounded hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                <Search size={16} />
                Search
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
