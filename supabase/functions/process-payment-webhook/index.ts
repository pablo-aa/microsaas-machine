import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Parse payment id from query or JSON body (Mercado Pago may send different shapes)
    let paymentId: string | null =
      url.searchParams.get('id') ||
      url.searchParams.get('payment_id') ||
      null;

    if (!paymentId) {
      try {
        const body = await req.json();
        paymentId = body?.data?.id?.toString() || body?.id?.toString() || body?.resource?.id?.toString() || null;
      } catch (_) {
        // ignore - some webhooks send no body
      }
    }

    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'payment_id missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('[webhook] Received notification for payment:', paymentId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find payment record
    const { data: payment, error: dbErr } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (dbErr) {
      console.error('[webhook] Database error fetching payment:', dbErr);
      return new Response(JSON.stringify({ error: dbErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!payment) {
      console.warn('[webhook] Payment record not found for id:', paymentId);
      return new Response(JSON.stringify({ error: 'payment not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('[webhook] MERCADOPAGO_ACCESS_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'payment service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Confirm status with Mercado Pago
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpResp.ok) {
      console.error('[webhook] Mercado Pago fetch error:', mpResp.status);
      return new Response(JSON.stringify({ error: `Mercado Pago error: ${mpResp.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const mpData = await mpResp.json();
    console.log('[webhook] Mercado Pago status:', mpData.status);

    // Update payment status if changed
    if (mpData.status !== payment.status) {
      await supabase
        .from('payments')
        .update({ status: mpData.status, updated_at: new Date().toISOString() })
        .eq('payment_id', paymentId);
    }

    // Unlock test results when approved
    if (mpData.status === 'approved') {
      console.log('[webhook] Approving and unlocking test:', payment.test_id);
      await supabase
        .from('test_results')
        .update({ unlocked_at: new Date().toISOString(), payment_id: paymentId })
        .eq('id', payment.test_id);
    }

    return new Response(JSON.stringify({ ok: true, status: mpData.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[webhook] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});