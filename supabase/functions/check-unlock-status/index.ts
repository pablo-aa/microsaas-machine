// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { test_id } = await req.json();

    console.log('[check-unlock-status] Request received for test_id:', test_id);

    if (!test_id) {
      console.log('[check-unlock-status] No test_id provided');
      return new Response(JSON.stringify({
        is_approved: false,
        payment_id: null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 1: Check if there's an approved payment in DB (fast path)
    const { data: payment, error } = await supabase
      .from('payments')
      .select('payment_id, status, test_id')
      .eq('test_id', test_id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[check-unlock-status] Error querying approved payment:', error);
    }

    if (payment) {
      console.log('[check-unlock-status] ✅ Found approved payment in DB:', payment.payment_id);
      return new Response(JSON.stringify({
        is_approved: true,
        payment_id: payment.payment_id,
        test_id: payment.test_id,
        source: 'database'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // STEP 2: FALLBACK - Check pending payments with Mercado Pago
    console.log('[check-unlock-status] No approved payment in DB, checking pending payments...');

    const { data: pendingPayments, error: pendingError } = await supabase
      .from('payments')
      .select('payment_id, status, test_id, created_at')
      .eq('test_id', test_id)
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Only payments <24h
      .order('created_at', { ascending: false })
      .limit(5); // Limit to last 5 pending payments

    if (pendingError) {
      console.error('[check-unlock-status] Error querying pending payments:', pendingError);
      return new Response(JSON.stringify({
        is_approved: false,
        payment_id: null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      console.log('[check-unlock-status] No pending payments found');
      return new Response(JSON.stringify({
        is_approved: false,
        payment_id: null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[check-unlock-status] Found ${pendingPayments.length} pending payment(s), syncing with MP...`);

    const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mpToken) {
      console.warn('[check-unlock-status] MERCADOPAGO_ACCESS_TOKEN not configured, cannot sync with MP');
      return new Response(JSON.stringify({
        is_approved: false,
        payment_id: null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check each pending payment with Mercado Pago
    for (const pmt of pendingPayments) {
      try {
        console.log(`[check-unlock-status] Checking MP status for payment: ${pmt.payment_id}`);
        
        const mpResp = await fetch(
          `https://api.mercadopago.com/v1/payments/${pmt.payment_id}`,
          { headers: { 'Authorization': `Bearer ${mpToken}` } }
        );

        if (!mpResp.ok) {
          console.warn(`[check-unlock-status] MP API error (${mpResp.status}) for payment ${pmt.payment_id}`);
          continue; // Try next payment
        }

        const mpData = await mpResp.json();
        console.log(`[check-unlock-status] MP status for ${pmt.payment_id}: ${mpData.status}`);

        // Update DB if status changed
        if (mpData.status !== pmt.status) {
          console.log(`[check-unlock-status] Updating payment ${pmt.payment_id}: ${pmt.status} → ${mpData.status}`);
          
          await supabase
            .from('payments')
            .update({
              status: mpData.status,
              updated_at: new Date().toISOString()
            })
            .eq('payment_id', pmt.payment_id);

          // If approved, return immediately
          if (mpData.status === 'approved') {
            console.log(`[check-unlock-status] ✅ Found approved payment via MP fallback: ${pmt.payment_id}`);
            return new Response(JSON.stringify({
              is_approved: true,
              payment_id: pmt.payment_id,
              test_id: pmt.test_id,
              source: 'mercadopago_fallback'
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (err) {
        console.error(`[check-unlock-status] Error checking payment ${pmt.payment_id}:`, err);
        // Continue to next payment
      }
    }

    // No approved payment found after checking all pending
    console.log('[check-unlock-status] No approved payments found after MP sync');
    return new Response(JSON.stringify({
      is_approved: false,
      payment_id: null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[check-unlock-status] Unexpected error:', error);
    
    // Even on error, return 200 with is_approved: false
    return new Response(JSON.stringify({
      is_approved: false,
      payment_id: null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

