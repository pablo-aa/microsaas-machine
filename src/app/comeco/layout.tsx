import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comece o Teste | QualCarreira - Inicie seu teste vocacional",
  description:
    "Inicie agora o teste vocacional da QualCarreira e descubra suas principais aptidões e carreiras compatíveis em poucos minutos.",
  alternates: {
    canonical: "https://www.qualcarreira.com/comeco",
  },
  openGraph: {
    title: "Comece o Teste | QualCarreira",
    description:
      "Comece o teste vocacional online da QualCarreira e receba recomendações personalizadas de carreira.",
    type: "website",
    url: "https://www.qualcarreira.com/comeco",
    images: ["/og-image.png"],
  },
};

export default function ComecoLayout({ children }: { children: React.ReactNode }) {
  return children;
}



