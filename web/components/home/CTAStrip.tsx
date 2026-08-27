import Link from "next/link";

export default function CTAStrip() {
  return (
    <div className="bg-navy text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center py-12 gap-8">
        <div>
          <h3 className="disp text-2xl font-bold mb-2 max-w-[460px]">
            Ready to feel it on the road?
          </h3>
          <p className="text-[#b9cbe4] text-sm">
            Book a test drive at your nearest showroom — most requests confirmed
            within one business day.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link
            href="/test-drive"
            className="bg-gold text-[#2c2308] font-bold text-sm px-7 py-[14px] rounded hover:bg-opacity-90 transition-all whitespace-nowrap"
          >
            Book a Test Drive
          </Link>
          <Link
            href="/quote"
            className="border border-white border-opacity-50 text-white font-semibold text-sm px-7 py-[14px] rounded hover:bg-white hover:bg-opacity-10 transition-all whitespace-nowrap"
          >
            Request a Quotation
          </Link>
        </div>
      </div>
    </div>
  );
}
