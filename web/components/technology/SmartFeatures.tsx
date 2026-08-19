"use client";

import { motion } from "framer-motion";
import { Smartphone, Wifi, Volume2, Navigation, Thermometer, Smartphone as Phone } from "lucide-react";

export default function SmartFeatures() {
  const features = [
    {
      icon: Smartphone,
      title: "Connected App",
      description: "Remote start, lock/unlock, vehicle status, and location tracking from your smartphone"
    },
    {
      icon: Navigation,
      title: "Smart Navigation",
      description: "Real-time traffic, voice control, and intelligent route optimization with live updates"
    },
    {
      icon: Wifi,
      title: "4G Connectivity",
      description: "Built-in WiFi hotspot, OTA updates, and seamless smartphone integration"
    },
    {
      icon: Volume2,
      title: "Voice Assistant",
      description: "Natural language commands for climate, media, navigation, and vehicle functions"
    },
    {
      icon: Thermometer,
      title: "Climate Control",
      description: "Multi-zone automatic climate with air purification and remote pre-conditioning"
    },
    {
      icon: Phone,
      title: "Wireless Charging",
      description: "Qi wireless charging pad, multiple USB ports, and 12V outlets throughout"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-5 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
              Smart Technology
            </div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold text-navy dark:text-white mb-6 leading-tight tracking-tight">
              Connected
              <br />
              <span className="text-purple-600 dark:text-purple-400">Intelligence</span>
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Stay connected, informed, and in control with our suite of intelligent features 
              designed to enhance every journey.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl px-6 py-3 border border-purple-200 dark:border-purple-700">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">100+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Smart Features</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl px-6 py-3 border border-blue-200 dark:border-blue-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Connectivity</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Features Grid */}
          <motion.div
            className="md:col-span-3"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-2xl p-6 hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-navy dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
