import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Battery, Zap, Leaf, DollarSign, Wrench, MapPin, TrendingUp, Shield, HelpCircle, Clock, Home, Calculator, Gift, TreePine } from "lucide-react";
import HeroMediaDisplay from "@/components/electric/HeroMediaDisplay";
import ResponsiveVehicleImage from "@/components/electric/ResponsiveVehicleImage";

async function getElectricVehicles() {
  try {
    const electricCategory = await prisma.vehicleCategory.findFirst({
      where: {
        slug: 'electric',
        isActive: true,
      },
    });

    if (!electricCategory) {
      return [];
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        categoryId: electricCategory.id,
        isActive: true,
        status: 'published',
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return vehicles;
  } catch (error) {
    console.error('Error fetching electric vehicles:', error);
    return [];
  }
}

async function getHeroSection() {
  try {
    const hero = await prisma.electricPage.findFirst({
      where: { slug: 'hero', isPublished: true },
    });
    return hero;
  } catch (error) {
    console.error('Error fetching hero:', error);
    return null;
  }
}

export default async function ElectricPage() {
  const electricVehicles = await getElectricVehicles();
  const featuredEV = electricVehicles[0];
  const heroSection = await getHeroSection();

  const heroMetadata = (heroSection?.metadata as any) || {};
  const gradientClass = heroMetadata.backgroundGradient || 'from-green-600 via-green-500 to-blue-500';
  const ctaButtonText = heroMetadata.ctaButtonText || 'Explore Our Electric Vehicles';
  const ctaButtonLink = heroMetadata.ctaButtonLink || '/models/geometry-ex5';
  const ctaSecondaryButtonText = heroMetadata.ctaSecondaryButtonText || 'Book Test Drive';
  const ctaSecondaryButtonLink = heroMetadata.ctaSecondaryButtonLink || '/test-drive';

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className={`bg-gradient-to-br ${gradientClass} text-white py-20`}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {heroSection?.heroSubtitle && (
                <div className="text-[13px] tracking-[0.14em] text-green-100 font-bold mb-3">
                  {heroSection.heroSubtitle}
                </div>
              )}
              <h1 className="disp text-5xl font-bold mb-6">
                {heroSection?.heroTitle || 'Electric Vehicles by Geely'}
              </h1>
              {heroSection?.content && (
                <p className="text-lg text-green-50 mb-8 leading-relaxed">
                  {heroSection.content}
                </p>
              )}
              <div className="flex gap-4 mb-8 flex-wrap">
                <Link
                  href={ctaButtonLink}
                  className="bg-white text-green-600 font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
                >
                  {ctaButtonText}
                </Link>
                <Link
                  href={ctaSecondaryButtonLink}
                  className="border-2 border-white text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                >
                  {ctaSecondaryButtonText}
                </Link>
              </div>

              {/* Battery & Warranty Card */}
              <div className="max-w-md">
                <Link
                  href="/electric/battery"
                  className="group block bg-white rounded-lg border-2 border-orange-500 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="h-40 bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Battery className="text-white" size={48} />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-orange-600 transition-colors">
                      Battery & Warranty
                    </h3>
                    <p className="text-sm text-steel mb-4 leading-relaxed">
                      Learn about Geely EV battery technology, capacity, range, charging, safety, warranty, and maintenance.
                    </p>
                    <div className="inline-flex items-center text-orange-600 font-semibold text-sm group-hover:gap-2 gap-1 transition-all">
                      Learn More <span>→</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <HeroMediaDisplay
                imageUrl={heroSection?.heroImage}
                videoUrl={heroSection?.heroImage}
                altText="Electric Vehicle Hero"
                title={featuredEV ? featuredEV.name : 'Geometry EX5'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Why Go Electric */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="disp text-4xl text-navy font-bold mb-4">
              Why Choose Electric?
            </h2>
            <p className="text-steel text-base max-w-2xl mx-auto">
              Electric vehicles offer numerous advantages for Ethiopian drivers, from cost savings to environmental benefits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white border border-line rounded-lg p-6 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Leaf className="text-green-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Zero Emissions</h3>
              <p className="text-sm text-steel leading-relaxed">
                Contribute to cleaner air in Ethiopian cities. No tailpipe emissions means a healthier environment for everyone.
              </p>
            </div>

            <div className="bg-white border border-line rounded-lg p-6 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Lower Running Costs</h3>
              <p className="text-sm text-steel leading-relaxed">
                Electricity costs significantly less than petrol. Save up to 70% on fuel costs with an EV.
              </p>
            </div>

            <div className="bg-white border border-line rounded-lg p-6 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Wrench className="text-purple-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Low Maintenance</h3>
              <p className="text-sm text-steel leading-relaxed">
                Fewer moving parts mean less maintenance. No oil changes, spark plugs, or exhaust systems to worry about.
              </p>
            </div>

            <div className="bg-white border border-line rounded-lg p-6 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="text-orange-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Advanced Technology</h3>
              <p className="text-sm text-steel leading-relaxed">
                Cutting-edge features including regenerative braking, smart connectivity, and over-the-air updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore EV Benefits - 6 Cards */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="disp text-4xl text-navy font-bold mb-4">
              Explore EV Benefits
            </h2>
            <p className="text-steel text-base max-w-2xl mx-auto">
              Learn more about charging options, cost savings, environmental impact, and government incentives available for electric vehicle owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Charging Map */}
            <Link
              href="/electric/charging-map"
              className="group bg-white rounded-lg border-2 border-green-500 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="h-40 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <MapPin className="text-white" size={48} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-green-600 transition-colors">
                  Charging Map
                </h3>
                <p className="text-sm text-steel mb-4 leading-relaxed">
                  Find charging stations near you with our interactive map. Locate public chargers, Geely service centers, and highway stops across Ethiopia.
                </p>
                <div className="inline-flex items-center text-green-600 font-semibold text-sm group-hover:gap-2 gap-1 transition-all">
                  View Map <span>→</span>
                </div>
              </div>
            </Link>

            {/* Home Charging */}
            <Link
              href="/electric/home-charging"
              className="group bg-white rounded-lg border-2 border-orange-500 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="h-40 bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Home className="text-white" size={48} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-orange-600 transition-colors">
                  Home Charging
                </h3>
                <p className="text-sm text-steel mb-4 leading-relaxed">
                  Everything you need to know about charging your EV at home. Standard outlets, dedicated wall boxes, installation guides, and electricity cost estimates.
                </p>
                <div className="inline-flex items-center text-orange-600 font-semibold text-sm group-hover:gap-2 gap-1 transition-all">
                  Learn More <span>→</span>
                </div>
              </div>
            </Link>

            {/* Fast Charging */}
            <Link
              href="/electric/fast-charging"
              className="group bg-white rounded-lg border-2 border-purple-500 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="h-40 bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Zap className="text-white" size={48} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-purple-600 transition-colors">
                  Fast Charging
                </h3>
                <p className="text-sm text-steel mb-4 leading-relaxed">
                  DC fast charging locations, speeds, and pricing. Get up to 80% charge in 30 minutes and keep your adventures going.
                </p>
                <div className="inline-flex items-center text-purple-600 font-semibold text-sm group-hover:gap-2 gap-1 transition-all">
                  Find Chargers <span>→</span>
                </div>
              </div>
            </Link>

            {/* Cost Calculator */}
            <Link
              href="/electric/calculator"
              className="group bg-white rounded-lg border-2 border-emerald-500 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="h-40 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Calculator className="text-white" size={48} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-emerald-600 transition-colors">
                  Cost Calculator
                </h3>
                <p className="text-sm text-steel mb-4 leading-relaxed">
                  Calculate exactly how much you can save annually by switching to an electric vehicle. Compare fuel costs and electricity rates tailored to Ethiopia.
                </p>
                <div className="inline-flex items-center text-emerald-600 font-semibold text-sm group-hover:gap-2 gap-1 transition-all">
                  Calculate Savings <span>→</span>
                </div>
              </div>
            </Link>

            {/* Government Incentives */}
            <Link
              href="/electric/incentives"
              className="group bg-white rounded-lg border-2 border-blue-500 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="h-40 bg-gradient-to-br from-blue-500 via-yellow-500 to-cyan-600 flex items-center justify-center">
                <Gift className="text-white" size={48} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-blue-600 transition-colors">
                  Government Incentives
                </h3>
                <p className="text-sm text-steel mb-4 leading-relaxed">
                  Discover available tax benefits, reduced import duties, and government support programs for EV owners in Ethiopia.
                </p>
                <div className="inline-flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 gap-1 transition-all">
                  View Incentives <span>→</span>
                </div>
              </div>
            </Link>

            {/* Environmental Impact */}
            <Link
              href="/electric/environment"
              className="group bg-white rounded-lg border-2 border-teal-500 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="h-40 bg-gradient-to-br from-green-500 via-teal-500 to-cyan-600 flex items-center justify-center">
                <TreePine className="text-white" size={48} />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-teal-600 transition-colors">
                  Environmental Impact
                </h3>
                <p className="text-sm text-steel mb-4 leading-relaxed">
                  Learn about the positive environmental impact of electric vehicles in Ethiopia. Calculate your CO2 savings and contribution to cleaner cities.
                </p>
                <div className="inline-flex items-center text-teal-600 font-semibold text-sm group-hover:gap-2 gap-1 transition-all">
                  Learn More <span>→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured EV */}
      {featuredEV && (
        <section className="py-16 bg-ice">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-full mb-4">
                  NOW AVAILABLE IN ETHIOPIA
                </span>
                <h2 className="disp text-4xl text-navy font-bold mb-4">
                  {featuredEV.name}
                </h2>
                <p className="text-steel text-base mb-6 leading-relaxed">
                  {featuredEV.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {featuredEV.specifications && typeof featuredEV.specifications === 'object' && 
                   (featuredEV.specifications as any).performance && (
                    <>
                      {(featuredEV.specifications as any).performance.range && (
                        <div className="bg-white p-4 rounded-lg border border-line">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {(featuredEV.specifications as any).performance.range}
                          </div>
                          <div className="text-xs text-steel font-semibold">Driving Range</div>
                        </div>
                      )}
                      {(featuredEV.specifications as any).battery?.capacity && (
                        <div className="bg-white p-4 rounded-lg border border-line">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {(featuredEV.specifications as any).battery.capacity}
                          </div>
                          <div className="text-xs text-steel font-semibold">Battery Capacity</div>
                        </div>
                      )}
                      {(featuredEV.specifications as any).engine?.power && (
                        <div className="bg-white p-4 rounded-lg border border-line">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {(featuredEV.specifications as any).engine.power}
                          </div>
                          <div className="text-xs text-steel font-semibold">Power Output</div>
                        </div>
                      )}
                      {(featuredEV.specifications as any).performance.acceleration && (
                        <div className="bg-white p-4 rounded-lg border border-line">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {(featuredEV.specifications as any).performance.acceleration}
                          </div>
                          <div className="text-xs text-steel font-semibold">0-100 km/h</div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {featuredEV.finalPrice && (
                  <div className="bg-white p-4 rounded-lg border-2 border-green-500 mb-6">
                    <div className="text-sm text-steel mb-1">Starting Price</div>
                    <div className="text-3xl font-bold text-navy">
                      ETB {featuredEV.finalPrice.toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 flex-wrap">
                  <Link
                    href={`/models/${featuredEV.slug}`}
                    className="bg-navy text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
                  >
                    Full Specifications
                  </Link>
                  <Link
                    href={`/quote?model=${featuredEV.slug}`}
                    className="border border-line text-navy font-semibold text-sm px-8 py-4 rounded hover:bg-ice transition-all"
                  >
                    Get a Quote
                  </Link>
                </div>
              </div>

              <div className="relative h-[450px] rounded-lg overflow-hidden">
                <ResponsiveVehicleImage
                  src={
                    featuredEV.images && Array.isArray(featuredEV.images) && (featuredEV.images as string[]).length > 0
                      ? (featuredEV.images as string[])[0]
                      : null
                  }
                  alt={featuredEV.name}
                  title={featuredEV.name}
                  priority={true}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Electric Vehicles */}
      {electricVehicles.length > 1 && (
        <section className="py-16">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center mb-12">
              <h2 className="disp text-4xl text-navy font-bold mb-4">
                Our Electric Vehicle Range
              </h2>
              <p className="text-steel text-base max-w-2xl mx-auto">
                Explore our complete lineup of electric vehicles designed for Ethiopian roads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {electricVehicles.map((vehicle) => (
                <Link 
                  key={vehicle.id}
                  href={`/models/${vehicle.slug}`}
                  className="group bg-white rounded-lg border border-line overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="relative h-64 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec]">
                    {vehicle.images && Array.isArray(vehicle.images) && (vehicle.images as string[]).length > 0 ? (
                      <img 
                        src={(vehicle.images as string[])[0]}
                        alt={vehicle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-steel">
                        {vehicle.name}
                      </div>
                    )}
                    {vehicle.badge && (
                      <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {vehicle.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-geely-blue transition-colors">
                      {vehicle.name}
                    </h3>
                    <p className="text-sm text-steel mb-4 line-clamp-2">
                      {vehicle.description}
                    </p>
                    
                    {vehicle.specifications && typeof vehicle.specifications === 'object' && (
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        {(vehicle.specifications as any).performance?.range && (
                          <div className="bg-ice p-2 rounded">
                            <div className="text-steel">Range</div>
                            <div className="font-bold text-navy">{(vehicle.specifications as any).performance.range}</div>
                          </div>
                        )}
                        {(vehicle.specifications as any).battery?.capacity && (
                          <div className="bg-ice p-2 rounded">
                            <div className="text-steel">Battery</div>
                            <div className="font-bold text-navy">{(vehicle.specifications as any).battery.capacity}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {vehicle.finalPrice && (
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-navy">
                          ETB {vehicle.finalPrice.toLocaleString()}
                        </span>
                        {vehicle.discountAmount && vehicle.basePrice && (
                          <span className="text-sm text-steel line-through">
                            ETB {vehicle.basePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-geely-blue font-semibold text-sm group-hover:underline">
                      View Details →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Charging Infrastructure */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="disp text-4xl text-navy font-bold mb-4">
              Charging Made Simple
            </h2>
            <p className="text-steel text-base max-w-2xl mx-auto">
              Multiple charging options to fit your lifestyle and keep you on the road.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Link
              href="/electric/home-charging"
              className="group bg-white border-2 border-green-500 rounded-lg p-8 hover:shadow-xl hover:-translate-y-2 transition-all"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <Home className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3 group-hover:text-green-600 transition-colors">Home Charging</h3>
              <p className="text-sm text-steel mb-4 leading-relaxed">
                Charge overnight at home with a standard 220V outlet or install a dedicated wall box for faster charging.
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li>• Standard Outlet: 8-10 hours</li>
                <li>• Wall Box (7kW): 4-6 hours</li>
                <li>• Convenient overnight charging</li>
              </ul>
            </Link>

            <Link
              href="/electric/charging-map"
              className="group bg-white border-2 border-blue-500 rounded-lg p-8 hover:shadow-xl hover:-translate-y-2 transition-all"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <MapPin className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3 group-hover:text-blue-600 transition-colors">Public Charging</h3>
              <p className="text-sm text-steel mb-4 leading-relaxed">
                Growing network of public charging stations across major Ethiopian cities.
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li>• Shopping centers & hotels</li>
                <li>• Geely service centers</li>
                <li>• Highway rest stops (coming soon)</li>
              </ul>
            </Link>

            <Link
              href="/electric/fast-charging"
              className="group bg-white border-2 border-purple-500 rounded-lg p-8 hover:shadow-xl hover:-translate-y-2 transition-all"
            >
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                <Zap className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3 group-hover:text-purple-600 transition-colors">DC Fast Charging</h3>
              <p className="text-sm text-steel mb-4 leading-relaxed">
                Rapid charging when you're on the go. Get up to 80% charge in under an hour.
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li>• 30 minutes to 80% charge</li>
                <li>• Available at select locations</li>
                <li>• Ideal for long trips</li>
              </ul>
            </Link>
          </div>

          <div className="bg-white border border-line rounded-lg p-8">
            <h3 className="text-2xl font-bold text-navy mb-6">Charging Station Locations</h3>
            <Link
              href="/electric/charging-map"
              className="block h-[400px] bg-[repeating-linear-gradient(45deg,#eef3fa,#eef3fa_10px,#e4ecf7_10px,#e4ecf7_20px)] rounded-lg flex items-center justify-center text-steel text-sm relative hover:shadow-lg transition-all group"
            >
              <div className="text-center">
                <MapPin className="mx-auto mb-2 text-blue-600" size={32} />
                <span className="font-semibold text-navy group-hover:text-blue-600 transition-colors">Interactive Charging Station Map</span>
                <br />
                <span>(Click to open full map with charging point markers)</span>
              </div>
              <div className="absolute w-6 h-6 bg-green-500 rounded-full border-2 border-white" style={{ top: "30%", left: "40%" }}></div>
              <div className="absolute w-6 h-6 bg-green-500 rounded-full border-2 border-white" style={{ top: "50%", left: "55%" }}></div>
              <div className="absolute w-6 h-6 bg-green-500 rounded-full border-2 border-white" style={{ top: "60%", left: "45%" }}></div>
            </Link>
          </div>
        </div>
      </section>

      {/* Ownership Guide */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="disp text-4xl text-navy font-bold mb-4">
              EV Ownership Guide
            </h2>
            <p className="text-steel text-base max-w-2xl mx-auto">
              Everything you need to know about owning and maintaining your electric Geely.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Battery Care */}
            <Link
              href="/electric/battery"
              className="group bg-white rounded-lg border border-line p-8 hover:shadow-xl hover:-translate-y-2 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Battery className="text-green-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-navy group-hover:text-green-600 transition-colors">Battery Care & Warranty</h3>
              </div>
              <ul className="space-y-3 text-sm text-steel">
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">•</span>
                  <span><strong>8-year/150,000 km battery warranty</strong> - Comprehensive coverage for peace of mind</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">•</span>
                  <span><strong>Battery health monitoring</strong> - Real-time battery status via mobile app</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">•</span>
                  <span><strong>Optimal charging practices</strong> - Keep battery between 20-80% for daily use</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">•</span>
                  <span><strong>Temperature management</strong> - Advanced thermal system protects battery in all climates</span>
                </li>
              </ul>
            </Link>

            {/* Maintenance */}
            <div className="bg-white rounded-lg border border-line p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wrench className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-navy">Maintenance Schedule</h3>
              </div>
              <ul className="space-y-3 text-sm text-steel">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Every 10,000 km</strong> - Tire rotation, brake fluid check, cabin filter replacement</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Every 20,000 km</strong> - Full vehicle inspection, coolant system check</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>No oil changes required</strong> - Electric motors don't need engine oil</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Brake longevity</strong> - Regenerative braking extends brake pad life</span>
                </li>
              </ul>
            </div>

            {/* Cost Savings */}
            <Link
              href="/electric/calculator"
              className="group bg-white rounded-lg border border-line p-8 hover:shadow-xl hover:-translate-y-2 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-purple-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-navy group-hover:text-purple-600 transition-colors">Cost Comparison</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-ice rounded-lg">
                  <div className="text-xs text-steel mb-2">Annual Fuel Cost (15,000 km/year)</div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-bold text-navy">Petrol Vehicle</div>
                      <div className="text-xs text-steel">~ETB 45,000/year</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-green-600">Geometry EX5</div>
                      <div className="text-xs text-green-600">~ETB 12,000/year</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-bold text-green-600">
                    Save ETB 33,000 annually!
                  </div>
                </div>
                <p className="text-xs text-steel leading-relaxed">
                  *Based on average electricity rates of ETB 3/kWh and petrol prices of ETB 70/liter. Actual savings may vary based on driving habits and electricity costs.
                </p>
              </div>
            </Link>

            {/* Government Incentives */}
            <Link
              href="/electric/incentives"
              className="group bg-white rounded-lg border border-line p-8 hover:shadow-xl hover:-translate-y-2 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Gift className="text-orange-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-navy group-hover:text-orange-600 transition-colors">Incentives & Benefits</h3>
              </div>
              <ul className="space-y-3 text-sm text-steel">
                <li className="flex gap-3">
                  <span className="text-orange-600 font-bold">•</span>
                  <span><strong>Reduced import duties</strong> - Special rates for electric vehicles</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-600 font-bold">•</span>
                  <span><strong>Lower registration fees</strong> - Government incentives for EV adoption</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-600 font-bold">•</span>
                  <span><strong>Priority parking</strong> - Dedicated EV parking at select locations</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-600 font-bold">•</span>
                  <span><strong>Future benefits</strong> - Additional incentives being planned</span>
                </li>
              </ul>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="disp text-4xl text-navy font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "How long does it take to charge the Geometry EX5?",
                a: "With a standard 220V outlet, a full charge takes 8-10 hours. With a 7kW wall box, it takes 4-6 hours. DC fast charging can get you to 80% in about 30 minutes.",
              },
              {
                q: "What is the real-world driving range?",
                a: "The Geometry EX5 offers up to 530 km on a single charge (NEDC). Real-world range typically varies between 400-480 km depending on driving conditions, climate, and driving style.",
              },
              {
                q: "Can I charge during load shedding?",
                a: "Yes, you can install a home battery backup system or charge at public stations with backup power. Many of our service centers have generator backup for charging.",
              },
              {
                q: "How much does it cost to charge at home?",
                a: "Based on current electricity rates, a full charge costs approximately ETB 200-250, giving you up to 530 km of range. That's about ETB 0.40-0.50 per kilometer.",
              },
              {
                q: "What happens to the battery after 8 years?",
                a: "The battery is covered by an 8-year/150,000 km warranty. After this period, the battery typically retains 70-80% of its original capacity and can continue to be used. Battery replacement options will be available if needed.",
              },
              {
                q: "Can I service my EV at any Geely service center?",
                a: "Yes, all Geely service centers are equipped to service electric vehicles. Our technicians receive specialized EV training from Geely.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white border border-line rounded-lg p-6">
                <h4 className="font-bold text-navy mb-2 text-lg">{faq.q}</h4>
                <p className="text-sm text-steel leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <h3 className="disp text-4xl font-bold mb-4">
            Ready to Go Electric?
          </h3>
          <p className="text-lg text-green-50 mb-8 max-w-2xl mx-auto">
            Experience the Geometry EX5 and discover how electric driving can transform your daily commute.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/test-drive"
              className="bg-white text-green-600 font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
            >
              Book a Test Drive
            </Link>
            <Link
              href="/models/geometry-ex5"
              className="border-2 border-white text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
            >
              View Full Specs
            </Link>
            <Link
              href="/dealers"
              className="border-2 border-white text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
            >
              Find a Showroom
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
