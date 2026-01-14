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

// Função para calcular preço baseado em variant histórico
// Novos pagamentos não têm mais payment_variant, então default é 12.90 (preço fixo atual)
const getPriceByVariant = (variant: string | null): number => {
  switch (variant) {
    case 'A': return 9.90; // Histórico
    case 'B': return 12.90; // Histórico e preço atual fixo
    case 'C': return 14.90; // Histórico
    default: return 12.90; // Default para novos pagamentos (preço fixo)
  }
};

// Limites diários por tipo de email
const DAILY_EMAIL_LIMIT_TYPE1 = 30; // Pagamentos pendentes (com cupom de desconto)
const DAILY_EMAIL_LIMIT_TYPE2 = 30; // Formulários completos sem pagamento iniciado
const LOOKBACK_MINUTES = 5; // janela real de 5 min
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
    // Limite diário separado por tipo
    // TIPO 1: Emails de pagamentos pendentes (com cupom)
    const { count: emailsPaymentsSentToday, error: countPaymentsError } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("recovery_email_sent", true)
      .gte("recovery_email_sent_at", todayStartBrAsUtc.toISOString());
    
    if (countPaymentsError) {
      console.error("Erro ao verificar limite de e-mails (payments):", countPaymentsError);
      throw new Error("Erro ao verificar limite de e-mails (payments)");
    }
    
    // TIPO 2: Emails de test_results sem pagamento
    const { count: emailsResultsSentToday, error: countResultsError } = await supabase
      .from("test_results")
      .select("*", { count: "exact", head: true })
      .eq("recovery_email_sent", true)
      .gte("recovery_email_sent_at", todayStartBrAsUtc.toISOString());
    
    if (countResultsError) {
      console.error("Erro ao verificar limite de e-mails (test_results):", countResultsError);
      throw new Error("Erro ao verificar limite de e-mails (test_results)");
    }
    
    console.log(`Emails enviados hoje - Tipo 1 (payments): ${emailsPaymentsSentToday || 0}/${DAILY_EMAIL_LIMIT_TYPE1}`);
    console.log(`Emails enviados hoje - Tipo 2 (test_results): ${emailsResultsSentToday || 0}/${DAILY_EMAIL_LIMIT_TYPE2}`);
    // Calcular limites disponíveis por tipo
    const emailLimitType1 = singleEmailMode ? 1 : DAILY_EMAIL_LIMIT_TYPE1 - (emailsPaymentsSentToday || 0);
    const emailLimitType2 = singleEmailMode ? 1 : DAILY_EMAIL_LIMIT_TYPE2 - (emailsResultsSentToday || 0);
    
    console.log(`Limite disponível - Tipo 1: ${emailLimitType1}`);
    console.log(`Limite disponível - Tipo 2: ${emailLimitType2}`);
    
    // ========== TIPO 1: Pagamentos pendentes (com desconto) ==========
    console.log("\n=== TIPO 1: Pagamentos Pendentes ===");
    console.log("Parâmetros de busca:", {
      status: "pending",
      recovery_email_sent: false,
      created_at_antes_de: thirtyMinutesAgo.toISOString(),
      created_at_depois_de: todayStartBrAsUtc.toISOString()
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
    // Limitar resultados Tipo 1 se não for dry-run
    if (!testMode && emailLimitType1 > 0) {
      query = query.limit(emailLimitType1);
    } else if (emailLimitType1 <= 0) {
      console.log('Limite diário de emails Tipo 1 atingido, pulando busca');
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
    
    // ========== TIPO 2: Test results sem pagamento (simples) ==========
    console.log("\n=== TIPO 2: Formulários Completos Sem Pagamento ===");
    
    // Buscar test_results que:
    // - Foram criados há 5+ minutos
    // - Não estão desbloqueados
    // - Não receberam email de recuperação
    // - Não têm pagamento iniciado (ou só têm expired/cancelled)
    let unlockedResults = [];
    let unlockedError = null;
    
    if (emailLimitType2 > 0) {
      const result = await supabase
        .from('test_results')
        .select('id, name, email, created_at')
        .eq('is_unlocked', false)
        .eq('recovery_email_sent', false)
        .lte('created_at', thirtyMinutesAgo.toISOString())
        .gte('created_at', todayStartBrAsUtc.toISOString())
        .not('email', 'is', null)
        .not('name', 'is', null)
        .order('created_at', { ascending: true })
        .limit(testMode ? 100 : emailLimitType2);
      
      unlockedResults = result.data;
      unlockedError = result.error;
    } else {
      console.log('Limite diário de emails Tipo 2 atingido, pulando busca');
    }
    
    if (unlockedError) {
      console.error("Erro ao buscar test results:", unlockedError);
      throw new Error("Erro ao buscar test results");
    }
    
    // Filtrar apenas os que NÃO têm pagamento iniciado (pending/approved)
    // Buscar todos os test_ids que TÊM pagamento pending/approved (em uma query)
    const testIdsFromResults = (unlockedResults || []).map(r => r.id);
    
    let testIdsWithPayments = [];
    if (testIdsFromResults.length > 0) {
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('test_id')
        .in('test_id', testIdsFromResults)
        .in('status', ['pending', 'approved']);
      
      testIdsWithPayments = (paymentsData || []).map(p => p.test_id);
    }
    
    // Filtrar results que NÃO estão na lista de test_ids com payment
    const resultsWithoutPayment = (unlockedResults || []).filter(
      result => !testIdsWithPayments.includes(result.id)
    );
    
    console.log(`Encontrados ${resultsWithoutPayment.length} test results sem pagamento para envio de e-mail`);
    
    // Totais por tipo
    const totalType1 = pendingPayments?.length || 0;
    const totalType2 = resultsWithoutPayment.length;
    const totalToSend = totalType1 + totalType2;
    
    console.log(`\nResumo:`);
    console.log(`- Tipo 1 (pagamentos pendentes): ${totalType1} emails`);
    console.log(`- Tipo 2 (formulários sem pagamento): ${totalType2} emails`);
    console.log(`- Total: ${totalToSend} emails`);
    
    // Conteúdo dos e-mails
    const baseUrl = Deno.env.get("PUBLIC_URL") || "https://qualcarreira.com";
    const couponCode = "REMARKETING990";
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
    
    // Função auxiliar para delay (respeitar rate limit do Resend: 2/segundo)
    // Usando 800ms para margem de segurança (1.25 emails/segundo)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const DELAY_BETWEEN_EMAILS = 800; // ms
    
    // ========== PROCESSAR TIPO 1: Pagamentos Pendentes (com desconto) ==========
    console.log('\n=== Processando Tipo 1 ===');
    
    // Processar sequencialmente com delay de 600ms entre emails (respeita 2/segundo)
    const resultsType1 = [];
    for (const payment of (pendingPayments || [])) {
      try {
        // Get variant and calculate prices
        const paymentVariant = payment.payment_variant || 'A';
        const originalPrice = getPriceByVariant(paymentVariant);
        const discountPercentage = 23; // REMARKETING990
        const discountedPrice = parseFloat((originalPrice * (1 - discountPercentage / 100)).toFixed(2));
        
        const emailSubject = "Você travou seu resultado… e agora tem 23% OFF";
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Seu teste já está feito, a parte mais trabalhosa ficou para trás.</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Agora, por um valor menor, você pode destravar tudo o que ele revela sobre seus interesses, habilidades e caminhos profissionais.</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Liberamos um desconto exclusivo para quem parou na última etapa:</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 18px; margin: 0; color: #6c757d; text-decoration: line-through;">R$ ${originalPrice.toFixed(2)}</p>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #28a745;">R$ ${discountedPrice.toFixed(2)}</p>
                <p style="font-size: 14px; margin: 0; color: #28a745; font-weight: 600;">${discountPercentage}% de desconto</p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Finalize seu acesso com o desconto ativo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="RECOVERY_URL_PLACEHOLDER" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">Desbloquear com Desconto</a>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Abraços,</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Equipe Qual Carreira.</p>
            </div>
          `;
        // Campanha e URL
        const campaignId = generateCampaignId(emailSubject, `${CAMPAIGN_VERSION}|${emailHtml}`);
        // Buscar informações auxiliares
        const { data: resultData } = await supabase.from("test_results").select("name").eq("id", payment.test_id).maybeSingle();
        const userName = escapeHtml((resultData?.name || "Olá").trim());
        const recoveryUrl = `${baseUrl}/resultado/${encodeURIComponent(payment.test_id)}?cupom=${encodeURIComponent(couponCode)}&source=email&campaign=${encodeURIComponent(campaignId)}`;
        const finalEmailHtml = emailHtml.replaceAll("RECOVERY_URL_PLACEHOLDER", recoveryUrl).replaceAll("USER_NAME", userName);
        // Dry-run não envia e não escreve
        if (testMode) {
          console.log(`[DRY-RUN] Simulando e-mail para ${payment.user_email} - ${recoveryUrl}`);
          console.log(`[DRY-RUN] Email enviado: ${finalEmailHtml}`);
          resultsType1.push({
            success: true,
            payment_id: payment.payment_id,
            email: payment.user_email,
            dry_run: true
          });
          continue;
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
          resultsType1.push({
            success: false,
            payment_id: payment.payment_id,
            error: emailResult
          });
          await delay(DELAY_BETWEEN_EMAILS); // Delay mesmo em caso de erro
          continue;
        }
        // Atualizar pagamento
        const { error: updateError } = await supabase.from("payments").update({
          recovery_email_sent: true,
          recovery_email_sent_at: new Date().toISOString(),
          email_campaign_id: campaignId
        }).eq("id", payment.id);
        if (updateError) {
          console.error(`Erro ao atualizar pagamento ${payment.id}:`, updateError);
          resultsType1.push({
            success: false,
            payment_id: payment.payment_id,
            error: updateError
          });
          await delay(DELAY_BETWEEN_EMAILS);
          continue;
        }
        resultsType1.push({
          success: true,
          payment_id: payment.payment_id,
          email: payment.user_email
        });
        
        // Delay de 600ms entre emails (respeita rate limit de 2/segundo)
        await delay(DELAY_BETWEEN_EMAILS);
      } catch (err) {
        console.error(`Erro ao processar pagamento ${payment.id}:`, err);
        resultsType1.push({
          success: false,
          payment_id: payment.payment_id,
          error: err instanceof Error ? err.message : String(err)
        });
        await delay(DELAY_BETWEEN_EMAILS);
      }
    }
    
    const successCountType1 = resultsType1.filter((r)=>r.success).length;
    console.log(`Tipo 1 concluído: ${successCountType1}/${resultsType1.length} sucessos`);
    
    // ========== PROCESSAR TIPO 2: Test Results Sem Pagamento (simples) ==========
    console.log('\n=== Processando Tipo 2 ===');
    
    // Processar sequencialmente com delay de 600ms entre emails
    const resultsType2 = [];
    for (const testResult of resultsWithoutPayment) {
      const emailSubject = "Faltou só UM passo";
      try {
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">USER_NAME, seu resultado está pronto, só falta desbloquear.</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Em poucos minutos você vê <strong>seu perfil vocacional</strong>, as carreiras com maior compatibilidade e seus pontos fortes.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="RECOVERY_URL_PLACEHOLDER" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">Acessar Meu Resultado</a>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Abraços,</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Equipe QualCarreira.</p>
            </div>
          `;
        
        // Campanha e URL
        const campaignId = generateCampaignId(emailSubject, `${CAMPAIGN_VERSION}|${emailHtml}`);
        const userName = escapeHtml((testResult.name || "Olá").trim());
        const recoveryUrl = `${baseUrl}/resultado/${encodeURIComponent(testResult.id)}?source=email&campaign=${encodeURIComponent(campaignId)}`;
        const finalEmailHtml = emailHtml.replaceAll("RECOVERY_URL_PLACEHOLDER", recoveryUrl).replaceAll("USER_NAME", userName);
        
        // Dry-run
        if (testMode) {
          console.log(`[DRY-RUN] Tipo 2 - E-mail para ${testResult.email} - ${recoveryUrl}`);
          resultsType2.push({
            success: true,
            test_id: testResult.id,
            email: testResult.email,
            dry_run: true,
            type: 2
          });
          continue;
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
            to: testResult.email,
            subject: emailSubject,
            html: finalEmailHtml
          })
        });
        
        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          console.error(`Erro ao enviar e-mail para ${testResult.email}:`, emailResult);
          resultsType2.push({
            success: false,
            test_id: testResult.id,
            error: emailResult,
            type: 2
          });
          await delay(DELAY_BETWEEN_EMAILS);
          continue;
        }
        
        // Atualizar test_result
        const { error: updateError } = await supabase.from("test_results").update({
          recovery_email_sent: true,
          recovery_email_sent_at: new Date().toISOString(),
          email_campaign_id: campaignId
        }).eq("id", testResult.id);
        
        if (updateError) {
          console.error(`Erro ao atualizar test_result ${testResult.id}:`, updateError);
          resultsType2.push({
            success: false,
            test_id: testResult.id,
            error: updateError,
            type: 2
          });
          await delay(DELAY_BETWEEN_EMAILS);
          continue;
        }
        
        resultsType2.push({
          success: true,
          test_id: testResult.id,
          email: testResult.email,
          type: 2
        });
        
        // Delay de 600ms entre emails (respeita rate limit de 2/segundo)
        await delay(DELAY_BETWEEN_EMAILS);
      } catch (err) {
        console.error(`Erro ao processar test_result ${testResult.id}:`, err);
        resultsType2.push({
          success: false,
          test_id: testResult.id,
          error: err instanceof Error ? err.message : String(err),
          type: 2
        });
        await delay(DELAY_BETWEEN_EMAILS);
      }
    }
    
    const successCountType2 = resultsType2.filter((r)=>r.success).length;
    console.log(`Tipo 2 concluído: ${successCountType2}/${resultsType2.length} sucessos`);
    
    // Combinar resultados
    const allResults = [...resultsType1, ...resultsType2];
    const totalSuccessful = successCountType1 + successCountType2;
    const totalProcessed = resultsType1.length + resultsType2.length;
    
    console.log("\n=== Resumo Final ===");
    console.log(`Total processado: ${totalProcessed}`);
    console.log(`Total bem-sucedido: ${totalSuccessful}`);
    console.log(`- Tipo 1: ${successCountType1}/${resultsType1.length}`);
    console.log(`- Tipo 2: ${successCountType2}/${resultsType2.length}`);
    
    return new Response(JSON.stringify({
      success: true,
      processed: totalProcessed,
      successful: totalSuccessful,
      type1: {
        processed: resultsType1.length,
        successful: successCountType1
      },
      type2: {
        processed: resultsType2.length,
        successful: successCountType2
      },
      total_pending_count: totalPendingCount || 0,
      is_dry_run: testMode,
      results: allResults
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
