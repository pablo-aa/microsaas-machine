import type { Metadata } from "next";
import ResultadoPage from "@/components/pages/ResultadoPage";
import { paymentExperienceFlag } from "@/flags/payment";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  const variant = await paymentExperienceFlag();

  return <ResultadoPage paymentVariant={variant || "A"} />;
}
