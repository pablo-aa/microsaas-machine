import { growthbookAdapter } from "@flags-sdk/growthbook";
import type { Attributes } from "@flags-sdk/growthbook";
import type { Identify } from "flags";
import { dedupe, flag } from "flags/next";
import { cookies } from "next/headers";

export const identify = dedupe(async () => {
  const cookieStore = await cookies();
  const visitorId = cookieStore?.get("qc_visitor_id")?.value ?? null;

  const attributes: Attributes = {};

  if (visitorId) {
    // Usamos o visitorId como id anônimo padrão
    // Isso permite segmentar/atribuir experimentos por usuário.
    // O campo `id` é convencional no GrowthBook.
    (attributes as any).id = visitorId;
  }

  return attributes;
}) satisfies Identify<Attributes>;

export const paymentExperienceFlag = flag<string>({
  key: "payment_experience",
  adapter: growthbookAdapter.feature<string>(),
  defaultValue: "A",
  identify,
});


