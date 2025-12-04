// Supabase Edge Function: apply-retroactive-discount
// Purpose: Apply discount coupon to existing test/payment retroactively
// Author: QC Admin Panel

import { createClient } from "jsr:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BASE_PRICE = parseFloat(Deno.env.get("BASE_PRICE") || "12.90");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { test_id, coupon_code } = await req.json();

    console.log("[apply-retroactive-discount] Request:", { test_id, coupon_code });

    // Validate inputs
    if (!test_id || !coupon_code) {
      return new Response(
        JSON.stringify({ error: "test_id e coupon_code são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Validate coupon
    const { data: coupon, error: couponError } = await supabase
      .from("discount_coupons")
      .select("*")
      .ilike("code", coupon_code.trim())
      .single();

    if (couponError || !coupon) {
      console.error("[apply-retroactive-discount] Coupon not found:", coupon_code);
      return new Response(
        JSON.stringify({ error: "Cupom não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!coupon.is_active) {
      return new Response(
        JSON.stringify({ error: "Cupom não está ativo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
      return new Response(
        JSON.stringify({ error: "Cupom expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ error: "Cupom atingiu o limite de usos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Find test_result - try by id first, then by session_id
    let testResult = null;
    
    // Try finding by id (most common - used in payments.test_id)
    const { data: testById } = await supabase
      .from("test_results")
      .select("*")
      .eq("id", test_id)
      .maybeSingle();
    
    if (testById) {
      testResult = testById;
      console.log("[apply-retroactive-discount] Test found by id");
    } else {
      // Try finding by session_id
      const { data: testBySessionId } = await supabase
        .from("test_results")
        .select("*")
        .eq("session_id", test_id)
        .maybeSingle();
      
      if (testBySessionId) {
        testResult = testBySessionId;
        console.log("[apply-retroactive-discount] Test found by session_id");
      }
    }

    if (!testResult) {
      console.error("[apply-retroactive-discount] Test not found:", test_id);
      return new Response(
        JSON.stringify({ error: "Teste não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if test already has payments (can be multiple)
    // Use testResult.id as the canonical test_id for payments table
    const canonicalTestId = testResult.id;
    
    const { data: existingPayments } = await supabase
      .from("payments")
      .select("*")
      .eq("test_id", canonicalTestId)
      .order("created_at", { ascending: false }); // Most recent first
    
    const existingPayment = existingPayments && existingPayments.length > 0 
      ? existingPayments[0] 
      : null;

    // Calculate new amount
    const originalAmount = BASE_PRICE;
    const newAmount = BASE_PRICE * (1 - coupon.discount_percentage / 100);

    console.log("[apply-retroactive-discount] Amounts:", {
      original: originalAmount,
      new: newAmount,
      discount: coupon.discount_percentage
    });

    let paymentId = null;

    // 4a. If payments exist, update ALL of them
    if (existingPayments && existingPayments.length > 0) {
      console.log("[apply-retroactive-discount] Found", existingPayments.length, "payment(s)");
      
      // Check if ANY already has a coupon
      const paymentWithCoupon = existingPayments.find(p => p.coupon_code);
      if (paymentWithCoupon) {
        // If it's the SAME coupon, just return success (already applied)
        if (paymentWithCoupon.coupon_code === coupon.code) {
          console.log("[apply-retroactive-discount] Coupon already applied, returning success");
          return new Response(
            JSON.stringify({
              success: true,
              test_id: canonicalTestId,
              session_id: testResult.session_id,
              payment_id: paymentWithCoupon.payment_id,
              payments_updated: 0,
              coupon_code: coupon.code,
              discount_percentage: coupon.discount_percentage,
              original_amount: originalAmount,
              final_amount: newAmount,
              message: `Cupom ${coupon.code} já estava aplicado!`,
              already_applied: true
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // If it's a DIFFERENT coupon, allow replacing it
        console.log("[apply-retroactive-discount] Replacing coupon", paymentWithCoupon.coupon_code, "with", coupon.code);
        
        // Decrement old coupon usage
        await supabase.rpc("decrement_coupon_usage", { 
          p_coupon_code: paymentWithCoupon.coupon_code 
        });
      }

      // Update ALL payments with the new coupon
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          coupon_code: coupon.code,
          original_amount: originalAmount,
          amount: newAmount,
          updated_at: new Date().toISOString()
        })
        .eq("test_id", canonicalTestId); // Update all payments for this test

      if (updateError) {
        console.error("[apply-retroactive-discount] Error updating payments:", updateError);
        throw new Error("Erro ao atualizar pagamentos");
      }

      console.log("[apply-retroactive-discount] Updated", existingPayments.length, "payment(s)");
      paymentId = existingPayment.payment_id;

    // 4b. If no payment, create one with coupon
    } else {
      console.log("[apply-retroactive-discount] Creating new payment with discount");
      
      const newPaymentId = `RETROACTIVE_${crypto.randomUUID()}`;
      
      const { error: insertError } = await supabase
        .from("payments")
        .insert({
          test_id: canonicalTestId,
          user_email: testResult.email,
          payment_id: newPaymentId,
          amount: newAmount,
          original_amount: originalAmount,
          coupon_code: coupon.code,
          status: "approved",
          payment_method: "retroactive_discount"
        });

      if (insertError) {
        console.error("[apply-retroactive-discount] Error creating payment:", insertError);
        throw new Error("Erro ao criar pagamento com desconto");
      }

      paymentId = newPaymentId;
    }

    // 5. Increment coupon usage atomically
    const { data: incrementSuccess, error: incrementError } = await supabase
      .rpc("increment_coupon_usage", { p_coupon_code: coupon.code });

    if (incrementError || !incrementSuccess) {
      console.warn("[apply-retroactive-discount] Warning: could not increment coupon uses:", incrementError);
      // Don't fail the whole operation if increment fails
    }

    // 6. Success response
    const paymentsCount = existingPayments ? existingPayments.length : 1;
    return new Response(
      JSON.stringify({
        success: true,
        test_id: canonicalTestId,
        session_id: testResult.session_id,
        payment_id: paymentId,
        payments_updated: paymentsCount,
        coupon_code: coupon.code,
        discount_percentage: coupon.discount_percentage,
        original_amount: originalAmount,
        final_amount: newAmount,
        message: `Desconto de ${coupon.discount_percentage}% aplicado a ${paymentsCount} pagamento(s)!`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[apply-retroactive-discount] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

