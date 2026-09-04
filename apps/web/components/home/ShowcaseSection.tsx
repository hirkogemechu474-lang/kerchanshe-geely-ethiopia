'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import imageLoader from '@/lib/imageLoader';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ModelSpotlightSimple } from '@/components/ModelSpotlightSimple';
import Button from '@/components/ui/Button';

interface ShowcaseView {
  angle: string;
  imageUrl: string;
  label: string;
}

interface Showcase {
  id: string;
  vehicleId: string;
  vehicleName: string;
  title: string;
  subtitle: string | null;
  views: ShowcaseView[];
  ctaText: string | null;
  ctaLink: string | null;
  sortOrder: number;
}

interface ShowcaseSectionProps {
  // Fetched server-side (see app/page.tsx) so this section's real markup is
  // in the initial HTML instead of an empty aria-hidden shell that gets
  // replaced after a client fetch — that swap was a major CLS contributor.
  initialShowcase: Showcase | null;
}

export default function ShowcaseSection({ initialShowcase }: ShowcaseSectionProps) {
  const showcase = initialShowcase;
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

  if (!showcase || !Array.isArray(showcase.views) || showcase.views.length === 0) {
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

          <Link href="/models" className="block group">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-mesh-blue shadow-2xl">
              <Image
                src="/images/vehicles/ex5/ex5-hero.jpg"
                alt="Geely vehicle showcase"
                loader={imageLoader}
                fill
                sizes="(min-width: 1024px) 1280px, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                  <div className="text-xs text-active-blue-80 mb-1">360° Showcase</div>
                  <div className="font-bold">Geely Flagship Models</div>
                </div>
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

  const views = showcase.views.map((view) => ({
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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <ModelSpotlightSimple
            modelName={showcase.vehicleName}
            views={views}
            className="shadow-2xl"
          />
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
              href={showcase.ctaLink || `/models/${showcase.vehicleId}`}
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
