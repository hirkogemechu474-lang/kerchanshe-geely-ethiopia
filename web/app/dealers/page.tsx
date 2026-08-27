"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { getDealers, type Dealer } from "@/lib/api";
import { MapPin, Phone, Mail, Clock, Search, Navigation } from "lucide-react";
import Link from "next/link";
import { MapEmbedFacade } from "@/components/MapEmbedFacade";
import { withBasePath } from "@/lib/publicPath";

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  // Fetch dealers from CMS
  useEffect(() => {
    async function fetchDealers() {
      try {
        const data = await getDealers();
        setDealers(data);
      } catch (error) {
        console.error('Failed to fetch dealers:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDealers();
  }, []);

  // Extract unique cities from dealers
  const cities = Array.from(new Set(dealers.map(d => d.city))).sort();

  // Filter dealers
  const filteredDealers = dealers.filter((dealer) => {
    const cityMatch = selectedCity === "all" || dealer.city === selectedCity;
    const typeMatch =
      selectedType === "all" ||
      dealer.type === selectedType ||
      dealer.type === "both";
    
    const addressString = typeof dealer.address === 'string' 
      ? dealer.address 
      : `${dealer.address?.street || ''} ${dealer.address?.area || ''} ${dealer.address?.city || ''}`;
    
    const searchMatch =
      searchQuery === "" ||
      dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addressString.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.city.toLowerCase().includes(searchQuery.toLowerCase());

    return cityMatch && typeMatch && searchMatch;
  });

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            FIND US NATIONWIDE
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            Dealers & Service Centers
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Visit our showrooms to explore Geely vehicles, book a test drive, or service your vehicle at one of our certified service centers across Ethiopia.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <section className="py-8 bg-ice dark:bg-midnight border-b border-line dark:border-midnight-line transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-geely-blue border-t-transparent"></div>
              <p className="mt-4 text-steel dark:text-steel-light">Loading dealers...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-steel dark:text-steel-light" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, address, or city..."
                  className="w-full pl-12 pr-4 py-3 border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg focus:outline-none focus:border-geely-blue"
                />
              </div>
            </div>

            {/* City Filter */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg focus:outline-none focus:border-geely-blue"
              >
                <option value="all">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-line dark:border-midnight-line dark:bg-midnight dark:text-ice rounded-lg focus:outline-none focus:border-geely-blue"
              >
                <option value="all">All Types</option>
                <option value="showroom">Showrooms Only</option>
                <option value="service">Service Centers Only</option>
                <option value="both">Full Service</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-steel dark:text-steel-light">
            Showing {filteredDealers.length} of {dealers.length} locations
          </div>
            </>
          )}
        </div>
      </section>

      {/* Map & Dealers Grid */}
      <section className="py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dealers List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredDealers.length > 0 ? (
                filteredDealers.map((dealer) => (
                  <div
                    key={dealer.id}
                    className={`bg-white dark:bg-midnight-surface border-2 rounded-lg overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                      selectedDealer?.id === dealer.id
                        ? "border-geely-blue"
                        : "border-line dark:border-midnight-line"
                    }`}
                    onClick={() => setSelectedDealer(dealer)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      {/* Image */}
                      <div className="h-48 md:h-auto bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] dark:from-midnight dark:to-midnight-surface flex items-center justify-center text-xs text-steel dark:text-steel-light text-center p-4 overflow-hidden">
                        {dealer.gallery?.[0] ? <img src={withBasePath(dealer.gallery[0])} alt={`${dealer.name} showroom`} className="w-full h-full object-cover" /> : <span>{dealer.name}<br />Showroom image managed from the admin panel</span>}
                      </div>

                      {/* Info */}
                      <div className="md:col-span-2 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-navy dark:text-ice mb-1">
                              {dealer.name}
                            </h3>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                dealer.type === "both"
                                  ? "bg-green-100 text-green-700"
                                  : dealer.type === "showroom"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {dealer.type === "both"
                                ? "Showroom & Service"
                                : dealer.type === "showroom"
                                ? "Showroom"
                                : "Service Center"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin size={16} className="text-geely-blue flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-navy dark:text-ice">
                                {typeof dealer.address === 'string'
                                  ? dealer.address
                                  : `${dealer.address?.street || ''}, ${dealer.address?.area || ''}`}
                              </div>
                              <div className="text-steel dark:text-steel-light">
                                {typeof dealer.address === 'string' 
                                  ? dealer.city 
                                  : `${dealer.address?.city || dealer.city || ''}, ${dealer.address?.region || ''}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={16} className="text-geely-blue flex-shrink-0" />
                            <a href={`tel:${dealer.phone}`} className="text-navy dark:text-ice hover:text-geely-blue">
                              {dealer.phone}
                            </a>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={16} className="text-geely-blue flex-shrink-0" />
                            <a href={`mailto:${dealer.email}`} className="text-navy dark:text-ice hover:text-geely-blue">
                              {dealer.email}
                            </a>
                          </div>

                          <div className="flex items-start gap-2 text-sm">
                            <Clock size={16} className="text-geely-blue flex-shrink-0 mt-0.5" />
                            <div className="text-steel dark:text-steel-light">
                              <div>Mon-Fri: {dealer.hours?.weekday || 'N/A'}</div>
                              <div>Sat: {dealer.hours?.saturday || 'N/A'}</div>
                              <div>Sun: {dealer.hours?.sunday || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Services */}
                        <div className="mb-4">
                          <div className="text-xs font-bold text-navy dark:text-ice mb-2">Services:</div>
                          <div className="flex flex-wrap gap-2">
                            {dealer.services?.slice(0, 3).map((service, index) => (
                              <span
                                key={index}
                                className="text-xs bg-ice dark:bg-midnight text-navy dark:text-ice px-2 py-1 rounded"
                              >
                                {service}
                              </span>
                            ))}
                            {dealer.services && dealer.services.length > 3 && (
                              <span className="text-xs text-steel dark:text-steel-light px-2 py-1">
                                +{dealer.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link
                            href={`/dealers/${dealer.id}`}
                            aria-label={`View details for ${dealer.name}`}
                            className="flex-1 text-center bg-geely-blue text-white text-sm font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-all"
                          >
                            View Details
                          </Link>
                          <a
                            href={`https://www.google.com/maps?q=${dealer.coordinates.latitude},${dealer.coordinates.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-ice border border-line dark:border-midnight-line py-2 px-4 rounded hover:bg-ice dark:hover:bg-midnight transition-all"
                          >
                            <Navigation size={16} />
                            Directions
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-lg p-12 text-center">
                  <MapPin size={48} className="text-steel dark:text-steel-light mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-navy dark:text-ice mb-2">No locations found</h3>
                  <p className="text-steel dark:text-steel-light">
                    Try adjusting your search filters to find what you're looking for.
                  </p>
                </div>
              )}
            </div>

            {/* Live map */}
            <div className="lg:sticky lg:top-24 h-[500px]">
              <div className="relative h-full bg-ice dark:bg-midnight border border-line dark:border-midnight-line rounded-lg overflow-hidden flex flex-col items-center justify-center text-steel dark:text-steel-light text-sm p-6">
                <MapEmbedFacade
                  title="Geely Ethiopia dealer map"
                  className="absolute inset-0 w-full h-full border-0"
                  src={`https://www.google.com/maps?q=${selectedDealer ? `${selectedDealer.coordinates.latitude},${selectedDealer.coordinates.longitude}` : "Addis Ababa,Ethiopia"}&output=embed`}
                />
                <div className="absolute inset-x-3 bottom-3 z-10 bg-white/95 rounded-lg p-3 shadow-lg">
                  <p className="text-xs font-semibold text-navy">Select a dealer to center the map</p>
                </div>
                <div className="relative z-10 hidden">
                <MapPin size={48} className="mb-4" />
                <p className="text-center mb-4">
                  Interactive Map
                  <br />
                  (Google Maps Integration)
                </p>
                {selectedDealer && (
                  <div className="bg-white p-4 rounded-lg shadow-lg text-left w-full">
                    <div className="font-bold text-navy mb-2">{selectedDealer.name}</div>
                    <div className="text-xs text-steel mb-3">{typeof selectedDealer.address === 'string' ? selectedDealer.address : `${selectedDealer.address.street}, ${selectedDealer.address.area}, ${selectedDealer.address.city}`}</div>
                    <a
href={`https://www.google.com/maps?q=${selectedDealer.coordinates.latitude},${selectedDealer.coordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-geely-blue text-white text-xs font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-all"
                    >
                      Get Directions
                    </a>
                  </div>
                )}
                {/* Pins */}
                {filteredDealers.map((dealer, index) => (
                  <div
                    key={dealer.id}
                    className="absolute w-4 h-4 bg-geely-blue rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform"
                    style={{
                      top: `${20 + index * 15}%`,
                      left: `${30 + (index % 3) * 20}%`,
                    }}
                    onClick={() => setSelectedDealer(dealer)}
                    title={dealer.name}
                  ></div>
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <h3 className="disp text-3xl font-bold mb-4">
            Ready to Visit a Showroom?
          </h3>
          <p className="text-[#b9cbe4] text-base mb-8 max-w-2xl mx-auto">
            Book a test drive or schedule a service appointment at your nearest Geely location.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/test-drive"
              className="bg-gold text-[#2c2308] font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
            >
              Book a Test Drive
            </Link>
            <Link
              href="/service"
              className="border border-white border-opacity-50 text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
            >
              Schedule Service
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
