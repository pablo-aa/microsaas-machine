import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Perguntas Frequentes | QualCarreira - Tire suas dúvidas",
  description:
    "Tire suas dúvidas sobre o teste vocacional da QualCarreira. Respostas para as perguntas mais frequentes sobre o teste, resultados, pagamentos e privacidade.",
  alternates: {
    canonical: "https://www.qualcarreira.com/faq",
  },
  openGraph: {
    title: "FAQ - Perguntas Frequentes | QualCarreira",
    description:
      "Tire suas dúvidas sobre o teste vocacional da QualCarreira. Respostas para as perguntas mais frequentes.",
    type: "website",
    url: "https://www.qualcarreira.com/faq",
    images: ["/og-image.png"],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}



