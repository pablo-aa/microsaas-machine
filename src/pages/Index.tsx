import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import CookieConsent from "@/components/CookieConsent";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <StatsSection />
      <FeaturesSection />
      <CookieConsent />
    </main>
  );
};

export default Index;
