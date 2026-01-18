import type { Metadata } from "next";
import { contextualQuestionnaireFlag } from "@/flags/contextualQuestionnaire";
import AvaliacaoPage from "@/components/pages/AvaliacaoPage";

// Forçar renderização dinâmica para evitar 404 no reload
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0; // Sempre revalidar, nunca usar cache

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const variant = await contextualQuestionnaireFlag();
  return <AvaliacaoPage contextualQuestionnaireVariant={variant || "disabled"} />;
}
