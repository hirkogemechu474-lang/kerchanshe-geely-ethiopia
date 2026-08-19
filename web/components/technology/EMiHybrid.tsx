"use client";

import { motion } from "framer-motion";
import { Zap, TrendingUp, Leaf, Route } from "lucide-react";

export default function EMiHybrid() {
  const benefits = [
    {
      icon: Route,
      title: "Extended Range",
      stat: "1000+ km",
      description: "Exceptional combined range for worry-free long-distance travel"
    },
    {
      icon: Zap,
      title: "Rapid Acceleration",
      stat: "0-100 km/h in 7.5s",
      description: "Instant electric torque combined with petrol power"
    },
    {
      icon: Leaf,
      title: "Low Consumption",
      stat: "3.8L / 100km",
      description: "Industry-leading fuel efficiency in hybrid mode"
    },
    {
      icon: TrendingUp,
      title: "Smooth Performance",
      stat: "100% Electric City",
      description: "Seamless switching between electric and hybrid modes"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Visual */}
          <motion.div
            className="relative order-2 md:order-1"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative aspect-[4/3]">
              {/* Placeholder for hybrid system diagram */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-geely-blue/20 dark:from-emerald-500/30 dark:to-geely-blue/30 rounded-3xl border-2 border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center p-8">
                  <Zap className="w-24 h-24 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <div className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
                    EM-i Super Hybrid System
                    <br />
                    <span className="text-xs font-normal text-gray-500">Engine + Motor Visualization</span>
                  </div>
                </div>
              </div>
              
              {/* Animated particles */}
              <motion.div
                className="absolute top-1/4 right-0 w-3 h-3 bg-emerald-500 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-1/3 left-0 w-3 h-3 bg-geely-blue rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            className="order-1 md:order-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
              EM-i Technology
            </div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold text-navy dark:text-white mb-6 leading-tight tracking-tight">
              Super Hybrid
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">Performance & Range</span>
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
              The EM-i Super Hybrid system combines a high-efficiency petrol engine with an advanced 
              electric motor, delivering exceptional performance and range while maintaining 
              outstanding fuel economy.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <benefit.icon className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-3" />
                  <div className="text-2xl font-bold text-navy dark:text-white mb-1">{benefit.stat}</div>
                  <h3 className="font-bold text-navy dark:text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
