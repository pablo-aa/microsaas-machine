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

    if (!test_id) {
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

    // Check if there's an approved payment for this test
    const { data: payment, error } = await supabase
      .from('payments')
      .select('payment_id, status, test_id')
      .eq('test_id', test_id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[check-unlock-status] Error querying payment:', error);
    }

    // Always return 200, never error
    return new Response(JSON.stringify({
      is_approved: !!payment,
      payment_id: payment?.payment_id || null,
      test_id: payment?.test_id || null
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

