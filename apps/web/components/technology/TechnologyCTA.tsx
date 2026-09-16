"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Car, Calendar } from "lucide-react";

export default function TechnologyCTA() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-navy via-geely-blue to-blue-700 text-white relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Floating Shapes */}
      <motion.div
        className="absolute top-20 right-[10%] w-40 h-40 bg-gold/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-[10%] w-60 h-60 bg-blue-400/20 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Experience the
            <br />
            <span className="text-gold">Technology in Person</span>
          </h2>
          
          <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-12">
            See these innovative technologies in action. Visit a dealer for a test drive 
            or explore our full vehicle range.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link
              href="/test-drive"
              className="group inline-flex items-center justify-center gap-3 bg-gold text-navy dark:text-ice font-bold text-lg px-10 py-5 rounded-xl hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-gold/30"
            >
              <Calendar className="w-6 h-6" />
              <span>Book Test Drive</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <Link
              href="/models"
              className="group inline-flex items-center justify-center gap-3 bg-white dark:bg-midnight-surface/10 backdrop-blur-md text-white font-bold text-lg px-10 py-5 hover:bg-white/20 transition-all duration-300 border-2 border-white/30 hover:border-white/60"
            >
              <Car className="w-6 h-6" />
              <span>Explore Models</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div>
              <div className="text-4xl font-bold text-gold mb-2">25+</div>
              <div className="text-sm text-gray-300">Years Innovation</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gold mb-2">50+</div>
              <div className="text-sm text-gray-300">Global Awards</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gold mb-2">100%</div>
              <div className="text-sm text-gray-300">Quality Tested</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
