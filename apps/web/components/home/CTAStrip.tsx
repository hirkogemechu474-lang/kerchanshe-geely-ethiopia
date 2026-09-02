import Button from "@/components/ui/Button";

export default function CTAStrip() {
  return (
    <div className="bg-navy text-white">
      <div className="page-container flex flex-col md:flex-row justify-between items-center py-12 gap-8">
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
          <Button href="/test-drive" variant="outline" tone="dark" size="lg">
            Book a Test Drive
          </Button>
          <Button href="/quote" variant="outline" tone="dark" size="lg">
            Request a Quotation
          </Button>
        </div>
      </div>
    </div>
  );
}
