// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.38.4"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
// Usando a API nativa de crypto do Deno
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const DAILY_EMAIL_LIMIT = 80;
const LOOKBACK_MINUTES = 30; // janela real de 30 min
// Função para gerar hash do conteúdo do e-mail
function generateCampaignId(subject, html) {
  const content = `${subject}|${html}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = crypto.subtle.digestSync("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b)=>b.toString(16).padStart(2, "0")).join("");
  return `recovery_${hashHex.substring(0, 10)}`;
}
serve(async (req)=>{
  console.log("=== INICIANDO FUNÇÃO SEND-RECOVERY-EMAIL ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Método da requisição: ${req.method}`);
  // CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Requisição OPTIONS recebida - respondendo com CORS headers");
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  // Flags de execução
  let testMode = false; // por padrão, executa pra valer
  let singleEmailMode = false; // por padrão, pode enviar mais de 1
  // Leitura opcional do corpo
  try {
    console.log("Tentando ler o corpo da requisição...");
    const requestData = await req.json();
    console.log("Corpo da requisição:", JSON.stringify(requestData));
    const { test, singleEmail, dryRun } = requestData ?? {};
    if (test === true) {
      console.log("Modo de teste curto ativado - resposta imediata");
      return new Response(JSON.stringify({
        success: true,
        message: "Teste realizado com sucesso. A função está funcionando corretamente."
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (dryRun === true) {
      console.log("Modo dry-run ativado - sem envio de e-mails nem escrita no BD");
      testMode = true;
    }
    if (singleEmail === true) {
      singleEmailMode = true;
      console.log("Modo de envio único ativado: apenas um e-mail será enviado");
    }
    console.log("Parâmetros de execução:", {
      testMode,
      singleEmailMode,
      dryRun: dryRun === true
    });
  } catch (e) {
    console.log("Sem JSON no corpo ou falha ao parsear:", e);
  }
  try {
    console.log("Iniciando processamento principal da função");
    // Credenciais
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    console.log("API key do Resend obtida:", resendApiKey ? "Sim" : "Não");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    console.log("Credenciais do Supabase obtidas:", {
      urlObtida: !!supabaseUrl,
      keyObtida: !!supabaseKey
    });
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Cliente Supabase inicializado");
    // ==== FUSO E JANELAS DE TEMPO ====
    // Banco está em UTC.
    // Precisamos do início do dia de HOJE em Brasília convertendo para UTC
    // e do lookback de 30 min, que é um delta relativo no UTC.
    const nowUtc = new Date();
    // Obter Y-M-D do horário atual em Brasília
    const TZ_OFFSET_BR_HOURS = 3; // America/Sao_Paulo hoje está UTC-3
    const nowInBr = new Date(nowUtc.getTime() - TZ_OFFSET_BR_HOURS * 60 * 60 * 1000);
    const y = nowInBr.getUTCFullYear();
    const m = nowInBr.getUTCMonth();
    const d = nowInBr.getUTCDate();
    // 00:00 de Brasília é 03:00 UTC
    const todayStartBrAsUtc = new Date(Date.UTC(y, m, d, TZ_OFFSET_BR_HOURS, 0, 0, 0));
    // Lookback real de 30 minutos em UTC
    const thirtyMinutesAgo = new Date(nowUtc.getTime() - LOOKBACK_MINUTES * 60 * 1000);
    console.log(`[TZ] nowUtc: ${nowUtc.toISOString()}`);
    console.log(`[TZ] hoje 00:00 America/Sao_Paulo em UTC: ${todayStartBrAsUtc.toISOString()}`);
    console.log(`[TZ] lookback (${LOOKBACK_MINUTES} min) UTC: ${thirtyMinutesAgo.toISOString()}`);
    // Limite diário a partir de hoje 00:00 em Brasília, comparando em UTC
    const { count: emailsSentToday, error: countError } = await supabase.from("payments").select("*", {
      count: "exact",
      head: true
    }).eq("recovery_email_sent", true).gte("recovery_email_sent_at", todayStartBrAsUtc.toISOString());
    if (countError) {
      console.error("Erro ao verificar limite de e-mails:", countError);
      throw new Error("Erro ao verificar limite de e-mails");
    }
    if ((emailsSentToday || 0) >= DAILY_EMAIL_LIMIT) {
      console.log(`Limite diário de ${DAILY_EMAIL_LIMIT} e-mails atingido`);
      return new Response(JSON.stringify({
        success: false,
        message: "Limite diário de e-mails atingido"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Buscar pagamentos pendentes criados há mais de 30 minutos
    // somente do dia corrente em Brasília
    const emailLimit = singleEmailMode ? 1 : DAILY_EMAIL_LIMIT - (emailsSentToday || 0);
    console.log("Parâmetros de busca:", {
      status: "pending",
      recovery_email_sent: false,
      created_at_antes_de: thirtyMinutesAgo.toISOString(),
      created_at_depois_de: todayStartBrAsUtc.toISOString(),
      limite: emailLimit
    });
    // Query base
    let query = supabase.from("payments").select(`
        id,
        payment_id,
        test_id,
        user_email,
        created_at,
        status
      `).eq("status", "pending").eq("recovery_email_sent", false);
    // Query de contagem total
    let countQuery = supabase.from("payments").select("*", {
      count: "exact",
      head: true
    }).eq("status", "pending").eq("recovery_email_sent", false).lte("created_at", thirtyMinutesAgo.toISOString()).gte("created_at", todayStartBrAsUtc.toISOString());
    // No modo normal, aplica janela de tempo também na query principal
    if (!singleEmailMode) {
      query = query.lte("created_at", thirtyMinutesAgo.toISOString()).gte("created_at", todayStartBrAsUtc.toISOString());
    }
    // Limitar resultados se não for dry-run
    if (!testMode) {
      query = query.limit(emailLimit);
    }
    // Ordenar por mais antigos primeiro
    query = query.order("created_at", {
      ascending: true
    });
    console.log(`Consulta SQL final: recovery_email_sent=false, status=pending, created_at <= ${thirtyMinutesAgo.toISOString()} e >= ${todayStartBrAsUtc.toISOString()}`);
    // Executar contagem
    const { count: totalPendingCount, error: countPendingError } = await countQuery;
    if (countPendingError) {
      console.error("Erro ao contar pagamentos pendentes:", countPendingError);
      throw new Error("Erro ao contar pagamentos pendentes");
    }
    console.log(`Total de pagamentos pendentes que atendem aos critérios: ${totalPendingCount || 0}`);
    // Buscar pendentes
    const { data: pendingPayments, error: pendingError } = await query;
    if (pendingError) {
      console.error("Erro ao buscar pagamentos pendentes:", pendingError);
      throw new Error("Erro ao buscar pagamentos pendentes");
    }
    console.log(`Encontrados ${pendingPayments?.length || 0} pagamentos pendentes para envio de e-mail`);
    // Conteúdo do e-mail
    const emailSubject = "Faltou só UM passo";
    const baseUrl = Deno.env.get("PUBLIC_URL") || "https://qualcarreira.com";
    function escapeHtml(s = "") {
      return s.replace(/[&<>"']/g, (c)=>({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[c]);
    }
    const CAMPAIGN_VERSION = "v1";
    // Processar e enviar
    const results = await Promise.all((pendingPayments || []).map(async (payment)=>{
      try {
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <p>USER_NAME, você ja respondeu todas as perguntas, ficou faltando desbloquear o resultado. Por menos de R$ 15 você acessa o seu perfil vocacional personalizado e recebe recomendações de carreira.</p>
              <p>Finalize o processo e acesse agora mesmo os seus resultados: <a href="RECOVERY_URL_PLACEHOLDER">Acessar meus resultados</a></p>
              <p>Abraços,</p>
              <p>Equipe Qual Carreira.</p>
            </div>
          `;
        // Campanha e URL
        const campaignId = generateCampaignId(emailSubject, `${CAMPAIGN_VERSION}|${emailHtml}`);
        // Buscar informações auxiliares
        const { data: resultData } = await supabase.from("test_results").select("name").eq("id", payment.test_id).maybeSingle();
        const userName = escapeHtml((resultData?.name || "Olá").trim());
        const recoveryUrl = `${baseUrl}/resultado/${encodeURIComponent(payment.test_id)}?source=email&campaign=${encodeURIComponent(campaignId)}`;
        const finalEmailHtml = emailHtml.replaceAll("RECOVERY_URL_PLACEHOLDER", recoveryUrl).replaceAll("USER_NAME", userName);
        // Dry-run não envia e não escreve
        if (testMode) {
          console.log(`[DRY-RUN] Simulando e-mail para ${payment.user_email} - ${recoveryUrl}`);
          console.log(`[DRY-RUN] Email enviado: ${finalEmailHtml}`);
          return {
            success: true,
            payment_id: payment.payment_id,
            email: payment.user_email,
            dry_run: true
          };
        }
        // Envio via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: "Qual Carreira <contato@qualcarreira.com>",
            to: payment.user_email,
            subject: emailSubject,
            html: finalEmailHtml
          })
        });
        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          console.error(`Erro ao enviar e-mail para ${payment.user_email}:`, emailResult);
          return {
            success: false,
            payment_id: payment.payment_id,
            error: emailResult
          };
        }
        // Atualizar pagamento
        const { error: updateError } = await supabase.from("payments").update({
          recovery_email_sent: true,
          recovery_email_sent_at: new Date().toISOString(),
          email_campaign_id: campaignId
        }).eq("id", payment.id);
        if (updateError) {
          console.error(`Erro ao atualizar pagamento ${payment.id}:`, updateError);
          return {
            success: false,
            payment_id: payment.payment_id,
            error: updateError
          };
        }
        return {
          success: true,
          payment_id: payment.payment_id,
          email: payment.user_email
        };
      } catch (err) {
        console.error(`Erro ao processar pagamento ${payment.id}:`, err);
        return {
          success: false,
          payment_id: payment.payment_id,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }));
    const successCount = results.filter((r)=>r.success).length;
    console.log("Processamento concluído:", {
      processados: pendingPayments?.length || 0,
      sucessos: successCount,
      resultados: results.map((r)=>({
          sucesso: r.success,
          payment_id: r.payment_id,
          email: r.email || "erro"
        }))
    });
    return new Response(JSON.stringify({
      success: true,
      processed: pendingPayments?.length || 0,
      successful: successCount,
      total_pending_count: totalPendingCount || 0,
      is_dry_run: testMode,
      results
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Erro na função send-recovery-email:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
