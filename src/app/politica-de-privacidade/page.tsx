import type { Metadata } from "next";
import PoliticaDePrivacidadePage from "@/components/pages/PoliticaDePrivacidadePage";

export const metadata: Metadata = {
  title: "Política de Privacidade | QualCarreira - Proteção de Dados LGPD",
  description:
    "Conheça nossa Política de Privacidade e como a QualCarreira protege seus dados pessoais conforme a LGPD. Transparência e segurança para você.",
  alternates: {
    canonical: "https://www.qualcarreira.com/politica-de-privacidade",
  },
  openGraph: {
    title: "Política de Privacidade | QualCarreira",
    description:
      "Conheça nossa Política de Privacidade e como a QualCarreira protege seus dados pessoais conforme a LGPD.",
    type: "website",
    url: "https://www.qualcarreira.com/politica-de-privacidade",
  },
};

export default function Page() {
  return <PoliticaDePrivacidadePage />;
}
