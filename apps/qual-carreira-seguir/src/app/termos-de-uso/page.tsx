import type { Metadata } from "next";
import TermosDeUsoPage from "@/components/pages/TermosDeUsoPage";

export const metadata: Metadata = {
  title: "Termos de Uso | QualCarreira - Teste Vocacional Online",
  description:
    "Leia os Termos de Uso da QualCarreira. Conheça as regras e condições para utilizar nosso teste vocacional e serviços de orientação profissional.",
  alternates: {
    canonical: "https://www.qualcarreira.com/termos-de-uso",
  },
  openGraph: {
    title: "Termos de Uso | QualCarreira",
    description:
      "Leia os Termos de Uso da QualCarreira. Conheça as regras e condições para utilizar nosso teste vocacional e serviços de orientação profissional.",
    type: "website",
    url: "https://www.qualcarreira.com/termos-de-uso",
  },
};

export default function Page() {
  return <TermosDeUsoPage />;
}
