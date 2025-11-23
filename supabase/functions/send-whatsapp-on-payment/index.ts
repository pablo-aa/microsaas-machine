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
    const { data: paymentRow, error: paymentRowError } = await supabase.from('payments').select('test_id, user_email, amount, status, whatsapp_notified_at').eq('payment_id', paymentId).maybeSingle();
    if (paymentRowError) {
      console.warn('[send-whatsapp-on-payment] Error fetching payment row:', paymentRowError);
    }
    // Check if already notified (idempotency - early check for already processed)
    if (paymentRow?.whatsapp_notified_at) {
      console.log('[send-whatsapp-on-payment] Already notified at:', paymentRow.whatsapp_notified_at);
      return new Response(JSON.stringify({
        ok: true,
        skipped: true,
        reason: 'already_notified',
        notified_at: paymentRow.whatsapp_notified_at
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
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
    
    // Validate that we have payment data before proceeding
    if (!paymentRow) {
      console.error('[send-whatsapp-on-payment] Payment not found in database for payment_id:', paymentId);
      return new Response(JSON.stringify({
        error: 'Payment not found in database',
        payment_id: paymentId
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Try to mark as "in processing" (atomic idempotency check)
    // This UPDATE is atomic - only one request can successfully mark it
    const { data: updateResult, error: updateError } = await supabase
      .from('payments')
      .update({ whatsapp_notified_at: new Date().toISOString() })
      .eq('payment_id', paymentId)
      .is('whatsapp_notified_at', null)
      .select();
    
    if (updateError) {
      console.error('[send-whatsapp-on-payment] Error marking as notified:', updateError);
      return new Response(JSON.stringify({
        error: 'Failed to mark payment as notified',
        details: updateError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // If no rows were affected, another request is already processing this payment
    if (!updateResult || updateResult.length === 0) {
      console.log('[send-whatsapp-on-payment] Another request is already processing this payment');
      return new Response(JSON.stringify({
        ok: true,
        skipped: true,
        reason: 'already_processing'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // This request won the race condition - continue with processing
    console.log('[send-whatsapp-on-payment] Successfully marked as processing, continuing with WhatsApp send');
    
    // Fetch user info from test_results (name, email) - only now that we know we'll send
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
    
    // Send purchase confirmation email to user
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && paymentRow?.test_id) {
      try {
        const emailToUse = dbEmail ?? paymentRow?.user_email ?? mpEmail ?? '';
        if (emailToUse) {
          // Function to escape HTML (reuse pattern from send-recovery-email)
          function escapeHtml(s = '') {
            return s.replace(/[&<>"']/g, (c) => ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#39;'
            })[c]);
          }
          
          const baseUrl = Deno.env.get('PUBLIC_URL') || 'https://qualcarreira.com';
          const resultUrl = `${baseUrl}/resultado/${encodeURIComponent(paymentRow.test_id)}`;
          const userNameEscaped = escapeHtml((userName || 'Olá').trim());
          
          const emailSubject = 'Seu resultado está pronto!';
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p>Olá ${userNameEscaped},</p>
              <p>Seu pagamento foi aprovado com sucesso! 🎉</p>
              <p>Agora você pode acessar seu perfil vocacional completo e todas as recomendações personalizadas.</p>
              <p style="margin: 30px 0;">
                <a href="${resultUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Acessar meus resultados
                </a>
              </p>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="color: #666; word-break: break-all;">${resultUrl}</p>
              <p>Abraços,<br>Equipe Qual Carreira</p>
            </div>
          `;
          
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: 'Qual Carreira <contato@qualcarreira.com>',
              to: emailToUse,
              subject: emailSubject,
              html: emailHtml
            })
          });
          
          const emailResult = await emailResponse.json();
          if (emailResponse.ok) {
            console.log('[send-whatsapp-on-payment] Purchase confirmation email sent successfully to:', emailToUse);
          } else {
            console.warn('[send-whatsapp-on-payment] Failed to send purchase confirmation email:', emailResult);
          }
        }
      } catch (emailError) {
        // Don't fail the whole process if email fails
        console.warn('[send-whatsapp-on-payment] Error sending purchase confirmation email:', emailError);
      }
    } else {
      if (!resendApiKey) {
        console.warn('[send-whatsapp-on-payment] RESEND_API_KEY not configured; skipping purchase confirmation email');
      }
    }
    
    // Send Google Analytics 4 conversion event via Measurement Protocol
    const ga4MeasurementId = Deno.env.get('GA4_MEASUREMENT_ID');
    const ga4ApiSecret = Deno.env.get('GA4_API_SECRET');
    
    if (ga4MeasurementId && ga4ApiSecret) {
      try {
        const ga4Payload = {
          client_id: paymentId, // Use payment_id as client_id for uniqueness
          events: [{
            name: 'purchase',
            params: {
              transaction_id: paymentId,
              value: typeof mpAmount === 'number' ? mpAmount : parseFloat(String(mpAmount || '0')),
              currency: 'BRL',
              payment_type: 'pix',
              items: [{
                item_id: 'qualcarreira_full_analysis',
                item_name: 'Análise Vocacional Completa',
                price: typeof mpAmount === 'number' ? mpAmount : parseFloat(String(mpAmount || '0')),
                quantity: 1,
                item_category: 'Digital Product'
              }]
            }
          }]
        };
        
        const ga4Url = `https://www.google-analytics.com/mp/collect?measurement_id=${ga4MeasurementId}&api_secret=${ga4ApiSecret}`;
        const ga4Response = await fetch(ga4Url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ga4Payload)
        });
        
        if (ga4Response.ok) {
          console.log('[send-whatsapp-on-payment] GA4 conversion event sent successfully');
        } else {
          const ga4ErrorText = await ga4Response.text();
          console.warn('[send-whatsapp-on-payment] GA4 conversion event failed:', ga4Response.status, ga4ErrorText);
        }
      } catch (ga4Error) {
        // Don't fail the whole process if GA4 fails
        console.warn('[send-whatsapp-on-payment] Error sending GA4 conversion event:', ga4Error);
      }
    } else {
      console.warn('[send-whatsapp-on-payment] GA4_MEASUREMENT_ID or GA4_API_SECRET not configured; skipping conversion tracking');
    }
    
    // Compose WhatsApp message (prefer DB values and requested format)
    const amountStr = typeof mpAmount === 'number' ? mpAmount.toFixed(2) : String(mpAmount ?? '');
    const emailToUse = dbEmail ?? paymentRow?.user_email ?? mpEmail ?? '';
    const title = '*Novo Pagante 🤑*';
    const message = `${title}\n\n` + `ID: ${paymentId}\n` + 'Link do teste:\n' + `qualcarreira.com/resultado/${paymentRow?.test_id ?? ''}\n` + `Nome: ${userName ?? ''}\n` + `Email: ${emailToUse}\n` + `\nValor: R$ *${amountStr}*`;
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
      // Note: whatsapp_notified_at is already marked, so we won't retry on next webhook
      // This prevents spam of retry attempts
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
    // WhatsApp sent successfully
    // Note: whatsapp_notified_at was already marked before sending (atomic check above)
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
