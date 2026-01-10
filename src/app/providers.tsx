"use client";

import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { DevBanner } from "@/components/DevBanner";
import ScrollToTop from "@/components/ScrollToTop";
import { initializeGTM, initializeGTM2 } from "@/lib/gtm";
import { getVisitorId } from "@/lib/identify";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // CRÍTICO: Inicializar dataLayer ANTES de qualquer coisa
    // Isso garante que usePageView e outros hooks não falhem
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
    }

    // Initialize Google Tag Manager (GTM existente - NÃO MODIFICAR)
    initializeGTM();

    // Initialize segundo Google Tag Manager (novo - implementação robusta)
    initializeGTM2();

    // Bootstrap de visitorId anônimo por navegador
    getVisitorId();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DevBanner />
        <ScrollToTop />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
