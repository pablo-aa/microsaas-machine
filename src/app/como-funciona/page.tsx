import type { Metadata } from "next";
import ComoFuncionaPage from "@/components/pages/ComoFuncionaPage";

export const metadata: Metadata = {
  title: "Como Funciona | QualCarreira - Teste Vocacional Científico",
  description:
    "Descubra como funciona o teste vocacional da QualCarreira. Metodologias científicas RIASEC, Gardner e GOPC para identificar sua carreira ideal em minutos.",
  alternates: {
    canonical: "https://www.qualcarreira.com/como-funciona",
  },
  openGraph: {
    title: "Como Funciona | QualCarreira - Teste Vocacional Científico",
    description:
      "Descubra como funciona o teste vocacional da QualCarreira. Metodologias científicas RIASEC, Gardner e GOPC para identificar sua carreira ideal em minutos.",
    url: "https://www.qualcarreira.com/como-funciona",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <ComoFuncionaPage />;
}
