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
    const { test_id, email, name } = await req.json();
    
    console.log('Creating payment for:', { test_id, email, name });

    if (!test_id || !email) {
      throw new Error('test_id and email are required');
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }

    // Criar pagamento PIX no Mercado Pago
    const paymentPayload = {
      transaction_amount: 12.90,
      description: 'Carrerium - Análise Completa de Perfil Vocacional',
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: name || 'Usuário',
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-payment-webhook`,
    };

    console.log('Sending payment request to Mercado Pago...');

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${test_id}-${Date.now()}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const mpData = await mpResponse.json();
    
    console.log('Mercado Pago response status:', mpResponse.status);
    
    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      throw new Error(`Mercado Pago error: ${JSON.stringify(mpData)}`);
    }

    console.log('Payment created successfully:', mpData.id);

    // Salvar pagamento no banco de dados
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        test_id,
        user_email: email,
        payment_id: mpData.id.toString(),
        amount: 12.90,
        status: mpData.status,
        payment_method: 'pix',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Retornar dados do QR Code
    return new Response(
      JSON.stringify({
        payment_id: mpData.id,
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
        status: mpData.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-payment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
