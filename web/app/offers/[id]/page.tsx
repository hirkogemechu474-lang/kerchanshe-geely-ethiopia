"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ArrowLeft, Percent } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

interface Promotion {
  id: string;
  title: string;
  description: string;
  bannerImage: string | null;
  ctaButtonText: string | null;
  ctaButtonLink: string | null;
  endDate: string;
}

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [offer, setOffer] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/promotions")
      .then((response) => response.json())
      .then((data) => setOffer((data.promotions || []).find((promotion: Promotion) => promotion.id === id) || null))
      .catch(() => setOffer(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <MainLayout>
      <section className="bg-navy text-white py-12"><div className="max-w-[900px] mx-auto px-6 lg:px-10"><Link href="/offers" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-8"><ArrowLeft size={17} /> All offers</Link><p className="text-gold text-xs font-bold tracking-[0.16em]">SPECIAL OFFER</p><h1 className="disp text-4xl lg:text-5xl font-bold mt-3">{loading ? "Loading offer..." : offer?.title || "Offer not found"}</h1></div></section>
      <section className="py-12"><div className="max-w-[900px] mx-auto px-6 lg:px-10">
        {offer ? <article className="bg-white border border-line rounded-xl overflow-hidden shadow-sm">
          {offer.bannerImage && <img src={offer.bannerImage} alt={offer.title} className="w-full max-h-[420px] object-cover" />}
          <div className="p-6 lg:p-10"><div className="flex items-center gap-2 text-geely-blue text-sm font-bold mb-5"><Percent size={18} /> Current promotion</div><p className="text-steel text-lg leading-relaxed mb-6">{offer.description}</p><div className="flex items-center gap-2 text-sm text-steel mb-8"><Calendar size={17} /> Valid until {new Date(offer.endDate).toLocaleDateString()}</div><Link href={offer.ctaButtonLink || "/quote"} className="inline-flex bg-geely-blue text-white px-6 py-3 rounded-lg font-bold">{offer.ctaButtonText || "Request a quote"}</Link></div>
        </article> : <div className="text-center py-16"><p className="text-steel mb-5">This offer is no longer available.</p><Link href="/offers" className="text-geely-blue font-semibold">View current offers</Link></div>}
      </div></section>
    </MainLayout>
  );
}
