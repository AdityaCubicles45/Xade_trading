import { LandingHero } from '@/components/landing/hero';
import { LandingHeader } from '@/components/landing/header';
import { LandingFeatures } from '@/components/landing/features';
import { LandingCTA } from '@/components/landing/cta';
import { LandingFooter } from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}