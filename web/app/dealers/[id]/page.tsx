"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { getDealerById, getDealers, type Dealer } from "@/lib/api";
import { MapPin, Phone, Mail, Clock, Navigation, Calendar, Wrench, Globe, Share2 } from "lucide-react";

export default function DealerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [otherDealers, setOtherDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getDealerById(id);
        if (!data) {
          setNotFound(true);
          return;
        }
        setDealer(data);
        try {
          const all = await getDealers();
          setOtherDealers(all.filter((d) => d.id !== data.id).slice(0, 3));
        } catch {
          setOtherDealers([]);
        }
      } catch (error) {
        console.error("Failed to fetch dealer:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-geely-blue border-t-transparent"></div>
            <p className="mt-4 text-steel">Loading dealer...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (notFound || !dealer) {
    return (
      <MainLayout>
        <div className="bg-navy text-white py-16">
          <div className="max-w-[1280px] mx-auto px-10">
            <Link href="/dealers" className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3 inline-block">
              ← Back to Dealers
            </Link>
            <h1 className="disp text-4xl font-bold">Dealer Not Found</h1>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-10 py-16 text-center">
          <MapPin size={56} className="text-steel mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-2">Location Unavailable</h2>
          <p className="text-steel max-w-xl mx-auto mb-8">
            We could not find this dealer location. It may have been removed or is no longer active.
            Please browse our other locations.
          </p>
          <Link
            href="/dealers"
            className="inline-block bg-geely-blue text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
          >
            View All Dealers
          </Link>
        </div>
      </MainLayout>
    );
  }

  const displayName = dealer.name;
  const typeLabel =
    dealer.type === "both"
      ? "Showroom & Service Center"
      : dealer.type === "showroom"
      ? "Showroom"
      : "Service Center";
  const addressText = dealer.address?.street || "";
  const area = dealer.address?.area || "";
  const city = dealer.address?.city || dealer.city || "";
  const region = dealer.address?.region || dealer.region || "";
  const country = dealer.country || dealer.address?.country || "Ethiopia";
  const hours = dealer.hours || dealer.workingHours;
  const weekdayHours = (dealer.hours as any)?.weekday || (dealer.workingHours as any)?.weekdays || "N/A";
  const whatsappNumber = dealer.contact?.whatsapp || dealer.phone || "";
  const mapHref = dealer.coordinates
    ? `https://www.google.com/maps?q=${dealer.coordinates.latitude},${dealer.coordinates.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${displayName} ${city} ${region}`)}`;
  const mapEmbedHref = `https://www.google.com/maps?q=${dealer.coordinates ? `${dealer.coordinates.latitude},${dealer.coordinates.longitude}` : encodeURIComponent(`${displayName} ${city}`)}&output=embed`;

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-navy text-white py-12">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="flex items-center gap-2 text-xs tracking-wider mb-3 opacity-80">
            <Link href="/dealers" className="hover:opacity-100">
              Dealers & Service Centers
            </Link>
            <span>›</span>
            <span>{displayName}</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {dealer.logo && (
              <img
                src={dealer.logo}
                alt={`${displayName} logo`}
                className="w-16 h-16 rounded-lg object-contain bg-white p-2"
              />
            )}
            <div>
              <h1 className="disp text-4xl font-bold mb-3">{displayName}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-4 py-2 rounded-full text-xs font-bold ${
                    dealer.type === "both"
                      ? "bg-green-500"
                      : dealer.type === "showroom"
                      ? "bg-blue-500"
                      : "bg-orange-500"
                  }`}
                >
                  {typeLabel}
                </span>
                <span className="text-[#b9cbe4] text-sm">
                  {city}, {region}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Gallery */}
              {(dealer.gallery && dealer.gallery.length > 0) || dealer.logo ? (
                <div className="rounded-lg overflow-hidden border border-line">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(dealer.gallery && dealer.gallery.length > 0 ? dealer.gallery : [dealer.logo]).map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${displayName} photo ${index + 1}`}
                        className={`object-cover w-full ${index === 0 && dealer.gallery && dealer.gallery.length > 1 ? "md:row-span-2 h-[400px]" : "h-[200px]"}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[400px] bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] rounded-lg flex items-center justify-center text-steel text-center p-6">
                  {displayName}
                  <br />
                  Showroom Exterior & Interior Photos
                </div>
              )}

              {/* Description */}
              {dealer.description && (
                <div className="bg-white border border-line rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-navy mb-4">About This Location</h2>
                  <p className="text-steel leading-relaxed whitespace-pre-line">{dealer.description}</p>
                </div>
              )}

              {/* Services */}
              <div className="bg-white border border-line rounded-lg p-6">
                <h2 className="text-2xl font-bold text-navy mb-4">Our Services</h2>
                {dealer.services && dealer.services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dealer.services.map((service, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-ice rounded-lg">
                        <div className="w-10 h-10 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Wrench size={20} className="text-geely-blue" />
                        </div>
                        <span className="text-sm font-semibold text-navy">{service}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-steel">Service details coming soon.</p>
                )}
              </div>

              {/* Operating Hours */}
              <div className="bg-white border border-line rounded-lg p-6">
                <h2 className="text-2xl font-bold text-navy mb-4">Operating Hours</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-line">
                    <span className="font-semibold text-navy">Monday - Friday</span>
                    <span className="text-steel">{weekdayHours}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-line">
                    <span className="font-semibold text-navy">Saturday</span>
                    <span className="text-steel">{(hours as any)?.saturday || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-navy">Sunday</span>
                    <span className="text-steel">{(hours as any)?.sunday || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="bg-white border border-line rounded-lg p-6">
                <h2 className="text-2xl font-bold text-navy mb-4">Location</h2>
                <div className="h-[300px] bg-[repeating-linear-gradient(45deg,#eef3fa,#eef3fa_10px,#e4ecf7_10px,#e4ecf7_20px)] rounded-lg overflow-hidden relative">
                  <iframe
                    src={mapEmbedHref}
                    title={`${displayName} location map`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-geely-blue text-white font-bold text-sm py-3 px-6 rounded hover:bg-opacity-90 transition-all min-w-[160px]"
                  >
                    <Navigation size={18} />
                    Get Directions
                  </a>
                  <button
                    onClick={() => {
                      const fullAddress = [addressText, area, city, region, country].filter(Boolean).join(", ");
                      navigator.clipboard.writeText(fullAddress);
                      alert("Address copied to clipboard!");
                    }}
                    className="px-6 py-3 border border-line rounded text-sm font-semibold text-navy hover:bg-ice transition-all"
                  >
                    Copy Address
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-white border border-line rounded-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold text-navy mb-4">Contact Information</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-geely-blue flex-shrink-0 mt-1" />
                    <div className="text-sm">
                      <div className="font-semibold text-navy mb-1">Address</div>
                      <div className="text-steel">
                        {[addressText, area].filter(Boolean).join(", ")}
                        {([addressText, area].filter(Boolean).length > 0 ? ", " : "")}
                        {[city, region, country].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone size={20} className="text-geely-blue flex-shrink-0 mt-1" />
                    <div className="text-sm">
                      <div className="font-semibold text-navy mb-1">Phone</div>
                      <a href={`tel:${dealer.phone}`} className="text-geely-blue hover:underline">
                        {dealer.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-geely-blue flex-shrink-0 mt-1" />
                    <div className="text-sm">
                      <div className="font-semibold text-navy mb-1">Email</div>
                      <a href={`mailto:${dealer.email}`} className="text-geely-blue hover:underline break-all">
                        {dealer.email}
                      </a>
                    </div>
                  </div>

                  {dealer.website && (
                    <div className="flex items-start gap-3">
                      <Globe size={20} className="text-geely-blue flex-shrink-0 mt-1" />
                      <div className="text-sm">
                        <div className="font-semibold text-navy mb-1">Website</div>
                        <a
                          href={dealer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-geely-blue hover:underline break-all"
                        >
                          {dealer.website}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-geely-blue flex-shrink-0 mt-1" />
                      <div className="text-sm">
                      <div className="font-semibold text-navy mb-1">Hours Today</div>
                      <div className="text-steel">{weekdayHours}</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3 pt-6 border-t border-line">
                  {(dealer.type === "showroom" || dealer.type === "both") && (
                    <Link
                      href="/test-drive"
                      className="flex items-center justify-center gap-2 w-full bg-gold text-[#2c2308] font-bold text-sm py-3 px-6 rounded hover:bg-opacity-90 transition-all"
                    >
                      <Calendar size={18} />
                      Book Test Drive
                    </Link>
                  )}

                  {(dealer.type === "service" || dealer.type === "both") && (
                    <Link
                      href="/service"
                      className="flex items-center justify-center gap-2 w-full bg-geely-blue text-white font-bold text-sm py-3 px-6 rounded hover:bg-opacity-90 transition-all"
                    >
                      <Wrench size={18} />
                      Book Service
                    </Link>
                  )}

                  <a
                    href={`tel:${dealer.phone}`}
                    className="flex items-center justify-center gap-2 w-full border border-line text-navy font-semibold text-sm py-3 px-6 rounded hover:bg-ice transition-all"
                  >
                    <Phone size={18} />
                    Call Now
                  </a>

                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full border border-line text-navy font-semibold text-sm py-3 px-6 rounded hover:bg-ice transition-all"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Locations */}
      {otherDealers.length > 0 && (
        <section className="py-12 bg-ice">
          <div className="max-w-[1280px] mx-auto px-10">
            <h2 className="disp text-3xl text-navy font-bold mb-8">Other Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherDealers.map((otherDealer) => (
                <Link
                  key={otherDealer.id}
                  href={`/dealers/${otherDealer.id}`}
                  className="bg-white border border-line rounded-lg p-6 hover:border-geely-blue hover:shadow-lg transition-all"
                >
                  <h3 className="font-bold text-navy mb-2">{otherDealer.name}</h3>
                  <p className="text-sm text-steel mb-3">
                    {otherDealer.address?.street || otherDealer.address?.area || ""}, {otherDealer.city}
                  </p>
                  <div className="text-xs text-geely-blue font-semibold">
                    View Details →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
