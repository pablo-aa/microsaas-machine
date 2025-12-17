import ResultadoPage from "@/components/pages/ResultadoPage";

// Forçar renderização dinâmica - CRÍTICO para evitar 404 no Vercel
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function Page() {
  return <ResultadoPage />;
}
