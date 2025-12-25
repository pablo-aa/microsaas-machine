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
    const { code, payment_variant } = await req.json();

    console.log('[validate-coupon] Validating coupon:', code, 'variant:', payment_variant);

    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({
        valid: false,
        reason: 'invalid_code'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get base price based on variant
    const BASE_PRICE = getPriceByVariant(payment_variant);
    console.log('[validate-coupon] Base price:', BASE_PRICE, 'for variant:', payment_variant);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for coupon (case-insensitive)
    const { data: coupon, error: couponError } = await supabase
      .from('discount_coupons')
      .select('*')
      .ilike('code', code.trim())
      .single();

    if (couponError || !coupon) {
      console.log('[validate-coupon] Coupon not found:', code);
      return new Response(JSON.stringify({
        valid: false,
        reason: 'invalid_code',
        original_price: BASE_PRICE,
        final_price: BASE_PRICE
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      console.log('[validate-coupon] Coupon inactive:', code);
      return new Response(JSON.stringify({
        valid: false,
        reason: 'inactive',
        original_price: BASE_PRICE,
        final_price: BASE_PRICE
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if coupon has expired
    if (coupon.expires_at) {
      const expiresAt = new Date(coupon.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        console.log('[validate-coupon] Coupon expired:', code, 'expired at:', expiresAt);
        return new Response(JSON.stringify({
          valid: false,
          reason: 'expired',
          original_price: BASE_PRICE,
          final_price: BASE_PRICE
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if max uses has been reached
    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      console.log('[validate-coupon] Max uses reached:', code, 'current:', coupon.current_uses, 'max:', coupon.max_uses);
      return new Response(JSON.stringify({
        valid: false,
        reason: 'max_uses_reached',
        original_price: BASE_PRICE,
        final_price: BASE_PRICE
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate final price
    const discountPercentage = coupon.discount_percentage;
    const finalPrice = BASE_PRICE * (1 - discountPercentage / 100);

    console.log('[validate-coupon] Coupon valid:', {
      code: coupon.code,
      discount: discountPercentage,
      original: BASE_PRICE,
      final: finalPrice
    });

    // Return validation result
    return new Response(JSON.stringify({
      valid: true,
      code: coupon.code,
      discount_percentage: discountPercentage,
      description: coupon.description,
      original_price: BASE_PRICE,
      final_price: parseFloat(finalPrice.toFixed(2))
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[validate-coupon] Error:', error);
    const BASE_PRICE = getPriceByVariant(null);
    return new Response(JSON.stringify({
      valid: false,
      reason: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      original_price: BASE_PRICE,
      final_price: BASE_PRICE
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

