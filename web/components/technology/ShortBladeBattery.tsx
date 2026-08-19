"use client";

import { motion } from "framer-motion";
import { Battery, Shield, Flame, Snowflake, AlertTriangle, Zap } from "lucide-react";

export default function ShortBladeBattery() {
  const safetyTests = [
    { icon: Snowflake, label: "Low Temperature", result: "Pass" },
    { icon: AlertTriangle, label: "Corrosion", result: "Pass" },
    { icon: Shield, label: "Collision", result: "Pass" },
    { icon: Zap, label: "Overcharge", result: "Pass" },
    { icon: Flame, label: "Extreme Heat", result: "Pass" },
    { icon: Battery, label: "Puncture", result: "Pass" }
  ];

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
            Battery Technology
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-navy dark:text-white mb-6 leading-tight tracking-tight">
            Short Blade Battery
            <br />
            <span className="text-amber-600 dark:text-amber-400">Maximum Safety, Zero Compromise</span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our advanced Short Blade Battery technology passes 6 extreme safety tests with no fire, 
            smoke, or explosion. Industry-leading protection for peace of mind.
          </p>
        </motion.div>

        {/* Safety Tests Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {safetyTests.map((test, index) => (
            <motion.div
              key={test.label}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-2xl p-6 border-2 border-transparent hover:border-amber-400 transition-all"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <test.icon className="w-12 h-12 text-amber-600 dark:text-amber-400 mb-3" />
              <h3 className="font-bold text-navy dark:text-white mb-1">{test.label}</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">{test.result}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Key Features */}
        <motion.div
          className="grid md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800">
            <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">Fire Incidents</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Proven safety across all extreme tests</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">15</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">Year Warranty</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Long-term confidence in battery life</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">80%</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">Charge in 30 mins</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fast charging for ultimate convenience</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
