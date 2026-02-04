import { pushToDataLayer } from './gtm';
import { getMercadoPagoConfig } from '@/config/mercadopago';
import { getGaIdentifiers } from './gaCookies';

const MEASUREMENT_ID = 'G-77JYHQR2GR';
const MEASUREMENT_API_SECRET = process.env.NEXT_PUBLIC_GA4_API_SECRET || '';

// ==================== Experiment Events ====================

/**
 * Track experiment exposure (experiment_viewed)
 * Envia DIRETAMENTE para o GA4 via Measurement Protocol (HTTP request)
 * Bypassa GTM completamente.
 */
export const trackExperimentViewed = async (experimentId: string, variationId: number | string) => {
  // Converter para número (consistente com experimento anterior)
  const variationIdNum = typeof variationId === 'string' ? parseInt(variationId, 10) : variationId;
  
  // Envia para GTM data layer (para compatibilidade com outras ferramentas)
  pushToDataLayer({
    event: 'experiment_viewed',
    experiment_id: experimentId,
    variation_id: variationIdNum, // Enviar como número
  });
  
  // Enviar DIRETO para GA4 via Measurement Protocol
  try {
    const { ga_client_id, ga_session_id } = getGaIdentifiers();
    
    if (!ga_client_id) {
      console.warn('[trackExperimentViewed] GA client_id not available');
      return;
    }
    
    const payload = {
      client_id: ga_client_id,
      events: [{
        name: 'experiment_viewed',
        params: {
          experiment_id: experimentId,
          variation_id: variationIdNum, // Enviar como número (int) para consistência com experimento anterior
          ...(ga_session_id && { session_id: ga_session_id }),
        }
      }]
    };
    
    // Enviar via Measurement Protocol
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${MEASUREMENT_API_SECRET}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('[trackExperimentViewed] Error:', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (pagePath: string) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: pagePath,
  });
};

// ==================== Landing Page Events ====================

export const trackCTAClick = (location: 'hero' | 'header' | 'como_funciona', action: 'start_test' | 'learn_more') => {
  pushToDataLayer({
    event: action === 'start_test' ? 'cta_click_start_test' : 'cta_click_learn_more',
    eventCategory: 'Engagement',
    eventAction: 'Click',
    eventLabel: location === 'hero' ? 'Hero Button' : location === 'header' ? 'Header Button' : 'Como Funciona Page',
  });
};

export const trackScrollDepth = (depth: number) => {
  pushToDataLayer({
    event: 'scroll_depth',
    eventCategory: 'Engagement',
    eventAction: 'Scroll',
    eventLabel: `${depth}%`,
    eventValue: depth,
  });
};

// ==================== Test Events ====================

export const trackTestStarted = (testId: string) => {
  pushToDataLayer({
    event: 'test_started',
    eventCategory: 'Test',
    eventAction: 'Start',
    user_properties: { test_id: testId },
  });
};

export const trackQuestionAnswered = (
  testId: string,
  currentQuestion: number,
  totalQuestions: number,
  answersCount: number
) => {
  const progress = Math.round((answersCount / totalQuestions) * 100);
  
  pushToDataLayer({
    event: 'test_question_answered',
    eventCategory: 'Test',
    eventAction: 'Question Answered',
    eventLabel: `Question ${currentQuestion}`,
    test_properties: {
      current_question: currentQuestion,
      total_questions: totalQuestions,
      questions_answered: answersCount,
      test_progress: progress,
    },
    user_properties: { test_id: testId },
  });
  
  // Checkpoint a cada 10 questões
  if (answersCount % 10 === 0 && answersCount > 0) {
    pushToDataLayer({
      event: 'test_progress_checkpoint',
      eventCategory: 'Test',
      eventAction: 'Progress Checkpoint',
      eventLabel: `${answersCount} questions`,
      test_properties: {
        questions_answered: answersCount,
        completion_rate: progress,
      },
      user_properties: { test_id: testId },
    });
  }
};

export const trackTestNavigationBack = (testId: string, currentQuestion: number) => {
  pushToDataLayer({
    event: 'test_navigation_back',
    eventCategory: 'Test',
    eventAction: 'Navigation',
    eventLabel: 'Back Button',
    test_properties: {
      current_question: currentQuestion,
    },
    user_properties: { test_id: testId },
  });
};

export const trackTestResumed = (testId: string, fromQuestion: number, answersCount: number) => {
  pushToDataLayer({
    event: 'test_resumed',
    eventCategory: 'Test',
    eventAction: 'Resume',
    test_properties: {
      from_question: fromQuestion,
      questions_answered: answersCount,
    },
    user_properties: { test_id: testId },
  });
};

export const trackTestCompleted = (testId: string, totalQuestions: number) => {
  pushToDataLayer({
    event: 'test_completed',
    eventCategory: 'Test',
    eventAction: 'Complete',
    test_properties: { 
      total_questions: totalQuestions,
    },
    user_properties: { test_id: testId },
  });
};

export const trackTestAbandoned = (
  testId: string,
  currentQuestion: number,
  answersCount: number,
  totalQuestions: number
) => {
  pushToDataLayer({
    event: 'test_abandoned',
    eventCategory: 'Test',
    eventAction: 'Abandoned',
    test_properties: {
      questions_answered: answersCount,
      completion_rate: Math.round((answersCount / totalQuestions) * 100),
      current_question: currentQuestion,
    },
    user_properties: { test_id: testId },
  });
};

// ==================== Contextual Questionnaire Events ====================

export const trackContextualQuestionnaireCompleted = (
  testId: string,
  answers: Record<string, string | string[]>,
  variant?: string // Adicionar parâmetro opcional
) => {
  pushToDataLayer({
    event: 'contextual_questionnaire_completed',
    eventCategory: 'Questionnaire',
    eventAction: 'Complete',
    contextual_questionnaire_variant: variant || 'enabled', // Adicionar
    test_properties: {
      ...answers,
    },
    user_properties: { test_id: testId },
  });
};

// ==================== Form Events ====================

export const trackFormViewed = (testId: string) => {
  pushToDataLayer({
    event: 'form_viewed',
    eventCategory: 'Form',
    eventAction: 'View',
    user_properties: { test_id: testId },
  });
};

export const trackFormFieldInteraction = (fieldName: string) => {
  pushToDataLayer({
    event: 'form_field_interaction',
    eventCategory: 'Form',
    eventAction: 'Field Focus',
    eventLabel: fieldName,
  });
};

export const trackFormSubmitted = (
  testId: string,
  age: string,
  variant?: string // Adicionar parâmetro opcional
) => {
  pushToDataLayer({
    event: 'form_submitted',
    eventCategory: 'Form',
    eventAction: 'Submit',
    contextual_questionnaire_variant: variant || 'disabled', // Adicionar (default "disabled" para backward compatibility)
    user_properties: {
      test_id: testId,
      user_age: age,
    },
  });
};

export const trackFormError = (errorType: string, fieldName?: string) => {
  pushToDataLayer({
    event: 'form_error',
    eventCategory: 'Form',
    eventAction: 'Error',
    eventLabel: fieldName ? `${errorType} - ${fieldName}` : errorType,
  });
};

// ==================== E-commerce Events ====================

const getProductItem = () => {
  const price = getMercadoPagoConfig().price;
  return {
    item_id: 'qualcarreira_full_analysis',
    item_name: 'Análise Vocacional Completa',
    price: price,
    quantity: 1,
    item_category: 'Digital Product',
  };
};

export const trackBeginCheckout = (
  testId: string,
  coupon?: string,
  discountedPrice?: number,
) => {
  const price = discountedPrice || getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'BRL',
      value: price,
      ...(coupon ? { coupon } : {}),
      items: [getProductItem()],
    },
    user_properties: { test_id: testId },
  });
};

export const trackAddPaymentInfo = (
  testId: string,
  paymentId: string,
  coupon?: string,
  discountedPrice?: number,
) => {
  const price = discountedPrice || getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'add_payment_info',
    ecommerce: {
      currency: 'BRL',
      value: price,
      payment_type: 'pix',
      ...(coupon ? { coupon } : {}),
      items: [getProductItem()],
    },
    user_properties: {
      test_id: testId,
      payment_id: paymentId,
    },
  });
};

export const trackPixCodeCopied = (
  testId: string,
  paymentId: string,
) => {
  pushToDataLayer({
    event: 'pix_code_copied',
    eventCategory: 'Payment',
    eventAction: 'PIX Code Copied',
    user_properties: {
      test_id: testId,
      payment_id: paymentId,
    },
  });
};

// NOTE: purchase event is now tracked server-side via GA4 Measurement Protocol
// in the Supabase Edge Function `send-whatsapp-on-payment`. Keeping this helper
// commented for potential future frontend GTM integration.
// export const trackPurchase = (
//   testId: string,
//   paymentId: string,
//   userEmail: string,
//   coupon?: string,
//   discountedPrice?: number
// ) => {
//   const price = discountedPrice || getMercadoPagoConfig().price;
//   pushToDataLayer({
//     event: 'purchase',
//     ecommerce: {
//       currency: 'BRL',
//       value: price,
//       transaction_id: paymentId,
//       payment_type: 'pix',
//       ...(coupon ? { coupon } : {}),
//       items: [getProductItem()],
//     },
//     user_properties: {
//       test_id: testId,
//       user_email: userEmail,
//     },
//   });
// };

export const trackPaymentError = (
  errorMessage: string,
  testId?: string,
) => {
  pushToDataLayer({
    event: 'payment_error',
    eventCategory: 'Payment',
    eventAction: 'Error',
    eventLabel: errorMessage,
    user_properties: testId ? { test_id: testId } : undefined,
  });
};

// ==================== Results & Coupon Events ====================
// NOTE: legacy events kept in Git history for reference.

// ==================== Custom Purchase Event ====================

export const trackCustomPurchase = (
  testId: string,
  paymentId: string,
  amount: number,
  coupon?: string,
) => {
  // Validação defensiva: garantir que paymentId e testId existem
  if (!paymentId || !testId) {
    console.warn('[trackCustomPurchase] Missing required parameters:', { paymentId, testId });
    return;
  }

  // Se amount for 0 (cupom grátis), usar 0. Caso contrário, usar amount ou preço padrão
  const price = amount === 0 ? 0 : (amount || getMercadoPagoConfig().price);
  
  pushToDataLayer({
    event: 'custom_purchase',
    ecommerce: {
      currency: 'BRL',
      value: price,
      transaction_id: paymentId,
      payment_type: paymentId.startsWith('FREE_') ? 'coupon' : 'pix',
      ...(coupon ? { coupon } : {}),
      items: [getProductItem()],
    },
    user_properties: {
      test_id: testId,
    },
  });
};
