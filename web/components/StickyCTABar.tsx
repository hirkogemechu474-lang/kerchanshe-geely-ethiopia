'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, Calendar, FileText, Download, ChevronUp } from 'lucide-react';

interface StickyCTABarProps {
  vehicleSlug: string;
  vehicleName: string;
  price: string;
  brochureUrl?: string;
  /** Showroom QR walk-in visit id — appended to the quote/test-drive links so
   * the visitor's already-captured name/phone/email carries through. */
  visitId?: string;
  /** Pixel offset from top before the bar becomes visible */
  scrollThreshold?: number;
}

export function StickyCTABar({
  vehicleSlug,
  vehicleName,
  price,
  brochureUrl,
  visitId,
  scrollThreshold = 400,
}: StickyCTABarProps) {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const visitParam = visitId ? `&visitId=${encodeURIComponent(visitId)}` : '';

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  if (!visible) return null;

  return (
    <>
      {/* ── Mobile sticky bar (bottom) ─────────────────────────────────── */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50 lg:hidden
          bg-white border-t border-line shadow-[0_-4px_24px_rgba(11,37,69,0.12)]
          transition-transform duration-300
          ${minimized ? 'translate-y-full' : 'translate-y-0'}
        `}
      >
        {/* Minimise handle */}
        <button
          onClick={() => setMinimized(!minimized)}
          className="absolute -top-6 right-4 bg-white border border-line rounded-t-lg px-3 py-1 text-xs text-steel flex items-center gap-1"
          aria-label="Toggle CTA bar"
        >
          <ChevronUp size={12} className={`transition-transform ${minimized ? 'rotate-180' : ''}`} />
          {minimized ? 'Show' : 'Hide'}
        </button>

        <div className="px-4 py-3">
          {/* Vehicle name + price strip */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-steel">Geely {vehicleName}</div>
              <div className="text-sm font-bold text-navy">{price}</div>
            </div>
            <a
              href="tel:+251110000000"
              className="flex items-center gap-1.5 text-xs text-geely-blue font-semibold"
            >
              <Phone size={14} />
              Call Us
            </a>
          </div>

          {/* CTA buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/quote?model=${vehicleSlug}${visitParam}`}
              className="flex items-center justify-center gap-2 bg-gold text-[#2c2308] font-bold text-sm py-3 rounded-lg hover:bg-opacity-90 transition-all"
            >
              <FileText size={16} />
              Get a Quote
            </Link>
            <Link
              href={`/test-drive?model=${vehicleSlug}${visitParam}`}
              className="flex items-center justify-center gap-2 bg-navy text-white font-bold text-sm py-3 rounded-lg hover:bg-opacity-90 transition-all"
            >
              <Calendar size={16} />
              Test Drive
            </Link>
          </div>
        </div>
      </div>

      {/* ── Desktop sticky side rail (right side) ─────────────────────── */}
      <div
        className="
          hidden lg:flex flex-col gap-2
          fixed right-6 bottom-1/4 z-50
          transition-all duration-300
        "
      >
        <div className="bg-white border border-line rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[160px]">
          <div className="text-xs text-steel border-b border-line pb-2 mb-1">
            <div className="font-bold text-navy text-sm">{vehicleName}</div>
            <div className="text-geely-blue font-semibold">{price}</div>
          </div>

          <Link
            href={`/quote?model=${vehicleSlug}${visitParam}`}
            className="flex items-center gap-2 bg-gold text-[#2c2308] font-bold text-xs px-3 py-2.5 rounded-lg hover:bg-opacity-90 transition-all text-center justify-center"
          >
            <FileText size={14} />
            Get a Quote
          </Link>

          <Link
            href={`/test-drive?model=${vehicleSlug}${visitParam}`}
            className="flex items-center gap-2 bg-navy text-white font-bold text-xs px-3 py-2.5 rounded-lg hover:bg-opacity-90 transition-all text-center justify-center"
          >
            <Calendar size={14} />
            Book Test Drive
          </Link>

          <a
            href="tel:+251110000000"
            className="flex items-center gap-2 border border-line text-navy font-semibold text-xs px-3 py-2.5 rounded-lg hover:bg-ice transition-all text-center justify-center"
          >
            <Phone size={14} />
            Call Us
          </a>

          <a
            href={`https://wa.me/251110000000?text=${encodeURIComponent(`Hi, I'm interested in the Geely ${vehicleName}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-[#25D366] text-[#128C7E] font-semibold text-xs px-3 py-2.5 rounded-lg hover:bg-[#25D366]/5 transition-all text-center justify-center"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>

          <a
            href={brochureUrl || `/api/vehicles/${vehicleSlug}/brochure`}
            className="flex items-center gap-2 text-steel font-semibold text-xs px-3 py-2 rounded-lg hover:bg-ice transition-all text-center justify-center"
            download
          >
            <Download size={14} />
            Brochure PDF
          </a>
        </div>
      </div>
    </>
  );
}
