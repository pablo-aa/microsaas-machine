import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const waapiToken = Deno.env.get('WAAPI_TOKEN');
    if (!waapiToken) {
      console.error('[send-whatsapp-on-payment] Missing WAAPI_TOKEN env');
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
    // Try to extract payment id from querystring or body
    const url = new URL(req.url);
    const queryId = url.searchParams.get('id');
    const queryTopic = url.searchParams.get('topic') || url.searchParams.get('type');
    let body = null;
    try {
      // Mercado Pago may send an empty body with query params; handle gracefully
      body = await req.json().catch(()=>null);
    } catch (_) {
      body = null;
    }
    const bodyId = body?.data?.id ?? body?.id;
    const eventType = body?.type ?? queryTopic ?? 'unknown';
    const paymentId = (queryId ?? bodyId)?.toString();
    if (!paymentId) {
      console.error('[send-whatsapp-on-payment] No payment id found in webhook');
      return new Response(JSON.stringify({
        error: 'Missing payment id'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('[send-whatsapp-on-payment] Webhook received:', {
      eventType,
      paymentId,
      queryId,
      bodyId
    });
    // Initialize Supabase client (to read context from payments table)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);
    // Fetch stored payment context (email, test_id, amount)
    const { data: paymentRow, error: paymentRowError } = await supabase.from('payments').select('test_id, user_email, amount, status').eq('payment_id', paymentId).maybeSingle();
    if (paymentRowError) {
      console.warn('[send-whatsapp-on-payment] Error fetching payment row:', paymentRowError);
    }
    // Fetch user info from test_results (name, email)
    let userName;
    let dbEmail;
    if (paymentRow?.test_id) {
      const { data: resultRow, error: resultRowError } = await supabase.from('test_results').select('name, email').eq('id', paymentRow.test_id).maybeSingle();
      if (resultRowError) {
        console.warn('[send-whatsapp-on-payment] Error fetching test_results row:', resultRowError);
      }
      if (resultRow) {
        userName = resultRow.name;
        dbEmail = resultRow.email;
      }
    }
    // Optionally verify status on Mercado Pago and only notify on approved
    const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    let mpStatus = paymentRow?.status;
    let mpAmount = paymentRow?.amount;
    let mpEmail = undefined;
    if (mpToken) {
      try {
        const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpToken}`
          }
        });
        const mpData = await mpResp.json();
        console.log('[send-whatsapp-on-payment] MP status:', mpResp.status, mpData?.status);
        if (mpResp.ok) {
          mpStatus = mpData?.status ?? mpStatus;
          mpAmount = mpData?.transaction_amount ?? mpAmount;
          mpEmail = mpData?.payer?.email ?? mpEmail;
        }
      } catch (e) {
        console.warn('[send-whatsapp-on-payment] Error querying Mercado Pago:', e);
      }
    } else {
      console.warn('[send-whatsapp-on-payment] MERCADOPAGO_ACCESS_TOKEN not set; skipping status verification');
    }
    // Only notify on approved payments
    if (mpStatus !== 'approved') {
      console.log('[send-whatsapp-on-payment] Skipping WhatsApp notify: status is not approved', {
        status: mpStatus
      });
      return new Response(JSON.stringify({
        ok: true,
        skipped: true,
        reason: 'not_approved',
        status: mpStatus
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Compose WhatsApp message (prefer DB values and requested format)
    const amountStr = typeof mpAmount === 'number' ? mpAmount.toFixed(2) : String(mpAmount ?? '');
    const emailToUse = dbEmail ?? paymentRow?.user_email ?? mpEmail ?? '';
    const title = 'Atualização de Pagamento';
    const message = `${title}\n\n` + `ID: ${paymentId}\n` + `Resultado/Teste: ${paymentRow?.test_id ?? ''}\n` + `Nome: ${userName ?? ''}\n` + `Email: ${emailToUse}\n` + `Valor: R$ ${amountStr}`;
    // Resolve chatId: prefer env WAAPI_CHAT_ID; fallback to sample group id provided
    const chatId = Deno.env.get('WAAPI_CHAT_ID') || '120363421610156383@g.us';
    // Send message via WAAPI
    const waapiResp = await fetch('https://waapi.app/api/v1/instances/60123/client/action/send-message', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${waapiToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        chatId,
        message
      })
    });
    const waapiData = await waapiResp.text();
    console.log('[send-whatsapp-on-payment] WAAPI response status:', waapiResp.status);
    if (!waapiResp.ok) {
      console.error('[send-whatsapp-on-payment] WAAPI error:', waapiData);
      return new Response(JSON.stringify({
        error: 'Failed to send WhatsApp message',
        status: waapiResp.status,
        body: waapiData
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      ok: true,
      message_sent: true,
      chatId,
      status: mpStatus
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[send-whatsapp-on-payment] Error:', error);
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
