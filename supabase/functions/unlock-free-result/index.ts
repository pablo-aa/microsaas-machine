// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const getPriceByVariant = (variant: string | null): number => {
  switch (variant) {
    case 'B': return 9.90;
    case 'C': return 14.90;
    default: return parseFloat(Deno.env.get('BASE_PRICE') || '12.90');
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { test_id: testId, coupon_code: couponCode, payment_variant } = await req.json();

    console.log('[unlock-free-result] Request:', { testId, couponCode, payment_variant });

    if (!testId || !couponCode) {
      return new Response(JSON.stringify({
        error: 'test_id and coupon_code are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const BASE_PRICE = getPriceByVariant(payment_variant);
    console.log('[unlock-free-result] Base price:', BASE_PRICE, 'for variant:', payment_variant);

    // 1. Check if test result exists
    const { data: testResult, error: testError } = await supabase
      .from('test_results')
      .select('id, is_unlocked, name, email, expires_at')
      .eq('id', testId)
      .single();

    if (testError || !testResult) {
      console.error('[unlock-free-result] Test result not found:', testId);
      return new Response(JSON.stringify({
        error: 'Test result not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if expired
    if (testResult.expires_at) {
      const expiresAt = new Date(testResult.expires_at);
      if (new Date() > expiresAt) {
        console.error('[unlock-free-result] Test result expired:', testId);
        return new Response(JSON.stringify({
          error: 'Test result has expired'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. IDEMPOTENCY: Check if already unlocked
    if (testResult.is_unlocked) {
      console.log('[unlock-free-result] Already unlocked, returning success');
      return new Response(JSON.stringify({
        success: true,
        message: 'Result already unlocked',
        is_unlocked: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. IDEMPOTENCY: Check if payment already exists for this test
    const { data: existingPayment, error: paymentError } = await supabase
      .from('payments')
      .select('payment_id, status')
      .eq('test_id', testId)
      .eq('status', 'approved')
      .maybeSingle();

    if (!paymentError && existingPayment) {
      console.log('[unlock-free-result] Payment already exists:', existingPayment.payment_id);
      
      // Unlock if not already unlocked
      if (!testResult.is_unlocked) {
        await supabase
          .from('test_results')
          .update({
            is_unlocked: true,
            unlocked_at: new Date().toISOString()
          })
          .eq('id', testId);
      }

      // Trigger notifications
      try {
        await supabase.functions.invoke('send-whatsapp-on-payment', {
          body: { id: existingPayment.payment_id }
        });
      } catch (e) {
        console.warn('[unlock-free-result] Error invoking send-whatsapp:', e);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Result unlocked with existing payment',
        payment_id: existingPayment.payment_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Validate coupon = 100%
    const { data: coupon, error: couponError } = await supabase
      .from('discount_coupons')
      .select('*')
      .ilike('code', couponCode.trim())
      .single();

    if (couponError || !coupon) {
      console.error('[unlock-free-result] Coupon not found:', couponCode);
      return new Response(JSON.stringify({
        error: 'Invalid coupon code'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!coupon.is_active) {
      console.error('[unlock-free-result] Coupon inactive:', couponCode);
      return new Response(JSON.stringify({
        error: 'Coupon is not active'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
      console.error('[unlock-free-result] Coupon expired:', couponCode);
      return new Response(JSON.stringify({
        error: 'Coupon has expired'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (coupon.discount_percentage < 100) {
      console.error('[unlock-free-result] Coupon is not 100%:', coupon.discount_percentage);
      return new Response(JSON.stringify({
        error: 'This coupon is not for free access'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      console.error('[unlock-free-result] Max uses reached:', couponCode);
      return new Response(JSON.stringify({
        error: 'Coupon has reached maximum uses'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Generate FREE payment ID
    const freePaymentId = 'FREE_' + crypto.randomUUID();
    console.log('[unlock-free-result] Creating FREE payment:', freePaymentId);

    // 6. Atomic increment of current_uses
    const { data: incrementSuccess, error: incrementError } = await supabase
      .rpc('increment_coupon_usage', { p_coupon_code: coupon.code });

    if (incrementError || !incrementSuccess) {
      console.error('[unlock-free-result] Error incrementing uses:', incrementError);
      return new Response(JSON.stringify({
        error: 'Cupom atingiu o limite de usos ou erro ao aplicar'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 7. Create FREE payment record
    const { error: paymentInsertError } = await supabase
      .from('payments')
      .insert({
        test_id: testId,
        user_email: testResult.email,
        payment_id: freePaymentId,
        amount: 0.00,
        original_amount: BASE_PRICE,
        status: 'approved',
        payment_method: 'coupon',
        coupon_code: coupon.code,
        payment_variant: payment_variant || 'A'
      });

    if (paymentInsertError) {
      console.error('[unlock-free-result] Error creating payment:', paymentInsertError);
      return new Response(JSON.stringify({
        error: 'Failed to create payment record'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 8. Unlock the result
    const { error: unlockError } = await supabase
      .from('test_results')
      .update({
        is_unlocked: true,
        unlocked_at: new Date().toISOString()
      })
      .eq('id', testId);

    if (unlockError) {
      console.error('[unlock-free-result] Error unlocking result:', unlockError);
      return new Response(JSON.stringify({
        error: 'Failed to unlock result'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[unlock-free-result] Result unlocked successfully');

    // 9. Trigger notifications (email, WhatsApp, GA4)
    try {
      console.log('[unlock-free-result] Invoking send-whatsapp-on-payment...');
      await supabase.functions.invoke('send-whatsapp-on-payment', {
        body: { id: freePaymentId }
      });
      console.log('[unlock-free-result] Notifications triggered');
    } catch (notificationError) {
      // Don't fail the request if notifications fail
      console.warn('[unlock-free-result] Error triggering notifications:', notificationError);
    }

    // 10. Return success
    return new Response(JSON.stringify({
      success: true,
      message: 'Result unlocked successfully',
      payment_id: freePaymentId,
      is_unlocked: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[unlock-free-result] Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

