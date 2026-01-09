import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper function to determine report scenario based on current hour in GMT-3
function determineReportScenario(nowGMT3: Date): 'madrugada' | 'dia_completo_2h' | 'ultimas_2h_anterior' {
  const hour = nowGMT3.getUTCHours();
  
  if (hour === 8) return 'madrugada';
  if (hour === 0) return 'ultimas_2h_anterior';
  if (hour >= 10 && hour <= 22 && hour % 2 === 0) return 'dia_completo_2h';
  
  // If not a valid schedule time, throw error
  throw new Error(`Horário inválido para relatório: ${hour}h GMT-3. Horários válidos: 0h, 8h, 10h, 12h, 14h, 16h, 18h, 20h, 22h`);
}

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
    
    if (!supabaseUrl || !serviceKey) {
      console.error('[hourly-payment-report] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({
        error: 'Supabase configuration missing'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    const supabase = createClient(supabaseUrl, serviceKey);

    // Work with GMT-3 timezone
    // GMT-3 is 3 hours BEHIND UTC
    // If it's 13h31 in GMT-3, in UTC it's 16h31 (13h31 + 3h = 16h31)
    
    const now = new Date(); // Current UTC time from server
    const GMT3_OFFSET_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    
    // To get current time in GMT-3: subtract 3 hours from UTC
    // Example: 16h31 UTC - 3h = 13h31 GMT-3
    const nowGMT3 = new Date(now.getTime() - GMT3_OFFSET_MS);
    const nowUTC = now;
    
    // Determine scenario based on current hour in GMT-3
    const scenario = determineReportScenario(nowGMT3);
    const currentHourGMT3 = nowGMT3.getUTCHours();
    
    console.log('[hourly-payment-report] Scenario detected:', scenario);
    console.log('[hourly-payment-report] Current hour GMT-3:', currentHourGMT3);
    
    // Variables to store period ranges
    let periodStartUTC: Date;
    let periodEndUTC: Date;
    let todayStartUTC: Date | null = null;
    let yesterdayEndUTC: Date | null = null; // For ultimas_2h_anterior scenario
    let periodLabel: string;
    let periodSubLabel: string = '';
    
    // Calculate periods based on scenario
    if (scenario === 'madrugada') {
      // Scenario 8h: Madrugada (00h00 until 07h59 of same day)
      const madrugadaStartGMT3 = new Date(nowGMT3);
      madrugadaStartGMT3.setUTCHours(0, 0, 0, 0); // 00h00
      
      const madrugadaEndGMT3 = new Date(nowGMT3);
      madrugadaEndGMT3.setUTCHours(7, 59, 59, 999); // 07h59:59.999
      
      // Convert to UTC: add 3 hours
      periodStartUTC = new Date(madrugadaStartGMT3.getTime() + GMT3_OFFSET_MS);
      periodEndUTC = new Date(madrugadaEndGMT3.getTime() + GMT3_OFFSET_MS);
      
      periodLabel = 'MADRUGADA';
      periodSubLabel = '(00h-07h59)';
      
      console.log('[hourly-payment-report] Madrugada period GMT-3:', {
        start: madrugadaStartGMT3.toISOString(),
        end: madrugadaEndGMT3.toISOString()
      });
      
    } else if (scenario === 'ultimas_2h_anterior') {
      // Scenario 00h: Last 2 hours of previous day (22h00-23h59) + FULL DAY TOTAL (fechamento do dia)
      // CRITICAL: Must get previous day, not current day
      // Use setTime to subtract 24 hours to get previous day (more reliable than setUTCDate)
      const yesterdayGMT3 = new Date(nowGMT3.getTime() - (24 * 60 * 60 * 1000));
      
      // Full day of previous day: 00h00-23h59
      const yesterdayStartGMT3 = new Date(yesterdayGMT3);
      yesterdayStartGMT3.setUTCHours(0, 0, 0, 0); // 00h00 of previous day
      
      const yesterdayEndGMT3 = new Date(yesterdayGMT3);
      yesterdayEndGMT3.setUTCHours(23, 59, 59, 999); // 23h59:59.999 of previous day
      
      // Last 2 hours: 22h00-23h59 of previous day
      const last2hStartGMT3 = new Date(yesterdayGMT3);
      last2hStartGMT3.setUTCHours(22, 0, 0, 0); // 22h00 of previous day
      
      const last2hEndGMT3 = new Date(yesterdayGMT3);
      last2hEndGMT3.setUTCHours(23, 59, 59, 999); // 23h59:59.999 of previous day
      
      // Convert to UTC: add 3 hours
      // For period (last 2h)
      periodStartUTC = new Date(last2hStartGMT3.getTime() + GMT3_OFFSET_MS);
      periodEndUTC = new Date(last2hEndGMT3.getTime() + GMT3_OFFSET_MS);
      
      // For full day (fechamento)
      const yesterdayStartUTC = new Date(yesterdayStartGMT3.getTime() + GMT3_OFFSET_MS);
      yesterdayEndUTC = new Date(yesterdayEndGMT3.getTime() + GMT3_OFFSET_MS);
      
      // Store yesterday dates for later use
      todayStartUTC = yesterdayStartUTC; // Reuse variable name for consistency
      
      periodLabel = 'FECHAMENTO DO DIA ANTERIOR';
      periodSubLabel = '(00h-23h59) + ÚLTIMAS 2 HORAS (22h-23h59)';
      
      console.log('[hourly-payment-report] Previous day full period GMT-3:', {
        dayStart: yesterdayStartGMT3.toISOString(),
        dayEnd: yesterdayEndGMT3.toISOString(),
        last2hStart: last2hStartGMT3.toISOString(),
        last2hEnd: last2hEndGMT3.toISOString()
      });
      
      // EXTRA VALIDATION: Ensure we're not in the future
      // At 00h GMT-3, periodEndUTC should be before nowUTC
      if (periodEndUTC >= nowUTC) {
        throw new Error(`CRÍTICO: Tentativa de buscar dados futuros às 00h. periodEndUTC: ${periodEndUTC.toISOString()}, nowUTC: ${nowUTC.toISOString()}`);
      }
      
    } else if (scenario === 'dia_completo_2h') {
      // Scenario 10h-22h: Full day (since 00h) + last 2 hours
      // Today start: 00h00 GMT-3
      const todayStartGMT3 = new Date(nowGMT3);
      todayStartGMT3.setUTCHours(0, 0, 0, 0);
      todayStartUTC = new Date(todayStartGMT3.getTime() + GMT3_OFFSET_MS);
      
      // Last 2 hours: (current hour - 2h) until current hour
      // Example: if now is 12h01, period is 10h00-12h00 (last full hour was 11h-12h)
      // So we need: start = (current hour - 2)h00, end = current hour 00h00
      const last2hStartGMT3 = new Date(nowGMT3);
      last2hStartGMT3.setUTCHours(currentHourGMT3 - 2, 0, 0, 0);
      
      const last2hEndGMT3 = new Date(nowGMT3);
      last2hEndGMT3.setUTCHours(currentHourGMT3, 0, 0, 0); // Start of current hour
      
      // Convert to UTC: add 3 hours
      periodStartUTC = new Date(last2hStartGMT3.getTime() + GMT3_OFFSET_MS);
      periodEndUTC = new Date(last2hEndGMT3.getTime() + GMT3_OFFSET_MS);
      
      periodLabel = 'HOJE';
      periodSubLabel = `(até agora) + ÚLTIMAS 2 HORAS (${currentHourGMT3 - 2}h-${currentHourGMT3}h)`;
      
      console.log('[hourly-payment-report] Full day + last 2h GMT-3:', {
        todayStart: todayStartGMT3.toISOString(),
        last2hStart: last2hStartGMT3.toISOString(),
        last2hEnd: last2hEndGMT3.toISOString()
      });
    } else {
      throw new Error(`Cenário inválido: ${scenario}`);
    }
    
    // CRITICAL: Validate that we're not fetching future data
    if (periodEndUTC > nowUTC) {
      throw new Error(`Tentativa de buscar dados futuros detectada. periodEndUTC: ${periodEndUTC.toISOString()}, nowUTC: ${nowUTC.toISOString()}`);
    }
    
    console.log('[hourly-payment-report] Period UTC (for DB query):', {
      start: periodStartUTC.toISOString(),
      end: periodEndUTC.toISOString()
    });
    
    // Fetch approved payments for the period
    let periodPayments: any[] = [];
    let todayPayments: any[] = [];
    
    if (scenario === 'ultimas_2h_anterior' && todayStartUTC && yesterdayEndUTC) {
      // Fetch full day payments of previous day (fechamento)
      // Use <= to include payments up to the last second of the day
      const { data: yesterdayData, error: yesterdayError } = await supabase
        .from('payments')
        .select('payment_id, amount, test_id, user_email, created_at')
        .eq('status', 'approved')
        .gte('created_at', todayStartUTC.toISOString())
        .lte('created_at', yesterdayEndUTC.toISOString())
        .order('created_at', { ascending: false });
      
      if (yesterdayError) {
        console.error('[hourly-payment-report] Error fetching yesterday payments:', yesterdayError);
        throw new Error(`Failed to fetch yesterday payments: ${yesterdayError.message}`);
      }
      
      todayPayments = yesterdayData || [];
      
      // Fetch last 2 hours payments
      // Use < for exclusive end (periodEndUTC is start of current hour, so we want < to exclude it)
      const { data: periodData, error: periodError } = await supabase
        .from('payments')
        .select('payment_id, amount, test_id, user_email, created_at')
        .eq('status', 'approved')
        .gte('created_at', periodStartUTC.toISOString())
        .lt('created_at', periodEndUTC.toISOString())
        .order('created_at', { ascending: false });
      
      if (periodError) {
        console.error('[hourly-payment-report] Error fetching period payments:', periodError);
        throw new Error(`Failed to fetch period payments: ${periodError.message}`);
      }
      
      periodPayments = periodData || [];
      
    } else if (scenario === 'dia_completo_2h' && todayStartUTC) {
      // Fetch full day payments
      const { data: todayData, error: todayError } = await supabase
        .from('payments')
        .select('payment_id, amount, test_id, user_email, created_at')
        .eq('status', 'approved')
        .gte('created_at', todayStartUTC.toISOString())
        .lte('created_at', nowUTC.toISOString())
        .order('created_at', { ascending: false });
      
      if (todayError) {
        console.error('[hourly-payment-report] Error fetching today payments:', todayError);
        throw new Error(`Failed to fetch today payments: ${todayError.message}`);
      }
      
      todayPayments = todayData || [];
      
      // Fetch last 2 hours payments
      // Use < for exclusive end (periodEndUTC is start of current hour, so we want < to exclude it)
      // This ensures we only get payments from the last full 2-hour period
      const { data: periodData, error: periodError } = await supabase
        .from('payments')
        .select('payment_id, amount, test_id, user_email, created_at')
        .eq('status', 'approved')
        .gte('created_at', periodStartUTC.toISOString())
        .lt('created_at', periodEndUTC.toISOString())
        .order('created_at', { ascending: false });
      
      if (periodError) {
        console.error('[hourly-payment-report] Error fetching period payments:', periodError);
        throw new Error(`Failed to fetch period payments: ${periodError.message}`);
      }
      
      periodPayments = periodData || [];
    } else {
      // Fetch period payments only (madrugada)
      // For madrugada, periodEndUTC is 07h59:59.999, so use <= to include it
      const { data: periodData, error: periodError } = await supabase
        .from('payments')
        .select('payment_id, amount, test_id, user_email, created_at')
        .eq('status', 'approved')
        .gte('created_at', periodStartUTC.toISOString())
        .lte('created_at', periodEndUTC.toISOString())
        .order('created_at', { ascending: false });
      
      if (periodError) {
        console.error('[hourly-payment-report] Error fetching period payments:', periodError);
        throw new Error(`Failed to fetch period payments: ${periodError.message}`);
      }
      
      periodPayments = periodData || [];
    }
    
    // Remove duplicates by payment_id
    const uniquePeriodPayments = Array.from(
      new Map(periodPayments.map(p => [p.payment_id, p])).values()
    );
    
    const uniqueTodayPayments = (scenario === 'dia_completo_2h' || scenario === 'ultimas_2h_anterior')
      ? Array.from(new Map(todayPayments.map(p => [p.payment_id, p])).values())
      : [];
    
    // Calculate totals
    const periodRevenue = uniquePeriodPayments.reduce((sum, payment) => {
      const amount = typeof payment.amount === 'number' 
        ? payment.amount 
        : parseFloat(String(payment.amount || '0'));
      return sum + amount;
    }, 0);
    
    const periodPurchases = uniquePeriodPayments.length;
    
    const todayRevenue = (scenario === 'dia_completo_2h' || scenario === 'ultimas_2h_anterior')
      ? uniqueTodayPayments.reduce((sum, payment) => {
          const amount = typeof payment.amount === 'number' 
            ? payment.amount 
            : parseFloat(String(payment.amount || '0'));
          return sum + amount;
        }, 0)
      : 0;
    
    const todayPurchases = (scenario === 'dia_completo_2h' || scenario === 'ultimas_2h_anterior') 
      ? uniqueTodayPayments.length 
      : 0;
    
    // Calculate average tickets
    const avgTicketPeriod = periodPurchases > 0 
      ? (periodRevenue / periodPurchases).toFixed(2).replace('.', ',') 
      : '0,00';
    
    const avgTicketToday = todayPurchases > 0 
      ? (todayRevenue / todayPurchases).toFixed(2).replace('.', ',') 
      : '0,00';
    
    // Calculate percentage (for dia_completo_2h and ultimas_2h_anterior scenarios)
    const periodPercentage = (scenario === 'dia_completo_2h' || scenario === 'ultimas_2h_anterior') && todayRevenue > 0
      ? ((periodRevenue / todayRevenue) * 100).toFixed(1)
      : '0';
    
    // Format numbers
    const formatNumber = (num: number) => {
      return num.toLocaleString('pt-BR');
    };
    
    const periodRevenueStr = periodRevenue.toFixed(2).replace('.', ',');
    const todayRevenueStr = todayRevenue.toFixed(2).replace('.', ',');
    
    // Compose Message 1: Summary
    let message1 = `━━━━━━━━━━━━━━━━━\n` +
      `   *📊 RESUMÃO DO QC*\n` +
      `━━━━━━━━━━━━━━━━━\n\n`;
    
    if (scenario === 'madrugada') {
      message1 += `🌙 *${periodLabel}* ${periodSubLabel}\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `Faturamento: *R$ ${periodRevenueStr}*\n` +
        `Pagantes: *${formatNumber(periodPurchases)}*\n` +
        `Ticket médio: *R$ ${avgTicketPeriod}*\n` +
        `\n_Relatório automático_`;
        
    } else if (scenario === 'ultimas_2h_anterior') {
      message1 += `📅 *${periodLabel}*\n` +
        `   ${periodSubLabel.split(' + ')[0]}\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `Faturamento: *R$ ${todayRevenueStr}*\n` +
        `Pagantes: *${formatNumber(todayPurchases)}*\n` +
        `Ticket médio: *R$ ${avgTicketToday}*\n\n` +
        `⏰ ${periodSubLabel.split(' + ')[1]}\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `Faturamento: *R$ ${periodRevenueStr}*\n` +
        `Pagantes: *${formatNumber(periodPurchases)}*\n` +
        `Ticket médio: *R$ ${avgTicketPeriod}*\n` +
        (periodRevenue > 0 && todayRevenue > 0 ? `📈 ${periodPercentage}% do faturamento do dia\n` : '') +
        `\n_Relatório automático_`;
        
    } else if (scenario === 'dia_completo_2h') {
      message1 += `📅 *${periodLabel}* ${periodSubLabel.split(' + ')[0]}\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `Faturamento: *R$ ${todayRevenueStr}*\n` +
        `Pagantes: *${formatNumber(todayPurchases)}*\n` +
        `Ticket médio: *R$ ${avgTicketToday}*\n\n` +
        `⏰ ${periodSubLabel.split(' + ')[1]}\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `Faturamento: *R$ ${periodRevenueStr}*\n` +
        `Pagantes: *${formatNumber(periodPurchases)}*\n` +
        `Ticket médio: *R$ ${avgTicketPeriod}*\n` +
        (periodRevenue > 0 && todayRevenue > 0 ? `📈 ${periodPercentage}% do faturamento do dia\n` : '') +
        `\n_Relatório automático_`;
    }
    
    // Fetch buyer details for period payments
    const testIds = uniquePeriodPayments
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
      const { data: testResults, error: testResultsError } = await supabase
        .from('test_results')
        .select('id, name, email')
        .in('id', testIds);
      
      if (testResultsError) {
        console.warn('[hourly-payment-report] Error fetching test_results:', testResultsError);
      } else {
        buyersData = uniquePeriodPayments.map(payment => {
          const testResult = (testResults || []).find(tr => tr.id === payment.test_id);
          const amount = typeof payment.amount === 'number' 
            ? payment.amount 
            : parseFloat(String(payment.amount || '0'));
          
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
    
    // Compose Message 2: Buyer details
    let message2Title = '';
    if (scenario === 'madrugada') {
      message2Title = '*👥 Assinantes da madrugada*\n\n';
    } else if (scenario === 'ultimas_2h_anterior') {
      message2Title = '*👥 Assinantes das últimas 2h (dia anterior)*\n\n';
    } else {
      message2Title = '*👥 Assinantes das últimas 2 horas*\n\n';
    }
    
    let message2 = message2Title;
    
    if (buyersData.length === 0) {
      if (scenario === 'madrugada') {
        message2 += 'Nenhuma compra na madrugada.';
      } else if (scenario === 'ultimas_2h_anterior') {
        message2 += 'Nenhuma compra nas últimas 2 horas do dia anterior.';
      } else {
        message2 += 'Nenhuma compra nas últimas 2 horas.';
      }
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
    
    // Resolve chatId
    const chatId = Deno.env.get('WAAPI_CHAT_ID') || '120363421610156383@g.us';
    
    // Send Message 1
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
    
    if (!waapiResp1.ok) {
      if (waapiData1.includes('API not available') || waapiData1.includes('try again later')) {
        console.warn('[hourly-payment-report] WAAPI returned error but message might have been sent:', waapiData1);
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
    
    // Wait 5 seconds before sending message 2
    console.log('[hourly-payment-report] Waiting 5 seconds before sending message 2...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Send Message 2
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
    
    if (!waapiResp2.ok) {
      if (waapiData2.includes('API not available') || waapiData2.includes('try again later')) {
        console.warn('[hourly-payment-report] WAAPI returned error but message 2 might have been sent:', waapiData2);
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
    
    // Return success
    return new Response(JSON.stringify({
      ok: true,
      messages_sent: 2,
      scenario: scenario,
      summary: {
        period_revenue: periodRevenue,
        period_purchases: periodPurchases,
        today_revenue: (scenario === 'dia_completo_2h' || scenario === 'ultimas_2h_anterior') ? todayRevenue : null,
        today_purchases: (scenario === 'dia_completo_2h' || scenario === 'ultimas_2h_anterior') ? todayPurchases : null
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
