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

const getPriceByVariant = (variant: string | null): number => {
  switch (variant) {
    case 'A': return 9.90;
    case 'B': return 12.90;
    case 'C': return 14.90;
    default: return 9.90; // Default para A (9.90)
  }
};

serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const {
      test_id,
      email,
      name,
      coupon_code,
      ga_client_id,
      ga_session_id,
      ga_session_number,
      payment_variant
    } = await req.json();
    console.log('Creating payment for:', {
      test_id,
      email,
      name,
      coupon_code,
      ga_client_id,
      ga_session_id,
      ga_session_number,
      payment_variant
    });
    if (!test_id || !email) {
      throw new Error('test_id and email are required');
    }

    // Initialize Supabase client (needed for blacklist check)
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // 🚨 EMERGENCY RATE LIMITING: Blacklist de emails em loop
    const BLACKLISTED_EMAILS = [
      'deborhasuellen@gmail.com',
      // Adicionar outros emails problemáticos aqui se necessário
    ];

    const emailLower = email.toLowerCase().trim();
    if (BLACKLISTED_EMAILS.includes(emailLower)) {
      console.warn('[RATE LIMIT] ⚠️ Blacklisted email attempted payment:', emailLower, 'test_id:', test_id);
      
      // Retornar último payment pending/approved existente
      const { data: lastPayment, error: lastPaymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', email)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastPayment) {
        console.log('[RATE LIMIT] ✅ Returning existing payment:', lastPayment.payment_id, 'status:', lastPayment.status);
        return new Response(JSON.stringify({
          payment_id: lastPayment.payment_id,
          qr_code: lastPayment.qr_code || null,
          qr_code_base64: lastPayment.qr_code_base64 || null,
          ticket_url: lastPayment.ticket_url || null,
          status: lastPayment.status
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      // Se não há payment, retornar erro
      console.error('[RATE LIMIT] ❌ No existing payment found for blacklisted email');
      return new Response(JSON.stringify({
        error: 'Limite de requisições excedido. Aguarde alguns minutos e recarregue a página.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429 // Too Many Requests
      });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('MERCADOPAGO_ACCESS_TOKEN is not configured in environment variables');
      throw new Error('Payment service not configured. Please contact support.');
    }
    console.log('Access token found:', accessToken.substring(0, 10) + '...');
    // Get base price based on variant
    const BASE_PRICE = getPriceByVariant(payment_variant);
    console.log('[create-payment] Base price:', BASE_PRICE, 'for variant:', payment_variant);
    let transactionAmount = BASE_PRICE;
    let validatedCoupon = null;
    let originalAmount = null;
    
    // Validate and apply coupon if provided
    if (coupon_code) {
      console.log('[create-payment] Validating coupon:', coupon_code);
      const { data: coupon, error: couponError } = await supabase
        .from('discount_coupons')
        .select('*')
        .ilike('code', coupon_code.trim())
        .single();
      
      if (couponError || !coupon) {
        console.error('[create-payment] Invalid coupon:', coupon_code);
        throw new Error('Cupom inválido');
      }
      
      if (!coupon.is_active) {
        throw new Error('Cupom não está ativo');
      }
      
      if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
        throw new Error('Cupom expirado');
      }
      
      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        throw new Error('Cupom atingiu o limite de usos');
      }
      
      validatedCoupon = coupon;
      originalAmount = BASE_PRICE;
      // Round to 2 decimal places for Mercado Pago compatibility
      transactionAmount = parseFloat((BASE_PRICE * (1 - coupon.discount_percentage / 100)).toFixed(2));
      
      console.log('[create-payment] Coupon applied:', {
        code: coupon.code,
        discount: coupon.discount_percentage,
        original: originalAmount,
        final: transactionAmount
      });
      
      // Handle 100% discount (FREE)
      if (coupon.discount_percentage >= 100) {
        console.log('[create-payment] FREE payment (100% discount)');
        const freePaymentId = 'FREE_' + crypto.randomUUID();
        
        // Atomic increment
        const { data: incrementSuccess, error: incrementError } = await supabase
          .rpc('increment_coupon_usage', { p_coupon_code: coupon.code });
        
        if (incrementError || !incrementSuccess) {
          console.error('[create-payment] Error incrementing coupon uses:', incrementError);
          throw new Error('Cupom atingiu o limite de usos ou erro ao aplicar');
        }
        
        // Create FREE payment record
        const { error: paymentError } = await supabase.from('payments').insert({
          test_id,
          user_email: email,
          payment_id: freePaymentId,
          amount: 0.00,
          original_amount: originalAmount,
          status: 'approved',
          payment_method: 'coupon',
          coupon_code: coupon.code,
          ga_client_id: ga_client_id ?? null,
          ga_session_id: ga_session_id ?? null,
          ga_session_number: ga_session_number ?? null,
          payment_variant: payment_variant ?? 'A'
        });
        
        if (paymentError) {
          console.error('[create-payment] Error creating FREE payment:', paymentError);
          throw new Error('Erro ao criar pagamento gratuito');
        }
        
        return new Response(JSON.stringify({
          status: 'free',
          payment_id: freePaymentId,
          discount: 100,
          qr_code: null,
          qr_code_base64: null,
          ticket_url: null
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      }
    }
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
        const existingVariant = existingPayment.payment_variant;
        
        // Only reuse if both price AND variant match
        if (Number.isFinite(existingAmount) && existingAmount === transactionAmount && existingVariant === payment_variant) {
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
              // Fall through to creating a new payment
              console.log('Cannot fetch existing payment from MP, will create new one');
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

          // If we have GA identifiers or payment_variant now but record is missing, update it
          if (ga_client_id || ga_session_id || typeof ga_session_number !== 'undefined' || payment_variant) {
            const updatePayload: Record<string, unknown> = {};
            if (ga_client_id && !existingPayment.ga_client_id) updatePayload.ga_client_id = ga_client_id;
            if (ga_session_id && !existingPayment.ga_session_id) updatePayload.ga_session_id = ga_session_id;
            if (typeof ga_session_number !== 'undefined' && existingPayment.ga_session_number == null) {
              updatePayload.ga_session_number = ga_session_number;
            }
            if (payment_variant && !existingPayment.payment_variant) {
              updatePayload.payment_variant = payment_variant;
            }
            if (Object.keys(updatePayload).length > 0) {
              await supabase.from('payments').update(updatePayload).eq('id', existingPayment.id);
            }
          }
          } catch (e) {
            console.error('Error fetching existing payment from MP:', e);
            console.log('Will create new payment due to error');
          // continua para criar novo
          }
        } else {
          console.log('Skipping reuse. Price or variant changed:', {
            existing: { amount: existingAmount, variant: existingVariant },
            current: { amount: transactionAmount, variant: payment_variant }
          });
          console.log('Will create new payment with updated price/variant');
        // Fall through to creation below
        }
      }
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
    
    // Atomic increment of coupon usage if coupon was used
    if (validatedCoupon) {
      const { data: incrementSuccess, error: incrementError } = await supabase
        .rpc('increment_coupon_usage', { p_coupon_code: validatedCoupon.code });
      
      if (incrementError || !incrementSuccess) {
        console.warn('[create-payment] Warning: could not increment coupon uses:', incrementError);
      }
    }
    
    // Salvar pagamento no banco de dados
    const insertPayload: Record<string, unknown> = {
      test_id,
      user_email: email,
      payment_id: mpData.id.toString(),
      amount: transactionAmount,
      original_amount: originalAmount,
      coupon_code: validatedCoupon?.code ?? null,
      status: mpData.status,
      payment_method: 'pix',
      ga_client_id: ga_client_id ?? null,
      ga_session_id: ga_session_id ?? null,
      ga_session_number: ga_session_number ?? null,
      payment_variant: payment_variant ?? 'A'
    };
    const { error: dbError } = await supabase.from('payments').insert(insertPayload);
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
