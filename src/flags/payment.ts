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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/94ad3856-20f9-4b0b-ae9e-8cc5d17e867e',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      sessionId:'debug-session',
      runId:'pre-fix',
      hypothesisId:'H1',
      location:'src/flags/payment.ts:identify',
      message:'identify resolved attributes',
      data:{ hasVisitorId: !!visitorId },
      timestamp:Date.now()
    })
  }).catch(()=>{});
  // #endregion agent log

  return attributes;
}) satisfies Identify<Attributes>;

export const paymentExperienceFlag = flag<string>({
  key: "payment_experience",
  adapter: growthbookAdapter.feature<string>(),
  defaultValue: "A",
  identify,
});


