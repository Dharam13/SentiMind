import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { GlowBackground } from "../components/common/GlowBackground";
import { LogoHero } from "../components/sections/LogoHero";
import { Hero } from "../components/sections/Hero";
import { Stats } from "../components/sections/Stats";
import { Features } from "../components/sections/Features";
import { DashboardPreview } from "../components/sections/DashboardPreview";
import { CTA } from "../components/sections/CTA";
import { ScrollIndicator } from "../components/common/ScrollIndicator";

export function Landing() {
  return (
    <div className="relative min-h-screen bg-senti-dark">
      <GlowBackground />
      <Navbar />
      <ScrollIndicator />
      <main className="relative">
        <LogoHero />
        <Hero />
        <Stats />
        <Features />
        <DashboardPreview />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
