"use client";

import { motion } from "framer-motion";
import { Shield, Eye, AlertCircle, Radio, Car, Users } from "lucide-react";

export default function SafetySystems() {
  const systems = [
    {
      icon: Eye,
      title: "360° Vision",
      features: ["Surround view camera", "Blind spot monitoring", "Rear cross-traffic alert"]
    },
    {
      icon: Radio,
      title: "Active Safety",
      features: ["Adaptive cruise control", "Lane keep assist", "Emergency braking"]
    },
    {
      icon: AlertCircle,
      title: "Driver Alerts",
      features: ["Fatigue detection", "Attention warning", "Speed limit recognition"]
    },
    {
      icon: Car,
      title: "Collision Avoidance",
      features: ["Forward collision warning", "Pedestrian detection", "Automatic emergency braking"]
    },
    {
      icon: Shield,
      title: "Structural Safety",
      features: ["High-strength steel body", "8 airbags standard", "Reinforced cabin"]
    },
    {
      icon: Users,
      title: "Occupant Protection",
      features: ["Child seat anchors", "Seatbelt pre-tensioners", "Whiplash protection"]
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
            Safety Systems
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-navy dark:text-ice dark:text-white mb-6 leading-tight tracking-tight">
            Advanced Safety
            <br />
            <span className="text-red-600 dark:text-red-400">Protecting What Matters Most</span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive suite of active and passive safety systems designed to protect you, 
            your passengers, and everyone on the road.
          </p>
        </motion.div>

        {/* Safety Systems Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {systems.map((system, index) => (
            <motion.div
              key={system.title}
              className="bg-white dark:bg-midnight-surface dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-700 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <system.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-navy dark:text-ice dark:text-white mb-4">{system.title}</h3>
              
              <ul className="space-y-2">
                {system.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Safety Rating */}
        <motion.div
          className="mt-16 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-12 text-white text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
              >
                <svg className="w-10 h-10 fill-gold" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>
            ))}
          </div>
          <div className="text-3xl font-bold mb-2">5-Star Safety Rating</div>
          <p className="text-red-100">Top safety scores in global crash tests</p>
        </motion.div>
      </div>
    </section>
  );
}
