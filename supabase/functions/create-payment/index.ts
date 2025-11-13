// @ts-nocheck
// Este arquivo roda em Deno (Supabase Edge Functions). A diretiva acima
// suprime verificações locais do TypeScript que não reconhecem imports remotos
// e o objeto global Deno no editor, evitando falsos positivos de diagnóstico.
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
    const { test_id, email, name, reuse_only } = await req.json();
    console.log('Creating payment for:', {
      test_id,
      email,
      name,
      reuse_only
    });
    if (!test_id || !email) {
      throw new Error('test_id and email are required');
    }
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN is not configured in environment variables');
      throw new Error('Payment service not configured. Please contact support.');
    }
    console.log('Access token found:', accessToken.substring(0, 10) + '...');
    // Detect amount based on origin (prod vs dev)
    const origin = req.headers.get('origin') || '';
    const isProd = origin.includes('qualcarreira.com');
    const transactionAmount = isProd ? 12.90 : 12.90;
    // Initialize Supabase client (used for reuse logic and saving records)
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Try to reuse an existing payment for this test/email to avoid duplicates
    const { data: existingPayment, error: existingError } = await supabase.from('payments').select('*').eq('test_id', test_id).eq('user_email', email).in('status', [
      'pending',
      'approved'
    ]).order('created_at', {
      ascending: false
    }).limit(1).maybeSingle();
    if (existingError) {
      console.error('Error checking existing payment:', existingError);
    }
    if (existingPayment) {
      console.log('Reusing existing payment:', existingPayment.payment_id, existingPayment.status);
      // If already approved, return immediately (frontend will attempt unlock)
      if (existingPayment.status === 'approved') {
        return new Response(JSON.stringify({
          payment_id: existingPayment.payment_id,
          qr_code: null,
          qr_code_base64: null,
          ticket_url: null,
          status: 'approved'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      }
      // Pending payment: reuse only if amount matches current price
      if (existingPayment.status === 'pending') {
        const existingAmount = Number(existingPayment.amount);
        if (Number.isFinite(existingAmount) && existingAmount === transactionAmount) {
          try {
            console.log('Fetching existing payment details from MP:', existingPayment.payment_id);
            const mpGetResponse = await fetch(`https://api.mercadopago.com/v1/payments/${existingPayment.payment_id}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            const mpGetData = await mpGetResponse.json();
            console.log('MP GET status:', mpGetResponse.status);
            if (!mpGetResponse.ok) {
              console.error('Mercado Pago GET error:', JSON.stringify(mpGetData, null, 2));
              // Fall through to creating a new payment if reuse_only is not enforced
              if (reuse_only) {
                return new Response(JSON.stringify({
                  error: 'Failed to fetch existing payment details'
                }), {
                  headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                  },
                  status: 500
                });
              }
            // continua para criar novo
            } else {
              const mpStatus = String(mpGetData.status || '').toLowerCase();
              const createdAt = existingPayment.created_at ? new Date(existingPayment.created_at).getTime() : 0;
              const olderThan24h = createdAt ? Date.now() - createdAt > 24 * 60 * 60 * 1000 : false;
              // Se o MP marcou como aprovado, retornamos aprovado
              if (mpStatus === 'approved') {
                return new Response(JSON.stringify({
                  payment_id: mpGetData.id,
                  qr_code: null,
                  qr_code_base64: null,
                  ticket_url: null,
                  status: 'approved'
                }), {
                  headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                  },
                  status: 200
                });
              }
              // Reusar somente se <24h e ainda pending/in_process
              if (!olderThan24h && (mpStatus === 'pending' || mpStatus === 'in_process')) {
                return new Response(JSON.stringify({
                  payment_id: mpGetData.id,
                  qr_code: mpGetData.point_of_interaction?.transaction_data?.qr_code,
                  qr_code_base64: mpGetData.point_of_interaction?.transaction_data?.qr_code_base64,
                  ticket_url: mpGetData.point_of_interaction?.transaction_data?.ticket_url,
                  status: mpStatus
                }), {
                  headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                  },
                  status: 200
                });
              }
              // Caso contrário (expired, cancelled, rejected, ou >24h), não retorna aqui
              // e segue para criar um novo pagamento
              console.log('Existing payment not reusable (status:', mpStatus, 'olderThan24h:', olderThan24h, '). Creating a new one.');
            }
          } catch (e) {
            console.error('Error fetching existing payment from MP:', e);
            if (reuse_only) {
              return new Response(JSON.stringify({
                error: 'Error fetching existing payment from MP'
              }), {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                },
                status: 500
              });
            }
          // continua para criar novo
          }
        } else {
          console.log('Skipping reuse. Existing pending amount', existingAmount, 'differs from current', transactionAmount);
          // If reuse_only, do not create new here; let caller handle fallback
          if (reuse_only) {
            return new Response(JSON.stringify({
              error: 'Existing pending payment amount mismatch'
            }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 404
            });
          }
        // Otherwise, fall through to creation below
        }
      }
    } else if (reuse_only) {
      // No existing payment and reuse_only requested: do not create a new one
      return new Response(JSON.stringify({
        error: 'No existing payment found'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 404
      });
    }
    // Criar pagamento PIX no Mercado Pago
    const paymentPayload = {
      transaction_amount: transactionAmount,
      description: 'Qual Carreira - Análise Completa de Perfil Vocacional',
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: name || 'Usuário'
      }
    };
    console.log('Sending payment request to Mercado Pago...');
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${test_id}-${Date.now()}`
      },
      body: JSON.stringify(paymentPayload)
    });
    const mpData = await mpResponse.json();
    console.log('Mercado Pago response status:', mpResponse.status);
    console.log('Mercado Pago response data:', JSON.stringify(mpData).substring(0, 200));
    if (!mpResponse.ok) {
      console.error('Mercado Pago error response:', JSON.stringify(mpData, null, 2));
      // Mensagens de erro mais amigáveis
      let errorMessage = 'Erro ao criar pagamento. ';
      if (mpData.message) {
        errorMessage += mpData.message;
      } else if (mpData.cause && mpData.cause.length > 0) {
        errorMessage += mpData.cause[0].description || 'Erro desconhecido';
      } else {
        errorMessage += 'Por favor, tente novamente ou contate o suporte.';
      }
      throw new Error(errorMessage);
    }
    console.log('Payment created successfully:', mpData.id);
    // Salvar pagamento no banco de dados
    const { error: dbError } = await supabase.from('payments').insert({
      test_id,
      user_email: email,
      payment_id: mpData.id.toString(),
      amount: transactionAmount,
      status: mpData.status,
      payment_method: 'pix'
    });
    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
    // Retornar dados do QR Code
    return new Response(JSON.stringify({
      payment_id: mpData.id,
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url,
      status: mpData.status
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in create-payment function:', error);
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
