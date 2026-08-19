"use client";

import { motion } from "framer-motion";
import { Layers, Gauge, Wrench, Sparkles } from "lucide-react";

export default function GEAArchitecture() {
  const features = [
    {
      icon: Layers,
      title: "Modular Platform",
      description: "Flexible architecture supporting multiple vehicle types, from compact sedans to large SUVs."
    },
    {
      icon: Gauge,
      title: "High Performance",
      description: "Optimized for power delivery, handling dynamics, and driving pleasure across all conditions."
    },
    {
      icon: Wrench,
      title: "Easy Maintenance",
      description: "Standardized components and smart diagnostics for simplified service and lower costs."
    },
    {
      icon: Sparkles,
      title: "Future-Ready",
      description: "Built to accommodate next-generation technologies including autonomous driving features."
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-geely-blue dark:text-blue-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
              GEA Architecture
            </div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold text-navy dark:text-white mb-6 leading-tight tracking-tight">
              Intelligent Global
              <br />
              <span className="text-geely-blue">Engineering Platform</span>
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              The Global Engineering Architecture (GEA) is Geely's intelligent modular platform, 
              powering our full range of vehicles with exceptional performance, efficiency, and safety.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-geely-blue to-blue-600 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy dark:text-white mb-1">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative aspect-square">
              {/* Placeholder for architecture diagram */}
              <div className="absolute inset-0 bg-gradient-to-br from-geely-blue/10 to-blue-600/10 dark:from-geely-blue/20 dark:to-blue-600/20 rounded-3xl border-2 border-geely-blue/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <Layers className="w-24 h-24 text-geely-blue mx-auto mb-4 opacity-50" />
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    GEA Architecture Diagram
                    <br />
                    <span className="text-xs">(Platform illustration)</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-geely-blue/20 rounded-full blur-2xl"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
