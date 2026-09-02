import { MainLayout } from "@/components/MainLayout";
import TestimonialsSection from "@/components/TestimonialsSection";

export default function TestimonialsPage() {
  return (
    <MainLayout>
      {/* Page Header */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            CUSTOMER EXPERIENCES
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            Customer Testimonials
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Discover why Ethiopian customers love their Geely vehicles. Read authentic reviews and watch video testimonials from real owners across the country.
          </p>
        </div>
      </div>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <TestimonialsSection showFilters={true} />
        </div>
      </section>
    </MainLayout>
  );
}