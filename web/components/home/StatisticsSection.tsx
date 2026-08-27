interface Stat {
  label: string;
  value: string;
}

interface StatisticsSectionProps {
  // Fetched server-side (see app/page.tsx) so the real numbers are in the
  // initial HTML instead of the hardcoded defaults popping in after a
  // client fetch resolves.
  initialStats: Stat[];
}

export default function StatisticsSection({ initialStats }: StatisticsSectionProps) {
  const stats = initialStats;

  return (
    <section className="py-16 bg-navy text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 border border-white rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 border border-white rounded-full"></div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 relative">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Our numbers speak for themselves. Join the growing community of satisfied Geely owners across Ethiopia.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <div className="text-3xl md:text-4xl font-bold text-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-lg text-blue-100 font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-blue-100 mb-8 text-lg">
            Backed by Geely's global reputation and local Ethiopian expertise
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                <span className="text-navy font-bold">✓</span>
              </div>
              <span className="text-blue-100">Authorized Distributor</span>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                <span className="text-navy font-bold">✓</span>
              </div>
              <span className="text-blue-100">Comprehensive Warranty</span>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center">
                <span className="text-navy font-bold">✓</span>
              </div>
              <span className="text-blue-100">Nationwide Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}