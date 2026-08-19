"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Cpu, Battery } from "lucide-react";

export default function TechnologyHero() {
  return (
    <section className="relative bg-gradient-to-br from-navy via-[#0a1f44] to-geely-blue text-white py-20 md:py-32 overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Floating Icons */}
      <motion.div
        className="absolute top-20 right-[10%] opacity-20"
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Zap size={80} className="text-gold" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-[5%] opacity-20"
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Battery size={60} className="text-gold" />
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Eyebrow */}
          <motion.div
            className="inline-flex items-center gap-2 text-gold text-sm font-bold tracking-[0.16em] uppercase mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Cpu size={20} />
            <span>INNOVATION & ENGINEERING</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="text-[48px] md:text-[64px] lg:text-[72px] font-extrabold leading-[1.05] mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ letterSpacing: '-0.02em' }}
          >
            Technology That
            <br />
            <span className="text-gold">Moves You Forward</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            From intelligent global architectures to advanced hybrid systems and cutting-edge battery technology,
            discover the innovation powering every Geely vehicle.
          </motion.p>

          {/* Tech Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            {[
              { icon: Zap, label: "Electric Range", value: "1000+ km" },
              { icon: Battery, label: "Battery Safety", value: "6 Tests" },
              { icon: Shield, label: "Safety Rating", value: "5 Stars" },
              { icon: Cpu, label: "Smart Features", value: "100+" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05, borderColor: "rgba(255, 184, 0, 0.5)" }}
              >
                <stat.icon className="w-8 h-8 text-gold mb-3 mx-auto" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
