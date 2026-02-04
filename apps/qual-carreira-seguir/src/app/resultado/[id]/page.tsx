import type { Metadata } from "next";
import ResultadoPage from "@/components/pages/ResultadoPage";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  return <ResultadoPage />;
}
