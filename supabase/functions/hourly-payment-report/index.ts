import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Validate WAAPI token
    const waapiToken = Deno.env.get('WAAPI_TOKEN');
    if (!waapiToken) {
      console.error('[hourly-payment-report] Missing WAAPI_TOKEN env');
      return new Response(JSON.stringify({
        error: 'WAAPI_TOKEN not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);

    // CORREÇÃO: Trabalhar corretamente com GMT-3
    // GMT-3 está 3 horas ATRÁS de UTC
    // Se são 13h31 em GMT-3, em UTC são 16h31 (13h31 + 3h = 16h31)
    
    const now = new Date(); // UTC atual do servidor
    const GMT3_OFFSET_MS = 3 * 60 * 60 * 1000; // 3 horas em milissegundos
    
    // Para obter a hora atual em GMT-3: subtrair 3 horas do UTC
    // Exemplo: 16h31 UTC - 3h = 13h31 GMT-3
    const nowGMT3 = new Date(now.getTime() - GMT3_OFFSET_MS);
    
    // Calcular início do dia em GMT-3 e converter para UTC
    // Se são 13h31 GMT-3 (16h31 UTC), o início do dia em GMT-3 é 00h00 GMT-3
    // 00h00 GMT-3 = 03h00 UTC (00h00 + 3h = 03h00)
    const todayStartGMT3 = new Date(nowGMT3);
    todayStartGMT3.setUTCHours(0, 0, 0, 0); // Meia-noite em GMT-3 (mas ainda representado como UTC)
    // Agora preciso converter de volta: se é 00h00 GMT-3, em UTC é 03h00
    const todayStartUTC = new Date(todayStartGMT3.getTime() + GMT3_OFFSET_MS);
    
    // Calcular última hora cheia em GMT-3
    // Exemplo: 13h31 GMT-3 → última hora cheia = 12h00-13h00 GMT-3
    // 12h00 GMT-3 = 15h00 UTC, 13h00 GMT-3 = 16h00 UTC
    const currentHourGMT3 = new Date(nowGMT3);
    currentHourGMT3.setUTCMinutes(0, 0, 0); // Arredondar para início da hora atual em GMT-3
    
    const lastFullHourStartGMT3 = new Date(currentHourGMT3);
    lastFullHourStartGMT3.setUTCHours(lastFullHourStartGMT3.getUTCHours() - 1);
    
    const lastFullHourEndGMT3 = new Date(currentHourGMT3);
    
    // Converter para UTC: adicionar 3 horas
    const lastFullHourStartUTC = new Date(lastFullHourStartGMT3.getTime() + GMT3_OFFSET_MS);
    const lastFullHourEndUTC = new Date(lastFullHourEndGMT3.getTime() + GMT3_OFFSET_MS);
    const nowUTC = now;

    console.log('[hourly-payment-report] Time ranges (GMT-3):', {
      nowGMT3: nowGMT3.toISOString(),
      todayStartGMT3: todayStartGMT3.toISOString(),
      lastFullHourStartGMT3: lastFullHourStartGMT3.toISOString(),
      lastFullHourEndGMT3: lastFullHourEndGMT3.toISOString()
    });
    console.log('[hourly-payment-report] Time ranges (UTC for DB):', {
      todayStartUTC: todayStartUTC.toISOString(),
      nowUTC: nowUTC.toISOString(),
      lastFullHourStartUTC: lastFullHourStartUTC.toISOString(),
      lastFullHourEndUTC: lastFullHourEndUTC.toISOString()
    });

    // 1. Fetch all approved payments from today
    // Use created_at because if status is 'approved' and created today, it was approved today
    const { data: todayPayments, error: todayPaymentsError } = await supabase
      .from('payments')
      .select('payment_id, amount, test_id, user_email, created_at')
      .eq('status', 'approved')
      .gte('created_at', todayStartUTC.toISOString())
      .lte('created_at', nowUTC.toISOString())
      .order('created_at', { ascending: false });

    if (todayPaymentsError) {
      console.error('[hourly-payment-report] Error fetching today payments:', todayPaymentsError);
      throw new Error(`Failed to fetch today payments: ${todayPaymentsError.message}`);
    }

    // Remove duplicates by payment_id (in case there are any)
    const uniquePayments = Array.from(
      new Map((todayPayments || []).map(p => [p.payment_id, p])).values()
    );

    // 2. Calculate today's totals (using unique payments)
    const todayRevenue = uniquePayments.reduce((sum, payment) => {
      const amount = typeof payment.amount === 'number' 
        ? payment.amount 
        : parseFloat(String(payment.amount || '0'));
      return sum + amount;
    }, 0);
    const todayPurchases = uniquePayments.length;

    // 3. Filter payments from last full hour (use created_at - when payment was created/approved)
    const paymentsLastFullHour = uniquePayments.filter(payment => {
      const createdAt = new Date(payment.created_at);
      return createdAt >= lastFullHourStartUTC && createdAt < lastFullHourEndUTC;
    });

    const purchasesLastFullHour = paymentsLastFullHour.length;
    const revenueLastFullHour = paymentsLastFullHour.reduce((sum, payment) => {
      const amount = typeof payment.amount === 'number' 
        ? payment.amount 
        : parseFloat(String(payment.amount || '0'));
      return sum + amount;
    }, 0);

    // 4. Fetch buyer details for payments from last full hour
    const testIds = paymentsLastFullHour
      .map(p => p.test_id)
      .filter(Boolean) as string[];

    let buyersData: Array<{
      name: string | null;
      email: string | null;
      test_id: string;
      amount: number;
      payment_id: string;
    }> = [];

    if (testIds.length > 0) {
      // Fetch test_results data
      const { data: testResults, error: testResultsError } = await supabase
        .from('test_results')
        .select('id, name, email')
        .in('id', testIds);

      if (testResultsError) {
        console.warn('[hourly-payment-report] Error fetching test_results:', testResultsError);
      } else {
        // Combine payment and test_results data
        buyersData = paymentsLastFullHour.map(payment => {
          const testResult = (testResults || []).find(tr => tr.id === payment.test_id);
          const amount = typeof payment.amount === 'number' 
            ? payment.amount 
            : parseFloat(String(payment.amount || '0'));
          
          // Prefer email from test_results, fallback to user_email from payment
          const email = testResult?.email || payment.user_email || null;
          
          return {
            name: testResult?.name || null,
            email: email,
            test_id: payment.test_id,
            amount: amount,
            payment_id: payment.payment_id
          };
        });
      }
    }

    // 5. Compose Message 1: Summary
    const todayRevenueStr = todayRevenue.toFixed(2).replace('.', ',');
    const revenueLastFullHourStr = revenueLastFullHour.toFixed(2).replace('.', ',');
    
    // Format numbers with thousand separators
    const formatNumber = (num: number) => {
      return num.toLocaleString('pt-BR');
    };
    
    // Calculate percentage of today's revenue from last hour (if applicable)
    const hourPercentage = todayRevenue > 0 
      ? ((revenueLastFullHour / todayRevenue) * 100).toFixed(1)
      : '0';
    
    // Calculate average ticket
    const avgTicketToday = todayPurchases > 0 ? (todayRevenue / todayPurchases).toFixed(2).replace('.', ',') : '0,00';
    const avgTicketLastHour = purchasesLastFullHour > 0 ? (revenueLastFullHour / purchasesLastFullHour).toFixed(2).replace('.', ',') : '0,00';
    
    // Get current hour for context (in GMT-3)
    const currentHour = nowGMT3.getUTCHours();
    const lastHourStart = lastFullHourStartGMT3.getUTCHours();
    
    const message1 = `━━━━━━━━━━━━━━━━━\n` +
      `   *📊 RESUMÃO DO QC*\n` +
      `━━━━━━━━━━━━━━━━━\n\n` +
      `📅 *HOJE* (até agora)\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `Faturamento: *R$ ${todayRevenueStr}*\n` +
      `Pagantes: *${formatNumber(todayPurchases)}*\n` +
      `Ticket médio: *R$ ${avgTicketToday}*\n\n` +
      `⏰ *ÚLTIMA HORA*\n` +
      `   (${lastHourStart}h às ${currentHour}h)\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `Faturamento: *R$ ${revenueLastFullHourStr}*\n` +
      `Pagantes: *${formatNumber(purchasesLastFullHour)}*\n` +
      `Ticket médio: *R$ ${avgTicketLastHour}*\n` +
      (revenueLastFullHour > 0 && todayRevenue > 0 ? `📈 ${hourPercentage}% do faturamento do dia\n` : '') +
      `\n_Relatório automático_`;

    // 6. Compose Message 2: Buyer details
    let message2 = `*👥 Assinantes da última hora*\n\n`;

    if (buyersData.length === 0) {
      message2 += 'Nenhuma compra na última hora cheia.';
    } else {
      buyersData.forEach((buyer, index) => {
        const baseUrl = Deno.env.get('PUBLIC_URL') || 'https://qualcarreira.com';
        const resultUrl = `${baseUrl}/resultado/${buyer.test_id}`;
        const amountStr = buyer.amount.toFixed(2);
        
        message2 += `*Compra ${index + 1}:*\n`;
        message2 += `Nome: ${buyer.name || 'N/A'}\n`;
        message2 += `Email: ${buyer.email || 'N/A'}\n`;
        message2 += `Link: ${resultUrl}\n`;
        message2 += `Valor: R$ ${amountStr}\n`;
        
        if (index < buyersData.length - 1) {
          message2 += '\n';
        }
      });
    }

    // 7. Resolve chatId
    const chatId = Deno.env.get('WAAPI_CHAT_ID') || '120363421610156383@g.us';

    // 8. Send Message 1
    console.log('[hourly-payment-report] Sending message 1 (summary)...');
    const waapiResp1 = await fetch('https://waapi.app/api/v1/instances/60123/client/action/send-message', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${waapiToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        message: message1
      })
    });

    let waapiData1: string;
    try {
      waapiData1 = await waapiResp1.text();
    } catch (e) {
      waapiData1 = 'Failed to read response';
    }
    
    console.log('[hourly-payment-report] WAAPI response 1 status:', waapiResp1.status);
    
    // Try to parse as JSON to check if message was actually sent
    let waapiResult1: any = null;
    try {
      waapiResult1 = JSON.parse(waapiData1);
    } catch (e) {
      // Not JSON, that's ok
    }

    // If status is not OK but message might have been sent (check response content)
    if (!waapiResp1.ok) {
      // If the error message says "API not available" but we got a response, 
      // the message might have been sent anyway - log warning but continue
      if (waapiData1.includes('API not available') || waapiData1.includes('try again later')) {
        console.warn('[hourly-payment-report] WAAPI returned error but message might have been sent:', waapiData1);
        // Continue anyway - don't fail the function
      } else {
        console.error('[hourly-payment-report] WAAPI error on message 1:', waapiData1);
        return new Response(JSON.stringify({
          error: 'Failed to send summary message',
          status: waapiResp1.status,
          body: waapiData1
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // 9. Wait 5 seconds before sending message 2
    console.log('[hourly-payment-report] Waiting 5 seconds before sending message 2...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 10. Send Message 2
    console.log('[hourly-payment-report] Sending message 2 (buyers)...');
    const waapiResp2 = await fetch('https://waapi.app/api/v1/instances/60123/client/action/send-message', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${waapiToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        message: message2
      })
    });

    let waapiData2: string;
    try {
      waapiData2 = await waapiResp2.text();
    } catch (e) {
      waapiData2 = 'Failed to read response';
    }
    
    console.log('[hourly-payment-report] WAAPI response 2 status:', waapiResp2.status);

    // If status is not OK but message might have been sent
    if (!waapiResp2.ok) {
      // If the error message says "API not available" but we got a response, 
      // the message might have been sent anyway - log warning but continue
      if (waapiData2.includes('API not available') || waapiData2.includes('try again later')) {
        console.warn('[hourly-payment-report] WAAPI returned error but message 2 might have been sent:', waapiData2);
        // Continue anyway - don't fail the function
      } else {
        console.error('[hourly-payment-report] WAAPI error on message 2:', waapiData2);
        return new Response(JSON.stringify({
          error: 'Failed to send buyers message',
          status: waapiResp2.status,
          body: waapiData2,
          message1_sent: true
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // 11. Return success
    return new Response(JSON.stringify({
      ok: true,
      messages_sent: 2,
      summary: {
        today_revenue: todayRevenue,
        today_purchases: todayPurchases,
        revenue_last_full_hour: revenueLastFullHour,
        purchases_last_full_hour: purchasesLastFullHour
      },
      buyers_count: buyersData.length
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[hourly-payment-report] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: msg
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

