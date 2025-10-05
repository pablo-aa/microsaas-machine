# Plano de Implementação - Google Tag Manager
## QualCarreira

---

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Setup Técnico](#setup-técnico)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Eventos Mapeados](#eventos-mapeados)
5. [Implementação por Página](#implementação-por-página)
6. [Arquitetura de Código](#arquitetura-de-código)
7. [Testes e Validação](#testes-e-validação)

---

## 🎯 Visão Geral

### IDs GTM
- **Produção**: `GTM-PHS8NHMD`
- **Desenvolvimento**: `GTM-TJG9LDR2`

### Objetivos
1. Rastrear todo o funil de conversão (landing → teste → pagamento)
2. Identificar pontos de abandono no teste vocacional
3. Mensurar performance de cada etapa
4. Integrar eventos e-commerce do Google Analytics 4
5. Capturar preço dinâmico do produto

---

## 🔧 Setup Técnico

### 1. Instalação do GTM

**Localização**: `index.html`

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

**Nota**: O ID será determinado dinamicamente baseado no ambiente.

### 2. Detecção de Ambiente

**Arquivo**: `src/lib/gtm.ts` (novo)

```typescript
export const getGTMId = (): string => {
  const isProd = 
    window.location.hostname === 'qualcarreira.com' || 
    window.location.hostname === 'www.qualcarreira.com';
  
  return isProd ? 'GTM-PHS8NHMD' : 'GTM-TJG9LDR2';
};

export const isProduction = (): boolean => {
  return window.location.hostname === 'qualcarreira.com' || 
         window.location.hostname === 'www.qualcarreira.com';
};
```

---

## 📊 Estrutura de Dados

### DataLayer Base

```typescript
interface DataLayerEvent {
  event: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  // E-commerce
  ecommerce?: {
    currency?: string;
    value?: number;
    items?: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
      item_category?: string;
    }>;
    transaction_id?: string;
    payment_type?: string;
  };
  // Custom
  user_properties?: {
    user_id?: string;
    test_id?: string;
    user_age?: string;
    user_email?: string;
  };
  test_properties?: {
    test_progress?: number;
    current_question?: number;
    total_questions?: number;
    questions_answered?: number;
    time_spent?: number;
    completion_rate?: number;
  };
}
```

---

## 🎯 Eventos Mapeados

### 1. **Landing Page** (`/`)

| Evento | Tipo | Quando Dispara | Dados |
|--------|------|----------------|-------|
| `page_view` | Padrão GA4 | Carregamento da página | URL, título, referrer |
| `cta_click_start_test` | Personalizado | Click em "Começar Teste" | Localização do botão (hero/header) |
| `cta_click_learn_more` | Personalizado | Click em "Saiba Mais" | - |
| `scroll_depth` | Personalizado | Scroll em 25%, 50%, 75%, 100% | Profundidade |

**Implementação**:
```typescript
// Click "Começar Teste"
window.dataLayer.push({
  event: 'cta_click_start_test',
  eventCategory: 'Engagement',
  eventAction: 'Click',
  eventLabel: 'Hero Button',
});

// Click "Saiba Mais"
window.dataLayer.push({
  event: 'cta_click_learn_more',
  eventCategory: 'Engagement',
  eventAction: 'Click',
  eventLabel: 'Hero Secondary Button',
});
```

---

### 2. **Como Funciona** (`/como-funciona`)

| Evento | Tipo | Quando Dispara | Dados |
|--------|------|----------------|-------|
| `page_view` | Padrão GA4 | Carregamento da página | - |
| `cta_click_start_test` | Personalizado | Click em "Começar o teste" | Source: "como_funciona" |

---

### 3. **Início do Teste** (`/comeco`)

| Evento | Tipo | Quando Dispara | Dados |
|--------|------|----------------|-------|
| `page_view` | Padrão GA4 | Carregamento da página | - |
| `test_started` | Personalizado | Click em "Descobrir Minha Carreira" | test_id gerado |

**Implementação**:
```typescript
// Quando gera UUID e inicia teste
const testId = uuidv4();
window.dataLayer.push({
  event: 'test_started',
  eventCategory: 'Test',
  eventAction: 'Start',
  user_properties: {
    test_id: testId,
  },
});
```

---

### 4. **Avaliação/Teste** (`/avaliacao/:id`)

| Evento | Tipo | Quando Dispara | Dados |
|--------|------|----------------|-------|
| `page_view` | Padrão GA4 | Carregamento da página | test_id |
| `test_question_answered` | Personalizado | Cada resposta | question_number, question_id, score, progress |
| `test_progress_checkpoint` | Personalizado | A cada 10 questões (20%, 40%, 60%, 80%, 100%) | questions_answered, completion_rate |
| `test_navigation_back` | Personalizado | Click em "Anterior" | current_question |
| `test_resumed` | Personalizado | Retoma teste salvo | questions_answered, from_question |
| `test_completed` | Personalizado | Última questão respondida | total_questions, time_spent (estimado) |
| `test_abandoned` | Personalizado | Sai da página sem completar | questions_answered, completion_rate, current_question |

**Implementação**:
```typescript
// Resposta de questão
window.dataLayer.push({
  event: 'test_question_answered',
  eventCategory: 'Test',
  eventAction: 'Question Answered',
  eventLabel: `Question ${currentQuestion + 1}`,
  test_properties: {
    current_question: currentQuestion + 1,
    total_questions: TOTAL_QUESTIONS,
    questions_answered: answers.length,
    test_progress: Math.round((answers.length / TOTAL_QUESTIONS) * 100),
  },
  user_properties: {
    test_id: testId,
  },
});

// Checkpoint de progresso (a cada 10 questões)
if (answers.length % 10 === 0) {
  window.dataLayer.push({
    event: 'test_progress_checkpoint',
    eventCategory: 'Test',
    eventAction: 'Progress Checkpoint',
    eventLabel: `${answers.length} questions`,
    test_properties: {
      questions_answered: answers.length,
      completion_rate: Math.round((answers.length / TOTAL_QUESTIONS) * 100),
    },
  });
}

// Teste completado
window.dataLayer.push({
  event: 'test_completed',
  eventCategory: 'Test',
  eventAction: 'Complete',
  test_properties: {
    total_questions: TOTAL_QUESTIONS,
    time_spent: calculateTimeSpent(), // implementar
  },
  user_properties: {
    test_id: testId,
  },
});

// Abandono (beforeunload ou page hide)
window.addEventListener('beforeunload', () => {
  if (stage === 'questions' && answers.length < TOTAL_QUESTIONS) {
    window.dataLayer.push({
      event: 'test_abandoned',
      eventCategory: 'Test',
      eventAction: 'Abandoned',
      test_properties: {
        questions_answered: answers.length,
        completion_rate: Math.round((answers.length / TOTAL_QUESTIONS) * 100),
        current_question: currentQuestion + 1,
      },
    });
  }
});
```

---

### 5. **Formulário de Dados** (`FormularioDados`)

| Evento | Tipo | Quando Dispara | Dados |
|--------|------|----------------|-------|
| `form_viewed` | Personalizado | Exibição do formulário | test_id |
| `form_field_interaction` | Personalizado | Focus em cada campo | field_name |
| `form_submitted` | Personalizado | Submit do formulário | test_id |
| `form_error` | Personalizado | Erro de validação | error_type, field_name |

**Implementação**:
```typescript
// Form visualizado
window.dataLayer.push({
  event: 'form_viewed',
  eventCategory: 'Form',
  eventAction: 'View',
  user_properties: {
    test_id: testId,
  },
});

// Submit
window.dataLayer.push({
  event: 'form_submitted',
  eventCategory: 'Form',
  eventAction: 'Submit',
  user_properties: {
    test_id: testId,
    user_age: formData.age,
  },
});

// Erro
window.dataLayer.push({
  event: 'form_error',
  eventCategory: 'Form',
  eventAction: 'Error',
  eventLabel: errorType,
});
```

---

### 6. **Página de Resultado** (`/resultado/:id`)

| Evento | Tipo | Quando Dispara | Dados |
|--------|------|----------------|-------|
| `page_view` | Padrão GA4 | Carregamento da página | test_id |
| `result_partial_viewed` | Personalizado | Visualização de resultado parcial | test_id |
| `view_item` | **E-commerce GA4** | Exibição do produto (análise completa) | item_id, item_name, price |
| `unlock_button_clicked` | Personalizado | Click em "Desbloquear Resultados" | - |

**Implementação**:
```typescript
// Visualização de resultado parcial
window.dataLayer.push({
  event: 'result_partial_viewed',
  eventCategory: 'Results',
  eventAction: 'Partial View',
  user_properties: {
    test_id: testId,
  },
});

// View Item (E-commerce)
const price = getMercadoPagoConfig().price;
window.dataLayer.push({
  event: 'view_item',
  ecommerce: {
    currency: 'BRL',
    value: price,
    items: [{
      item_id: 'qualcarreira_full_analysis',
      item_name: 'Análise Vocacional Completa',
      price: price,
      quantity: 1,
      item_category: 'Digital Product',
    }],
  },
});

// Click desbloquear
window.dataLayer.push({
  event: 'unlock_button_clicked',
  eventCategory: 'Conversion',
  eventAction: 'Click',
  eventLabel: 'Unlock Results',
});
```

---

### 7. **Payment Modal** (`PaymentModal`)

| Evento | Tipo | Quando Dispara | Dados |
|--------|------|----------------|-------|
| `begin_checkout` | **E-commerce GA4** | Modal de pagamento abre | item, price, payment_type: "pix" |
| `add_payment_info` | **E-commerce GA4** | QR Code gerado | payment_type: "pix", payment_id |
| `pix_code_copied` | Personalizado | Código PIX copiado | - |
| `purchase` | **E-commerce GA4** | Pagamento aprovado | transaction_id, value, items |
| `payment_error` | Personalizado | Erro no pagamento | error_message |

**Implementação**:
```typescript
// Begin Checkout
const price = getMercadoPagoConfig().price;
window.dataLayer.push({
  event: 'begin_checkout',
  ecommerce: {
    currency: 'BRL',
    value: price,
    items: [{
      item_id: 'qualcarreira_full_analysis',
      item_name: 'Análise Vocacional Completa',
      price: price,
      quantity: 1,
    }],
  },
});

// Add Payment Info (QR Code gerado)
window.dataLayer.push({
  event: 'add_payment_info',
  ecommerce: {
    currency: 'BRL',
    value: price,
    payment_type: 'pix',
    items: [{
      item_id: 'qualcarreira_full_analysis',
      item_name: 'Análise Vocacional Completa',
      price: price,
      quantity: 1,
    }],
  },
  user_properties: {
    test_id: testId,
    payment_id: paymentId,
  },
});

// Purchase (Pagamento aprovado)
window.dataLayer.push({
  event: 'purchase',
  ecommerce: {
    currency: 'BRL',
    value: price,
    transaction_id: paymentId,
    payment_type: 'pix',
    items: [{
      item_id: 'qualcarreira_full_analysis',
      item_name: 'Análise Vocacional Completa',
      price: price,
      quantity: 1,
    }],
  },
  user_properties: {
    test_id: testId,
    user_email: userEmail,
  },
});

// Erro
window.dataLayer.push({
  event: 'payment_error',
  eventCategory: 'Payment',
  eventAction: 'Error',
  eventLabel: error.message,
});
```

---

### 8. **Resultado Completo Desbloqueado**

| Evento | Tipo | Quando Dispara | Dados |
|--------|------|----------------|-------|
| `result_full_viewed` | Personalizado | Resultado completo exibido | test_id, riasec_profile |
| `result_tab_changed` | Personalizado | Mudança de aba (RIASEC/Gardner/GOPC) | tab_name |
| `result_section_expanded` | Personalizado | Expande seção de detalhes | section_name |

---

## 🏗️ Arquitetura de Código

### Estrutura de Arquivos

```
src/
├── lib/
│   ├── gtm.ts          # Configuração e helpers GTM
│   └── analytics.ts    # Funções de tracking centralizadas
├── hooks/
│   └── useGTM.ts       # Hook React para GTM
└── types/
    └── gtm.ts          # TypeScript types
```

### `src/lib/gtm.ts`

```typescript
declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const getGTMId = (): string => {
  const isProd = 
    window.location.hostname === 'qualcarreira.com' || 
    window.location.hostname === 'www.qualcarreira.com';
  return isProd ? 'GTM-PHS8NHMD' : 'GTM-TJG9LDR2';
};

export const initializeGTM = () => {
  const gtmId = getGTMId();
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Inject GTM script
  const script = document.createElement('script');
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `;
  document.head.insertBefore(script, document.head.firstChild);
  
  // Inject noscript
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `
    <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe>
  `;
  document.body.insertBefore(noscript, document.body.firstChild);
};

export const pushToDataLayer = (data: any) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
};
```

### `src/lib/analytics.ts`

```typescript
import { pushToDataLayer } from './gtm';
import { getMercadoPagoConfig } from '@/config/mercadopago';

// Landing Page
export const trackCTAClick = (location: 'hero' | 'header', action: 'start_test' | 'learn_more') => {
  pushToDataLayer({
    event: action === 'start_test' ? 'cta_click_start_test' : 'cta_click_learn_more',
    eventCategory: 'Engagement',
    eventAction: 'Click',
    eventLabel: location === 'hero' ? 'Hero Button' : 'Header Button',
  });
};

// Test Events
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
  if (answersCount % 10 === 0) {
    pushToDataLayer({
      event: 'test_progress_checkpoint',
      eventCategory: 'Test',
      eventAction: 'Progress Checkpoint',
      eventLabel: `${answersCount} questions`,
      test_properties: {
        questions_answered: answersCount,
        completion_rate: progress,
      },
    });
  }
};

export const trackTestCompleted = (testId: string, totalQuestions: number) => {
  pushToDataLayer({
    event: 'test_completed',
    eventCategory: 'Test',
    eventAction: 'Complete',
    test_properties: { total_questions: totalQuestions },
    user_properties: { test_id: testId },
  });
};

export const trackTestAbandoned = (
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
  });
};

// Form Events
export const trackFormViewed = (testId: string) => {
  pushToDataLayer({
    event: 'form_viewed',
    eventCategory: 'Form',
    eventAction: 'View',
    user_properties: { test_id: testId },
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

// E-commerce Events
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

export const trackViewItem = () => {
  const price = getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: 'BRL',
      value: price,
      items: [getProductItem()],
    },
  });
};

export const trackBeginCheckout = () => {
  const price = getMercadoPagoConfig().price;
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'BRL',
      value: price,
      items: [getProductItem()],
    },
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

// Results Events
export const trackPartialResultViewed = (testId: string) => {
  pushToDataLayer({
    event: 'result_partial_viewed',
    eventCategory: 'Results',
    eventAction: 'Partial View',
    user_properties: { test_id: testId },
  });
};

export const trackUnlockButtonClicked = () => {
  pushToDataLayer({
    event: 'unlock_button_clicked',
    eventCategory: 'Conversion',
    eventAction: 'Click',
    eventLabel: 'Unlock Results',
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
```

### `src/hooks/useGTM.ts`

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pushToDataLayer } from '@/lib/gtm';

export const usePageView = () => {
  const location = useLocation();
  
  useEffect(() => {
    pushToDataLayer({
      event: 'page_view',
      page_path: location.pathname,
      page_title: document.title,
    });
  }, [location]);
};

export const useTestAbandonment = (
  isTestActive: boolean,
  currentQuestion: number,
  answersCount: number,
  totalQuestions: number
) => {
  useEffect(() => {
    if (!isTestActive) return;
    
    const handleBeforeUnload = () => {
      if (answersCount < totalQuestions) {
        pushToDataLayer({
          event: 'test_abandoned',
          eventCategory: 'Test',
          eventAction: 'Abandoned',
          test_properties: {
            questions_answered: answersCount,
            completion_rate: Math.round((answersCount / totalQuestions) * 100),
            current_question: currentQuestion,
          },
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTestActive, currentQuestion, answersCount, totalQuestions]);
};
```

---

## 📝 Implementação por Página

### 1. `src/App.tsx`
```typescript
import { useEffect } from 'react';
import { initializeGTM } from '@/lib/gtm';

const App = () => {
  useEffect(() => {
    initializeGTM();
  }, []);
  
  // ... resto do código
};
```

### 2. `src/pages/Index.tsx`
```typescript
import { trackCTAClick } from '@/lib/analytics';
import { usePageView } from '@/hooks/useGTM';

const Index = () => {
  usePageView();
  
  return (
    // ...
    <Button onClick={() => trackCTAClick('hero', 'start_test')}>
      Começar Teste
    </Button>
    <Button onClick={() => trackCTAClick('hero', 'learn_more')}>
      Saiba Mais
    </Button>
  );
};
```

### 3. `src/pages/Comeco.tsx`
```typescript
import { trackTestStarted } from '@/lib/analytics';
import { usePageView } from '@/hooks/useGTM';

const Comeco = () => {
  usePageView();
  
  const handleStartAssessment = () => {
    setIsLoading(true);
    const assessmentId = uuidv4();
    trackTestStarted(assessmentId);
    // ... navigate
  };
};
```

### 4. `src/pages/Avaliacao.tsx`
```typescript
import { 
  trackQuestionAnswered, 
  trackTestCompleted 
} from '@/lib/analytics';
import { usePageView, useTestAbandonment } from '@/hooks/useGTM';

const Avaliacao = () => {
  usePageView();
  useTestAbandonment(
    stage === 'questions',
    currentQuestion,
    answers.length,
    TOTAL_QUESTIONS
  );
  
  const handleNext = () => {
    // ... após atualizar answers
    trackQuestionAnswered(
      testId,
      currentQuestion + 1,
      TOTAL_QUESTIONS,
      newAnswers.length
    );
    
    if (currentQuestion === totalQuestions - 1) {
      trackTestCompleted(testId, TOTAL_QUESTIONS);
    }
  };
};
```

### 5. `src/pages/FormularioDados.tsx`
```typescript
import { trackFormViewed, trackFormSubmitted } from '@/lib/analytics';

const FormularioDados = ({ testId }: FormularioDadosProps) => {
  useEffect(() => {
    trackFormViewed(testId);
  }, [testId]);
  
  const handleSubmit = async (e) => {
    // ... validação
    trackFormSubmitted(testId, formData.age);
    // ... submit
  };
};
```

### 6. `src/pages/ResultadosCompletos.tsx`
```typescript
import { 
  trackPartialResultViewed, 
  trackViewItem, 
  trackUnlockButtonClicked 
} from '@/lib/analytics';
import { usePageView } from '@/hooks/useGTM';

const ResultadosCompletos = ({ testId }: Props) => {
  usePageView();
  
  useEffect(() => {
    trackPartialResultViewed(testId);
    trackViewItem();
  }, [testId]);
  
  const handleDesbloquearClick = () => {
    trackUnlockButtonClicked();
    setShowPaymentModal(true);
  };
};
```

### 7. `src/components/PaymentModal.tsx`
```typescript
import { 
  trackBeginCheckout, 
  trackAddPaymentInfo, 
  trackPurchase 
} from '@/lib/analytics';

const PaymentModal = ({ testId, userEmail }: Props) => {
  useEffect(() => {
    if (isOpen) {
      trackBeginCheckout();
    }
  }, [isOpen]);
  
  const createPayment = async () => {
    // ... criar pagamento
    trackAddPaymentInfo(testId, paymentId);
  };
  
  const unlockResult = async () => {
    // ... unlock
    trackPurchase(testId, paymentId, userEmail);
  };
};
```

---

## ✅ Testes e Validação

### Ferramentas de Teste

1. **Google Tag Assistant (Chrome Extension)**
   - Valida instalação do GTM
   - Verifica disparo de tags
   - Identifica erros

2. **GTM Preview Mode**
   - Acesse GTM Console → Preview
   - Navegue pelo site
   - Veja eventos em tempo real

3. **GA4 DebugView**
   - Google Analytics 4 → Configure → DebugView
   - Valida eventos GA4
   - Verifica parâmetros e-commerce

4. **Browser Console**
```javascript
// Ver dataLayer
console.log(window.dataLayer);

// Monitorar novos eventos
window.dataLayer.push = function() {
  console.log('DataLayer Push:', arguments);
  Array.prototype.push.apply(window.dataLayer, arguments);
};
```

### Checklist de Validação

#### Setup Inicial
- [ ] GTM instalado no `index.html`
- [ ] Container ID correto por ambiente
- [ ] dataLayer inicializado
- [ ] Noscript presente

#### Eventos Landing Page
- [ ] page_view dispara
- [ ] cta_click_start_test funciona
- [ ] cta_click_learn_more funciona

#### Eventos Teste
- [ ] test_started com test_id correto
- [ ] test_question_answered em cada resposta
- [ ] test_progress_checkpoint a cada 10 questões
- [ ] test_completed ao finalizar
- [ ] test_abandoned ao sair

#### Eventos Formulário
- [ ] form_viewed ao exibir
- [ ] form_submitted com dados corretos

#### Eventos E-commerce
- [ ] view_item com preço dinâmico correto
- [ ] begin_checkout ao abrir modal
- [ ] add_payment_info com payment_id
- [ ] purchase com transaction_id e valor correto

#### Dados de Produto
- [ ] Preço sempre atualizado (mercadopago.config)
- [ ] Currency sempre BRL
- [ ] item_id consistente
- [ ] transaction_id único

---

## 🚀 Próximos Passos

1. **Fase 1**: Setup técnico
   - Criar arquivos de configuração GTM
   - Implementar helpers e hooks
   - Adicionar GTM ao `index.html`

2. **Fase 2**: Eventos básicos
   - Landing page
   - Test started/completed
   - Page views

3. **Fase 3**: Eventos avançados
   - Test progress tracking
   - Abandonment tracking
   - Form interactions

4. **Fase 4**: E-commerce
   - view_item
   - begin_checkout
   - add_payment_info
   - purchase

5. **Fase 5**: Testes e validação
   - Validar cada evento
   - Ajustar parâmetros
   - Documentar exceções

6. **Fase 6**: Dashboards e Alertas
   - Criar dashboards no GA4
   - Configurar alertas de conversão
   - Setup de relatórios automáticos

---

## 📊 Métricas-Chave a Monitorar

### Funil de Conversão
1. **Visitantes** → Landing Page views
2. **Iniciaram teste** → test_started
3. **Completaram teste** → test_completed
4. **Enviaram formulário** → form_submitted
5. **Viram resultado parcial** → result_partial_viewed
6. **Iniciaram checkout** → begin_checkout
7. **Geraram PIX** → add_payment_info
8. **Compraram** → purchase

### KPIs Importantes
- **Taxa de início**: test_started / page_views
- **Taxa de conclusão do teste**: test_completed / test_started
- **Taxa de abandono por etapa**: Análise de current_question nos abandonos
- **Taxa de conversão checkout**: purchase / begin_checkout
- **Ticket médio**: Preço médio nas purchases
- **Tempo médio no teste**: time_spent nos test_completed

### Segmentações Úteis
- Por faixa etária (user_age)
- Por progresso no teste (completion_rate)
- Por dispositivo
- Por fonte de tráfego
- Por horário/dia da semana

---

## 📞 Contato

Para dúvidas sobre a implementação:
**suporte@qualcarreira.com**

---

**Documento criado em**: 2025-01-XX  
**Versão**: 1.0  
**Responsável**: Equipe QualCarreira
