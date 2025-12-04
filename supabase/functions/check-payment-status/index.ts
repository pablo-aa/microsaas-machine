import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const url = new URL(req.url);
    let payment_id = url.searchParams.get('payment_id');
    if (!payment_id && req.method !== 'GET') {
      const body = await req.json().catch(()=>null);
      if (body?.payment_id != null) {
        payment_id = String(body.payment_id);
      }
    }
    if (!payment_id) {
      throw new Error('payment_id is required');
    }
    console.log('Checking payment status for:', payment_id);
    
    // Initialize Supabase client
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    
    // Handle FREE_ payments (100% discount coupons) - don't query MercadoPago
    if (payment_id.startsWith('FREE_')) {
      console.log('[check-payment-status] FREE payment detected, checking local DB only');
      const { data: freePayment, error: freeError } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_id', payment_id)
        .single();
      
      if (freeError || !freePayment) {
        console.error('[check-payment-status] FREE payment not found:', payment_id);
        throw new Error('Payment not found');
      }
      
      return new Response(JSON.stringify({
        status: freePayment.status || 'approved',
        id: payment_id,
        test_id: freePayment.test_id
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    const { data: payment, error: dbError } = await supabase.from('payments').select('*').eq('payment_id', payment_id).single();
    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
    // Se já está aprovado no banco, retornar imediatamente
    if (payment?.status === 'approved') {
      console.log('Payment already approved in database');
      return new Response(JSON.stringify({
        status: 'approved',
        test_id: payment.test_id
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // Caso contrário, verificar no Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }
    console.log('Checking Mercado Pago API...');
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (!mpResponse.ok) {
      throw new Error(`Mercado Pago error: ${mpResponse.status}`);
    }
    const mpData = await mpResponse.json();
    console.log('Payment status from MP:', mpData.status);
    // Atualizar banco se o status mudou
    if (mpData.status !== payment?.status) {
      console.log('Updating payment status in database:', mpData.status);
      await supabase.from('payments').update({
        status: mpData.status,
        updated_at: new Date().toISOString()
      }).eq('payment_id', payment_id);
      // Se aprovado, atualizar test_results
      if (mpData.status === 'approved') {
        console.log('Payment approved! Unlocking test results for:', payment.test_id);
        await supabase.from('test_results').update({
          unlocked_at: new Date().toISOString(),
          payment_id: payment_id
        }).eq('id', payment.test_id);
      }
    }
    return new Response(JSON.stringify({
      status: mpData.status,
      test_id: payment.test_id
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in check-payment-status function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(JSON.stringify({
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
