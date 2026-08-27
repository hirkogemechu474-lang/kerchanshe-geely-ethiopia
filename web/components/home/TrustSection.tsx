const trustItems = [
  {
    icon: "✓",
    title: "Genuine Warranty",
    description: "Manufacturer-backed coverage on every new vehicle sold.",
  },
  {
    icon: "⚙",
    title: "Nationwide Service",
    description: "Certified technicians and genuine parts across our dealer network.",
  },
  {
    icon: "₿",
    title: "Flexible Financing",
    description: "Cash, bank loan and lease options tailored to you.",
  },
  {
    icon: "★",
    title: "Global Standard",
    description: "Engineering and safety trusted in over 80 markets worldwide.",
  },
];

export default function TrustSection() {
  return (
    <section className="bg-ice dark:bg-midnight py-[70px] transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="mb-9">
          <h2 className="disp text-[30px] text-navy dark:text-ice font-bold">
            Why Geely Ethiopia
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustItems.map((item, index) => (
            <div key={index} className="text-center p-3">
              <div className="w-11 h-11 rounded-full bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line mx-auto mb-4 flex items-center justify-center text-geely-blue dark:text-blue-bright font-bold text-base">
                {item.icon}
              </div>
              <h3 className="text-[15px] text-navy dark:text-ice font-bold mb-2">
                {item.title}
              </h3>
              <p className="text-[12.5px] text-steel dark:text-steel-light leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
