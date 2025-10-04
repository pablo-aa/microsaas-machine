import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get result_id and payment_id from request body
    const { result_id: resultId, payment_id: paymentId } = await req.json();

    console.log(`[unlock-result] Request received:`, { resultId, paymentId });

    // Validate inputs
    if (!resultId) {
      console.error('[unlock-result] Missing result_id');
      return new Response(
        JSON.stringify({ error: 'Missing result_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!paymentId) {
      console.error('[unlock-result] Missing payment_id');
      return new Response(
        JSON.stringify({ error: 'Missing payment_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verify the result exists
    const { data: result, error: resultError } = await supabase
      .from('test_results')
      .select('id, is_unlocked, email')
      .eq('id', resultId)
      .single();

    if (resultError || !result) {
      console.error('[unlock-result] Result not found:', resultError);
      return new Response(
        JSON.stringify({ error: 'Result not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[unlock-result] Found result:`, { 
      resultId: result.id, 
      isUnlocked: result.is_unlocked,
      email: result.email 
    });

    // 2. Check if already unlocked
    if (result.is_unlocked) {
      console.log('[unlock-result] Result already unlocked');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Result already unlocked',
          is_unlocked: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify payment status by calling check-payment-status function
    console.log(`[unlock-result] Checking payment status for payment_id: ${paymentId}`);
    
    const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
      'check-payment-status',
      {
        body: { payment_id: paymentId }
      }
    );

    if (paymentError) {
      console.error('[unlock-result] Error checking payment status:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[unlock-result] Payment status response:`, paymentData);

    // 4. Check if payment is approved
    if (paymentData.status !== 'approved') {
      console.log('[unlock-result] Payment not approved:', paymentData.status);
      return new Response(
        JSON.stringify({ 
          error: 'Payment not approved',
          payment_status: paymentData.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Update test_results to unlock
    console.log(`[unlock-result] Payment approved, unlocking result ${resultId}`);
    
    const { error: updateError } = await supabase
      .from('test_results')
      .update({ 
        is_unlocked: true,
        unlocked_at: new Date().toISOString()
      })
      .eq('id', resultId);

    if (updateError) {
      console.error('[unlock-result] Error updating result:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to unlock result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[unlock-result] Successfully unlocked result ${resultId}`);

    // 6. Return success
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Result successfully unlocked',
        is_unlocked: true,
        unlocked_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[unlock-result] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
