import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Get environment variables
    const pushoverUserKey = Deno.env.get('PUSHOVER_USER_KEY');
    const pushoverApiToken = Deno.env.get('PUSHOVER_API_TOKEN');
    
    // Debug logging
    console.log('[test-pushover] PUSHOVER_USER_KEY exists:', !!pushoverUserKey);
    console.log('[test-pushover] PUSHOVER_USER_KEY length:', pushoverUserKey?.length || 0);
    console.log('[test-pushover] PUSHOVER_API_TOKEN exists:', !!pushoverApiToken);
    console.log('[test-pushover] PUSHOVER_API_TOKEN length:', pushoverApiToken?.length || 0);

    if (!pushoverUserKey || !pushoverApiToken) {
      return new Response(JSON.stringify({
        error: 'PUSHOVER_USER_KEY or PUSHOVER_API_TOKEN not configured',
        userKey: !!pushoverUserKey,
        apiToken: !!pushoverApiToken,
        userKeyLength: pushoverUserKey?.length || 0,
        apiTokenLength: pushoverApiToken?.length || 0,
        hint: 'Check if variable names match exactly (case-sensitive). You may need to redeploy the function after adding environment variables.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Static test message
    const pushoverPayload = {
      token: pushoverApiToken,
      user: pushoverUserKey,
      message: 'Esta é uma notificação de teste do Pushover! 🧪\n\nSe você recebeu isso, o Pushover está funcionando corretamente.',
      title: 'Teste Pushover - Qual Carreira',
      priority: 1, // Normal priority
      sound: 'cashregister' // Optional: cash register sound
    };

    console.log('[test-pushover] Sending test notification to Pushover...');
    
    const pushoverResponse = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pushoverPayload)
    });

    const pushoverResult = await pushoverResponse.json();
    
    console.log('[test-pushover] Pushover response status:', pushoverResponse.status);
    console.log('[test-pushover] Pushover response:', pushoverResult);

    if (pushoverResponse.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Pushover notification sent successfully',
        pushover_response: pushoverResult
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send Pushover notification',
        pushover_response: pushoverResult,
        status: pushoverResponse.status
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('[test-pushover] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
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

