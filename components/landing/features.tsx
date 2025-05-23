'use client';

import { motion } from 'framer-motion';
import { Layers, LineChart, Shield, Zap, RefreshCw, PieChart } from 'lucide-react';

const features = [
  {
    icon: <Shield className="h-10 w-10 text-chart-1" />,
    title: 'Web3 Authentication',
    description: 'Secure login with Crossmint wallet integration, ensuring your assets remain under your control at all times.'
  },
  {
    icon: <LineChart className="h-10 w-10 text-chart-2" />,
    title: 'Real-time Market Data',
    description: 'Live price updates and order book data from Binance, providing the most accurate market information.'
  },
  {
    icon: <Layers className="h-10 w-10 text-chart-3" />,
    title: 'Advanced Order Types',
    description: 'Execute trades with precision using market, limit, and stop orders to maximize your trading strategy.'
  },
  {
    icon: <Zap className="h-10 w-10 text-chart-4" />,
    title: 'Instant Execution',
    description: 'Lightning-fast trade execution ensures you never miss an opportunity in volatile markets.'
  },
  {
    icon: <RefreshCw className="h-10 w-10 text-chart-5" />,
    title: 'Position Management',
    description: 'Track all your open positions with real-time P&L updates and comprehensive portfolio analytics.'
  },
  {
    icon: <PieChart className="h-10 w-10 text-chart-1" />,
    title: 'Performance Analytics',
    description: 'Detailed insights into your trading performance with customizable metrics and visualizations.'
  }
];

export function LandingFeatures() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Powerful Trading Features</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform is built with the features professional traders demand, wrapped in an intuitive interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: '-50px' }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}