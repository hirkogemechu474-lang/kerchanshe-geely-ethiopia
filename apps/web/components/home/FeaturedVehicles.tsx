"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

interface Vehicle {
  id: string;
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  finalPrice: number | null;
  hidePrice?: boolean;
  images: any;
  heroImageUrl: string | null;
}

export default function FeaturedVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax effects
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  useEffect(() => {
    fetch('/api/public/vehicles?featured=true')
      .then(res => res.json())
      .then(data => {
        const featuredVehicles = Array.isArray(data)
          ? data
          : data?.vehicles || [];

        setVehicles(featuredVehicles.slice(0, 3)); // Show max 3 featured
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading featured vehicles:', err);
        setLoading(false);
      });
  }, []);

  return (
    <motion.section 
      ref={sectionRef}
      className="py-[70px] relative overflow-hidden"
    >
      {/* Parallax Background */}
      <motion.div
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-active-blue/5 rounded-full blur-3xl"
        style={{ y }}
      />

      <div className="page-container relative z-10">
        {/* Section Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-9"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="disp text-[30px] text-navy font-bold mb-2">
              The Range
            </h2>
            <p className="text-steel text-sm max-w-[460px]">
              Every model, one consistent structure: price, specs, gallery and a
              clear next step.
            </p>
          </div>
          <Link
            href="/models"
            className="text-[13px] font-bold text-active-blue border-b border-active-blue pb-1 hover:opacity-80 transition-opacity"
          >
            View all models &rarr;
          </Link>
        </motion.div>

        {/* Vehicle Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-active-blue border-t-transparent mb-4"></div>
              <p className="text-steel">Loading vehicles...</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-steel text-lg">No featured vehicles available</p>
            <Button href="/models" variant="solid" size="md" className="mt-4">
              View All Models
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {vehicles.map((vehicle, index) => {
              const imageUrl = vehicle.heroImageUrl || 
                              (Array.isArray(vehicle.images) && vehicle.images[0]) ||
                              null;

              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card variant="boxed">
                  {/* Vehicle Image */}
                  <div className="h-[170px] bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4 flex items-center justify-center text-[11px] text-navy/70 text-center px-4 overflow-hidden">
                    {imageUrl ? (
                      <ImageWithFallback
                        src={imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{vehicle.name} - exterior 3/4 studio shot</span>
                    )}
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-5">
                    <div className="text-[11px] text-active-blue font-bold tracking-wider mb-2 uppercase">
                      {vehicle.category}
                    </div>
                    <h3 className="text-[19px] text-navy font-bold mb-2">
                      {vehicle.name}
                    </h3>
                    <div className="flex gap-3">
                      <Button href={`/quote?model=${vehicle.slug}`} variant="solid" size="sm" className="flex-1">
                        Get a Quote
                      </Button>
                      <Button href={`/models/${vehicle.slug}`} variant="outline" tone="light" size="sm" className="flex-1">
                        Details
                      </Button>
                    </div>
                  </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
}
