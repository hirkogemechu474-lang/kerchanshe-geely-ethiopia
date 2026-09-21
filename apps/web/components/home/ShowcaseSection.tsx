'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ModelSpotlightSimple } from '@/components/ModelSpotlightSimple';
import { Model3DViewer } from '@/components/Model3DViewer';
import Button from '@/components/ui/Button';
import { Maximize2 } from 'lucide-react';

interface ShowcaseView {
  angle: string;
  imageUrl: string;
  label: string;
}

interface Showcase {
  id: string;
  vehicleId: string;
  // Real Vehicle.slug, used to build the /models/:slug link — vehicleId is
  // a UUID and never resolves against the public vehicle-detail route.
  vehicleSlug: string | null;
  vehicleName: string;
  title: string;
  subtitle: string | null;
  views: ShowcaseView[];
  // Optional real 3D model (.glb/.gltf) — when set, this replaces the
  // photo-swap gallery below with an actual drag-to-rotate 3D viewer.
  modelUrl?: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  sortOrder: number;
}

interface ShowcaseSectionProps {
  // Fetched server-side (see app/page.tsx) so this section's real markup is
  // in the initial HTML instead of an empty aria-hidden shell that gets
  // replaced after a client fetch — that swap was a major CLS contributor.
  // Every active/published showcase (not just one) — a vehicle-picker lets
  // visitors switch which one they're looking at instead of always seeing
  // whichever one happens to sort first.
  initialShowcases: Showcase[];
}

export default function ShowcaseSection({ initialShowcases }: ShowcaseSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const showcase = initialShowcases[activeIndex] ?? null;
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax effects
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 1.1]);
  const goldBlobY = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  const hasViews = Array.isArray(showcase?.views) && showcase!.views.length > 0;
  if (!showcase || (!hasViews && !showcase.modelUrl)) {
    return (
      <motion.section
        ref={sectionRef}
        className="py-16 bg-white dark:bg-midnight-surface relative overflow-hidden transition-colors"
        style={{ opacity }}
      >
        <div className="page-container relative z-10">
          <motion.div
            className="text-center mb-12"
            style={{ scale }}
          >
            <div className="inline-block bg-active-blue/10 text-active-blue px-4 py-2 rounded-full text-sm font-bold mb-4">
              INTERACTIVE EXPERIENCE
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-navy dark:text-ice mb-4">
              Explore the Geely Range
            </h2>
            <p className="text-steel dark:text-steel-light text-lg max-w-2xl mx-auto">
              Take a closer look at our flagship models and experience them from every angle.
            </p>
          </motion.div>

          {/* No vehicle currently has any 360°/gallery media configured —
              a real, database-driven empty state rather than a stand-in
              photo of a specific model that isn't actually being showcased. */}
          <Link href="/models" className="block group">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-mesh-blue shadow-2xl flex items-center justify-center">
              <div className="text-center text-white/90 px-6">
                <div className="text-xs uppercase tracking-wide text-active-blue-80 mb-2">360° Showcase</div>
                <div className="font-bold text-lg">Vehicle showcases are coming soon</div>
                <div className="text-sm text-white/70 mt-2">Browse our full model range in the meantime.</div>
              </div>
            </div>
          </Link>

          <div className="mt-8 text-center">
            <Button href="/models" variant="solid" size="lg" className="group transform hover:scale-105 hover:shadow-xl">
              Explore Models
              <span className="transform group-hover:translate-x-2 transition-transform">&rarr;</span>
            </Button>
          </div>
        </div>
      </motion.section>
    );
  }

  const views = (showcase.views || []).map((view) => ({
    angle: view.angle,
    image: view.imageUrl,
    label: view.label,
  }));

  return (
    <motion.section 
      ref={sectionRef}
      className="py-16 bg-white dark:bg-midnight-surface relative overflow-hidden transition-colors"
      style={{ opacity }}
    >
      {/* Parallax Background Elements */}
      <motion.div
        className="absolute top-20 right-10 w-64 h-64 bg-active-blue/5 rounded-full blur-3xl"
        style={{ y }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-96 h-96 bg-accent-lightblue/5 rounded-full blur-3xl"
        style={{ y: goldBlobY }}
      />

      <div className="page-container relative z-10">
        <motion.div 
          className="text-center mb-12"
          style={{ scale }}
        >
          <motion.div 
            className="inline-block bg-active-blue/10 text-active-blue px-4 py-2 rounded-full text-sm font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {showcase.subtitle || 'INTERACTIVE EXPERIENCE'}
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-navy dark:text-ice mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {showcase.title}
          </motion.h2>
          <motion.p 
            className="text-steel dark:text-steel-light text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {showcase.subtitle || `Explore the ${showcase.vehicleName} from every angle.`}
          </motion.p>
        </motion.div>

        {/* Vehicle picker — only rendered once there's something to switch
            between, so a site with just one active showcase looks unchanged. */}
        {initialShowcases.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {initialShowcases.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setActiveIndex(index)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                  index === activeIndex
                    ? 'bg-navy text-white border-navy shadow-md shadow-navy/15'
                    : 'bg-white dark:bg-midnight-surface text-navy dark:text-ice border-line dark:border-midnight-line hover:border-active-blue hover:text-active-blue'
                }`}
              >
                {s.vehicleName}
              </button>
            ))}
          </div>
        )}

        <motion.div
          key={showcase.id}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {showcase.modelUrl ? (
            <div className="relative aspect-[16/9] rounded-xl bg-mesh-blue shadow-2xl overflow-hidden">
              <Model3DViewer src={showcase.modelUrl} alt={showcase.vehicleName} className="h-full w-full" />
              <Link
                href={`/models/${showcase.vehicleSlug ?? showcase.vehicleId}/3d-view`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-navy/90 px-4 py-2.5 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-navy"
              >
                <Maximize2 size={16} />
                Open Full 3D Viewer
              </Link>
            </div>
          ) : (
            <ModelSpotlightSimple
              modelName={showcase.vehicleName}
              views={views}
              className="shadow-2xl"
            />
          )}
        </motion.div>

        {(showcase.ctaText || showcase.ctaLink) && (
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              href={showcase.ctaLink || `/models/${showcase.vehicleSlug ?? showcase.vehicleId}`}
              variant="solid"
              size="lg"
              className="group transform hover:scale-105 hover:shadow-xl"
            >
              {showcase.ctaText || `Explore ${showcase.vehicleName}`}
              <span className="transform group-hover:translate-x-2 transition-transform">&rarr;</span>
            </Button>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
