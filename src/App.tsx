import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Comeco from "./pages/Comeco";
import Avaliacao from "./pages/Avaliacao";
import Resultado from "./pages/Resultado";
import ComoFunciona from "./pages/ComoFunciona";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import { DevBanner } from "./components/DevBanner";
import ScrollToTop from "./components/ScrollToTop";
import { initializeGTM } from "./lib/gtm";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize Google Tag Manager
    initializeGTM();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <DevBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/comeco" element={<Comeco />} />
            <Route path="/avaliacao/:id" element={<Avaliacao />} />
            <Route path="/resultado/:id" element={<Resultado />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
            <Route path="/faq" element={<FAQ />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
