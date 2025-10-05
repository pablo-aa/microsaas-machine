import { pushToDataLayer } from './gtm';
import { getMercadoPagoConfig } from '@/config/mercadopago';

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

export const trackViewItem = (testId: string) => {
  const price = getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: 'BRL',
      value: price,
      items: [getProductItem()],
    },
    user_properties: { test_id: testId },
  });
};

export const trackBeginCheckout = (testId: string) => {
  const price = getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'BRL',
      value: price,
      items: [getProductItem()],
    },
    user_properties: { test_id: testId },
  });
};

export const trackAddPaymentInfo = (testId: string, paymentId: string) => {
  const price = getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'add_payment_info',
    ecommerce: {
      currency: 'BRL',
      value: price,
      payment_type: 'pix',
      items: [getProductItem()],
    },
    user_properties: {
      test_id: testId,
      payment_id: paymentId,
    },
  });
};

export const trackPixCodeCopied = (testId: string, paymentId: string) => {
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

export const trackPurchase = (
  testId: string,
  paymentId: string,
  userEmail: string
) => {
  const price = getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      currency: 'BRL',
      value: price,
      transaction_id: paymentId,
      payment_type: 'pix',
      items: [getProductItem()],
    },
    user_properties: {
      test_id: testId,
      user_email: userEmail,
    },
  });
};

export const trackPaymentError = (errorMessage: string, testId?: string) => {
  pushToDataLayer({
    event: 'payment_error',
    eventCategory: 'Payment',
    eventAction: 'Error',
    eventLabel: errorMessage,
    user_properties: testId ? { test_id: testId } : undefined,
  });
};

// ==================== Results Events ====================

export const trackPartialResultViewed = (testId: string) => {
  pushToDataLayer({
    event: 'result_partial_viewed',
    eventCategory: 'Results',
    eventAction: 'Partial View',
    user_properties: { test_id: testId },
  });
};

export const trackUnlockButtonClicked = (testId: string) => {
  pushToDataLayer({
    event: 'unlock_button_clicked',
    eventCategory: 'Conversion',
    eventAction: 'Click',
    eventLabel: 'Unlock Results',
    user_properties: { test_id: testId },
  });
};

export const trackFullResultViewed = (testId: string, riasecProfile?: string) => {
  pushToDataLayer({
    event: 'result_full_viewed',
    eventCategory: 'Results',
    eventAction: 'Full View',
    user_properties: {
      test_id: testId,
      riasec_profile: riasecProfile,
    },
  });
};

export const trackResultTabChanged = (tabName: string, testId: string) => {
  pushToDataLayer({
    event: 'result_tab_changed',
    eventCategory: 'Results',
    eventAction: 'Tab Changed',
    eventLabel: tabName,
    user_properties: { test_id: testId },
  });
};

export const trackResultSectionExpanded = (sectionName: string, testId: string) => {
  pushToDataLayer({
    event: 'result_section_expanded',
    eventCategory: 'Results',
    eventAction: 'Section Expanded',
    eventLabel: sectionName,
    user_properties: { test_id: testId },
  });
};
