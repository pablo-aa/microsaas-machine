## GTM & GA4 Status - QualCarreira

### Visão geral

Este documento descreve a arquitetura de tracking de eventos do QualCarreira, que utiliza uma abordagem híbrida combinando **Google Tag Manager (GTM)** para eventos de engajamento e **GA4 Measurement Protocol** para eventos críticos de negócio.

**Componentes principais:**

- **Google Tag Manager (GTM)**: gerenciador de tags que recebe eventos via `dataLayer` e os encaminha para GA4 e outras ferramentas. Inicializado em `src/app/providers.tsx` via `initializeGTM()` (`src/lib/gtm.ts`). Todos os eventos frontend são empurrados para o `dataLayer` usando a função `pushToDataLayer`.

- **GA4 client-side**: o Google Analytics 4 lê cookies `_ga` e `_ga_*` através de `src/lib/gaCookies.ts` para capturar identificadores únicos do usuário (`ga_client_id`, `ga_session_id`, `ga_session_number`). Esses identificadores são salvos no backend quando um pagamento é criado, permitindo correlacionar eventos frontend e backend.

- **GA4 server-side (Measurement Protocol)**: eventos críticos de negócio (`purchase`, `experiment_viewed`) são enviados diretamente para o GA4 via HTTP POST usando o Measurement Protocol. Isso garante que eventos importantes não sejam perdidos mesmo se houver problemas no frontend (ex: usuário fecha a aba antes do evento ser processado pelo GTM).

**Por que essa arquitetura híbrida?**

- **GTM para eventos de engajamento**: permite flexibilidade para adicionar/remover tags sem alterar código, ideal para eventos não-críticos.
- **Measurement Protocol para eventos críticos**: garante que conversões e exposições a experimentos sejam sempre rastreadas, independente do estado do frontend.

---

### Eventos frontend (GTM + GA4 Measurement Protocol)

Todos os eventos são definidos em `src/lib/analytics.ts` e podem ser chamados de qualquer componente do frontend.

#### Experimentos A/B

- **`experiment_viewed`** (`trackExperimentViewed`)
  - **O que faz**: registra quando um usuário é exposto a uma variação de um experimento A/B (ex: teste de preços).
  - **Implementação híbrida**: 
    - Envia para GTM `dataLayer` (para compatibilidade com outras ferramentas).
    - **Também envia diretamente para GA4 via Measurement Protocol** (bypassa GTM).
  - **Onde é disparado**: `src/components/pages/ResultadoPage.tsx` quando o componente monta (via `useEffect`).
  - **Parâmetros enviados**: 
    - `experiment_id`: ID do experimento (ex: `'qc-pricing-test'`).
    - `variation_id`: ID numérico da variação (0, 1, 2).
    - `payment_variant`: variante de pagamento (A, B, C).
  - **Por que híbrido**: o GrowthBook (ferramenta de A/B testing) precisa desses eventos no GA4 para calcular taxas de conversão. Enviar diretamente via Measurement Protocol garante que o evento chegue mesmo se houver problemas no GTM.

#### Pageview & engajamento

- **`page_view`** (`trackPageView`, `usePageView`)
  - **O que faz**: registra visualizações de páginas.
  - **Onde é usado**: landing page (`src/app/page.tsx`), página inicial do teste (`src/app/comeco/page.tsx`), FAQ, páginas de conteúdo estático (`ComoFunciona`, `TermosDeUso`, `PoliticaDePrivacidade`) e página de avaliação (`AvaliacaoPage`).
  - **Parâmetros especiais**: inclui `payment_variant` quando disponível (para segmentação no GrowthBook).
  - **Implementação**: pode ser usado via hook `usePageView` ou função direta `trackPageView`.

- **`scroll_depth`** (`trackScrollDepth`)
  - **O que faz**: registra a profundidade de scroll do usuário na página (ex: 25%, 50%, 75%, 100%).
  - **Onde é usado**: apenas na landing page (`src/app/page.tsx`).
  - **Implementação**: chamado via hook `useScrollDepth` (`src/hooks/useGTM.ts`).

#### Funil do teste (assessment)

Esses eventos rastreiam a jornada do usuário através do teste vocacional de 60 questões:

- **`test_started`** (`trackTestStarted`): disparado quando o usuário inicia o teste, chamado em `src/app/comeco/page.tsx`.
- **`test_question_answered`** (`trackQuestionAnswered`): disparado a cada resposta de questão, rastreado em `src/components/pages/AvaliacaoPage.tsx`.
- **`test_progress_checkpoint`** (`trackQuestionAnswered`): disparado automaticamente a cada 10 questões respondidas (checkpoint de progresso).
- **`test_navigation_back`** (`trackTestNavigationBack`): disparado quando o usuário clica em "voltar" durante a avaliação.
- **`test_resumed`** (`trackTestResumed`): disparado quando o usuário retoma um teste salvo anteriormente.
- **`test_completed`** (`trackTestCompleted`): disparado quando o usuário completa todas as 60 questões.
- **`test_abandoned`** (`trackTestAbandoned`): disparado quando o usuário abandona o teste antes de completá-lo, rastreado por `useTestAbandonment` (`src/hooks/useGTM.ts`).

**Onde são definidos**: funções em `src/lib/analytics.ts`, acionadas em `src/components/pages/AvaliacaoPage.tsx` e `src/hooks/useGTM.ts`.

#### Formulário de dados pessoais

Após completar o teste, o usuário preenche um formulário com dados pessoais:

- **`form_viewed`** (`trackFormViewed`): quando a tela do formulário é exibida.
- **`form_field_interaction`** (`trackFormFieldInteraction`): quando o usuário foca/interage com um campo específico.
- **`form_submitted`** (`trackFormSubmitted`): quando o formulário é enviado com sucesso.
- **`form_error`** (`trackFormError`): quando há erros de validação ou falha no envio.

**Onde são usados**: `src/components/pages/FormularioDadosPage.tsx`.

#### Landing / CTAs (Call-to-Actions)

- **`cta_click_start_test`** / **`cta_click_learn_more`** (`trackCTAClick`)
  - **O que faz**: rastreia cliques em botões de chamada para ação.
  - **Onde são usados**: `Header` (`src/components/Header.tsx`), `Hero` (`src/components/Hero.tsx`), e página "Como Funciona" (`src/components/pages/ComoFuncionaPage.tsx`).

#### Pagamento (Mercado Pago PIX)

Esses eventos rastreiam o funil de pagamento:

- **`begin_checkout`** (`trackBeginCheckout`): disparado quando o modal de pagamento é aberto / início do processo de pagamento.
- **`add_payment_info`** (`trackAddPaymentInfo`): disparado quando o QR Code PIX é gerado / pagamento iniciado.
- **`pix_code_copied`** (`trackPixCodeCopied`): disparado quando o usuário copia o código PIX.
- **`payment_error`** (`trackPaymentError`): disparado quando há erros na criação do pagamento ou falhas de status.

**Onde são usados**: `src/components/PaymentModal.tsx`.

**Parâmetros especiais**: todos incluem `payment_variant` (A, B, C) e dados de e-commerce (valor, moeda, itens) para análise de conversão por variante.

> **Importante**: o evento **`purchase`** NÃO é mais enviado pelo frontend via GTM. Ele foi movido para o backend (ver seção abaixo) para garantir que só seja registrado quando o pagamento for realmente aprovado.

---

### Eventos server-side (GA4 Measurement Protocol)

Eventos críticos de negócio são enviados diretamente para o GA4 via Measurement Protocol a partir do backend (Supabase Edge Functions). Isso garante rastreamento confiável mesmo se o usuário fechar a aba, houver problemas no frontend, ou o GTM estiver com problemas.

#### `experiment_viewed`

- **Local**: função `trackExperimentViewed()` em `src/lib/analytics.ts` (chamada do frontend, mas envia via Measurement Protocol).
- **Quando é disparado**: quando o componente `ResultadoPage.tsx` monta (via `useEffect`), imediatamente após o usuário ver a página de resultados.
- **Payload enviado**: 
  - `experiment_id`: ID do experimento (ex: `'qc-pricing-test'`).
  - `variation_id`: ID numérico da variação (0, 1, 2).
  - `payment_variant`: variante de pagamento (A, B, C).
  - `session_id`: ID da sessão GA4 (se disponível).
- **Por que server-side**: embora seja chamado do frontend, o envio via Measurement Protocol garante que o evento chegue ao GA4 mesmo se houver problemas no GTM, permitindo que o GrowthBook calcule corretamente a taxa de conversão (exposições vs. compras).

#### `purchase`

- **Local**: `supabase/functions/send-whatsapp-on-payment/index.ts` (Supabase Edge Function).
- **Quando é disparado**: quando o status do pagamento muda para `approved` (aprovado), confirmado via API do Mercado Pago.
- **Fonte dos dados**: 
  - Tabela `payments` no Supabase: `payment_id`, `amount`, `status`, `ga_client_id`, `ga_session_id`, `ga_session_number`, `coupon_code`, `original_amount`.
  - API Mercado Pago: status e valor confirmados via endpoint `/v1/payments/{id}`.
- **Condições para envio**: 
  - Só envia o evento GA4 quando o status é `approved` (não envia para `pending` ou `rejected`).
  - Usa `ga_client_id` como `client_id` no payload GA4.
  - Se disponíveis, inclui `ga_session_id` e `ga_session_number` como parâmetros de sessão para correlacionar com eventos frontend.
- **Payload enviado**: 
  - `name: 'purchase'`
  - `params` contendo: `transaction_id` (ID do pagamento), `value` (valor pago), `currency` (BRL), `payment_type` (`pix` ou `coupon`), `coupon` (se houver), `discount` (se houver) e `items` com informações do produto digital.
- **Por que server-side**: garante que a conversão só seja registrada quando o pagamento for realmente aprovado pelo Mercado Pago, evitando falsos positivos. Também funciona mesmo se o usuário fechar a aba antes do webhook ser processado.

**Fluxo completo de tracking de conversão:**

1. Usuário completa o teste e vê a página de resultados → `experiment_viewed` é enviado (frontend via Measurement Protocol).
2. Usuário clica em "Desbloquear" → `begin_checkout` é enviado (frontend via GTM).
3. QR Code PIX é gerado → `add_payment_info` é enviado (frontend via GTM).
4. Usuário paga via PIX → Mercado Pago confirma pagamento → webhook atualiza status no Supabase.
5. Edge Function `send-whatsapp-on-payment` detecta status `approved` → `purchase` é enviado (backend via Measurement Protocol).

Isso significa que:
- O **funil até o pagamento** é rastreado no frontend via GTM (engajamento, cliques, geração de QR Code).
- A **conversão final (purchase)** é garantida pelo backend, independente de recarregamentos/abas/navegador.

---

### Arquitetura de tracking - Resumo

**Fluxo de eventos:**

1. **Eventos de engajamento** (pageview, scroll, cliques, funil do teste):
   - Frontend → `dataLayer` (GTM) → GA4 via tags configuradas no GTM.

2. **Eventos críticos de negócio** (`experiment_viewed`, `purchase`):
   - Frontend/Backend → **GA4 Measurement Protocol** (HTTP POST direto) → GA4.
   - Também enviados para `dataLayer` quando aplicável (para compatibilidade).

**Identificadores GA4 (correlação de eventos):**

- **Frontend**: cookies `_ga` e `_ga_*` são lidos em `src/lib/gaCookies.ts` para capturar `ga_client_id`, `ga_session_id`, `ga_session_number`.
- **Backend**: esses identificadores são salvos na tabela `payments` quando um pagamento é criado.
- **Correlação**: quando o evento `purchase` é enviado do backend, ele usa os mesmos identificadores salvos, permitindo que o GA4 correlacione eventos frontend e backend do mesmo usuário.

**Decisões arquiteturais:**

- **GTM para eventos de engajamento**: permite flexibilidade para adicionar/remover tags sem alterar código, ideal para eventos não-críticos que podem ser configurados por não-desenvolvedores.
- **Measurement Protocol para eventos críticos**: garante que conversões e exposições a experimentos sejam sempre rastreadas, independente do estado do frontend ou problemas no GTM. Essencial para análises de A/B testing e cálculo de ROI.

Este documento descreve o **estado atual** do tracking (GTM + GA4) no projeto, servindo como referência para manutenção e futuras evoluções.

