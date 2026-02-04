import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Qual Carreira - Descubra sua carreira ideal com precisão",
  description:
    "Encontre seu caminho profissional com nosso teste vocacional. Análise cientificamente comprovada de habilidades, interesses e personalidade para recomendar as melhores carreiras para você.",
  metadataBase: new URL("https://www.qualcarreira.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Qual Carreira - Descubra sua carreira ideal com precisão",
    description:
      "Encontre seu caminho profissional com nosso teste vocacional cientificamente comprovado. Análise personalizada de habilidades e interesses.",
    url: "https://www.qualcarreira.com",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@qualcarreira",
    title: "Qual Carreira - Descubra sua carreira ideal com precisão",
    description:
      "Encontre seu caminho profissional com nosso teste vocacional cientificamente comprovado.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
