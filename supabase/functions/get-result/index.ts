import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get result_id from request body
    const { result_id: resultId } = await req.json();

    if (!resultId) {
      return new Response(
        JSON.stringify({ error: 'Missing result_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching result for ID:', resultId);

    // Fetch test result
    const { data: result, error: resultError } = await supabaseClient
      .from('test_results')
      .select('*')
      .eq('id', resultId)
      .maybeSingle();

    if (resultError) {
      console.error('Error fetching test result:', resultError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch test result', details: resultError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result) {
      console.log('Result not found for ID:', resultId);
      return new Response(
        JSON.stringify({ error: 'Result not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if result has expired
    const expiresAt = new Date(result.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      console.log('Result expired:', resultId);
      return new Response(
        JSON.stringify({ error: 'Result has expired', expired: true }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Result fetched successfully:', {
      id: result.id,
      name: result.name,
      is_unlocked: result.is_unlocked
    });

    // Return result data
    return new Response(
      JSON.stringify({
        id: result.id,
        session_id: result.session_id,
        name: result.name,
        email: result.email,
        age: result.age,
        riasec_scores: result.riasec_scores,
        gardner_scores: result.gardner_scores,
        gopc_scores: result.gopc_scores,
        is_unlocked: result.is_unlocked,
        unlocked_at: result.unlocked_at,
        created_at: result.created_at,
        expires_at: result.expires_at,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-result function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
