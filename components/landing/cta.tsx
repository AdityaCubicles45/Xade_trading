'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CrossmintLoginButton } from '@/components/auth/crossmint-login';

export function LandingCTA() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-4xl mx-auto bg-card rounded-2xl p-8 md:p-12 border relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: '-100px' }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/10 via-chart-2/5 to-transparent -z-10" />
          
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Trading Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of traders who have already discovered the power of our platform.
              Get started with a demo account and 10,000 USDT to practice your strategy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CrossmintLoginButton variant="default" size="lg" />
              <Button variant="outline" size="lg">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}