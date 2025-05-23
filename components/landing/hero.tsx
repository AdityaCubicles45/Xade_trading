'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CrossmintLoginButton } from '@/components/auth/crossmint-login';

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Advanced Trading Platform <br />
            <span className="text-primary bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
              with Web3 Authentication
            </span>
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-lg text-muted-foreground max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Experience next-generation trading with real-time market data, 
            advanced charting, and secure Web3 wallet authentication. Start trading 
            cryptocurrencies with confidence.
          </motion.p>
          
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CrossmintLoginButton variant="default" size="lg" />
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Explore Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-chart-1/10 via-chart-2/5 to-transparent -z-10" />
      
      {/* Animated chart preview */}
      <motion.div 
        className="relative mt-16 mx-auto max-w-5xl rounded-xl overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <div className="aspect-video bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-chart-1"></div>
                <span className="text-sm font-medium">BTC/USDT</span>
              </div>
              <div className="flex space-x-4">
                <span className="text-sm font-mono text-chart-1">+2.54%</span>
                <span className="text-sm font-mono">$48,256.72</span>
              </div>
            </div>
          </div>
          <div className="h-full bg-gradient-to-b from-card to-card/50 flex items-center justify-center">
            <div className="relative w-full h-[300px]">
              {/* Simulated chart pattern */}
              <svg viewBox="0 0 1000 300" className="w-full h-full">
                <path 
                  d="M0,150 C50,120 100,180 150,140 C200,100 250,160 300,130 C350,100 400,90 450,60 C500,30 550,70 600,50 C650,30 700,90 750,110 C800,130 850,110 900,150 C950,190 1000,170 1000,170 L1000,300 L0,300 Z" 
                  fill="url(#chart-gradient)" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth="2" 
                  opacity="0.7"
                />
                <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="0" />
                </linearGradient>
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}