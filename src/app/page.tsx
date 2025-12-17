"use client";

import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import ResultsFooter from "@/components/ResultsFooter";
import CookieConsent from "@/components/CookieConsent";
import { usePageView, useScrollDepth } from "@/hooks/useGTM";
import { useCouponCapture } from "@/hooks/useCouponCapture";

export default function Home() {
  usePageView();
  useScrollDepth();
  useCouponCapture(); // Captura cupom da URL

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <StatsSection />
      <FeaturesSection />
      <ResultsFooter />
      <CookieConsent />
    </main>
  );
}
