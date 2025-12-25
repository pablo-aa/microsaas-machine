import { pushToDataLayer } from './gtm';
import { getMercadoPagoConfig } from '@/config/mercadopago';

// ==================== Experiment Events ====================

/**
 * Track page view como proxy de exposure ao experimento
 * Envia payment_variant em TODOS os eventos para permitir segmentação no GrowthBook
 */
export const trackPageView = (pagePath: string, variant?: string) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: pagePath,
    ...(variant && { payment_variant: variant }),
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

export const trackFormSubmitted = (testId: string, age: string) => {
  pushToDataLayer({
    event: 'form_submitted',
    eventCategory: 'Form',
    eventAction: 'Submit',
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
  variant?: string,
) => {
  const price = discountedPrice || getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'begin_checkout',
    payment_variant: variant || 'A',
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
  variant?: string,
) => {
  const price = discountedPrice || getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'add_payment_info',
    payment_variant: variant || 'A',
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
  variant?: string,
) => {
  pushToDataLayer({
    event: 'pix_code_copied',
    eventCategory: 'Payment',
    eventAction: 'PIX Code Copied',
    payment_variant: variant || 'A',
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
  variant?: string,
) => {
  pushToDataLayer({
    event: 'payment_error',
    eventCategory: 'Payment',
    eventAction: 'Error',
    eventLabel: errorMessage,
    payment_variant: variant || 'A',
    user_properties: testId ? { test_id: testId } : undefined,
  });
};

// ==================== Results & Coupon Events ====================
// NOTE: legacy events kept in Git history for reference.
