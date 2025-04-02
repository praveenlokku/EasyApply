import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import PricingSection from "@/components/sections/PricingSection";
import WaitlistSection from "@/components/sections/WaitlistSection";
import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [location, setLocation] = useLocation();
  const sections = useRef<Record<string, HTMLElement | null>>({});

  // Handles navigation from hash links
  useEffect(() => {
    if (location.includes("#")) {
      const sectionId = location.split("#")[1];
      const element = sections.current[sectionId];
      
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  // Register section refs
  const registerSection = (id: string, ref: HTMLElement | null) => {
    if (ref) {
      sections.current[id] = ref;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <HeroSection ref={(ref) => registerSection("home", ref)} />
        <FeaturesSection ref={(ref) => registerSection("features", ref)} />
        <HowItWorksSection ref={(ref) => registerSection("how-it-works", ref)} />
        <TestimonialsSection />
        <PricingSection ref={(ref) => registerSection("pricing", ref)} />
        <WaitlistSection ref={(ref) => registerSection("waitlist", ref)} />
      </main>
      
      <Footer />
    </div>
  );
}
