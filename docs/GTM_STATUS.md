## GTM & GA4 Status - QualCarreira

### Visão geral

- **Frontend**: eventos são enviados para o **Google Tag Manager (GTM)** via `dataLayer` usando o helper `pushToDataLayer` (`src/lib/gtm.ts`).
- **GA4 client-side**: cookies `_ga` e `_ga_*` são lidos em `src/lib/gaCookies.ts` para capturar `ga_client_id`, `ga_session_id` e `ga_session_number` quando o usuário cria um pagamento.
- **GA4 server-side**: o evento oficial de **purchase** é enviado via **Measurement Protocol** na Edge Function `supabase/functions/send-whatsapp-on-payment/index.ts`, usando os identificadores GA salvos na tabela `payments`.
- **Inicialização do GTM**: acontece no client via `initializeGTM()` chamado em `src/app/providers.tsx` (hook `useEffect`).

---

### Eventos disparados pelo frontend (via GTM)

Todos esses eventos são empurrados para o `dataLayer` por funções em `src/lib/analytics.ts` e hooks/componentes do app.

#### Pageview & engajamento

- **`page_view`**  
  - Origem: `usePageView` (`src/hooks/useGTM.ts`).  
  - Usado em: `src/app/page.tsx`, `src/app/comeco/page.tsx`, `src/app/faq/page.tsx`, páginas de conteúdo (`ComoFunciona`, `TermosDeUso`, `PoliticaDePrivacidade`) e `AvaliacaoPage`.

- **`scroll_depth`**  
  - Origem: `trackScrollDepth` (`src/lib/analytics.ts`) via `useScrollDepth` (`src/hooks/useGTM.ts`).  
  - Usado em: `src/app/page.tsx` (landing).

#### Funil do teste (assessment)

Funções em `src/lib/analytics.ts`, acionadas em `src/components/pages/AvaliacaoPage.tsx` e `src/hooks/useGTM.ts`:

- **`test_started`** – início do teste (`trackTestStarted`), chamado em `src/app/comeco/page.tsx`.
- **`test_question_answered`** – resposta de cada questão (`trackQuestionAnswered`).
- **`test_progress_checkpoint`** – checkpoint a cada 10 questões respondidas.
- **`test_navigation_back`** – clique em “voltar” na avaliação.
- **`test_resumed`** – retomada de um teste salvo.
- **`test_completed`** – conclusão das 60 questões.
- **`test_abandoned`** – abandono de teste (antes de terminar), rastreado por `useTestAbandonment` (`src/hooks/useGTM.ts`).

#### Formulário de dados

Funções em `src/lib/analytics.ts`, usadas em `src/components/pages/FormularioDadosPage.tsx`:

- **`form_viewed`** – quando a tela do formulário é exibida.
- **`form_field_interaction`** – foco/interação em um campo específico.
- **`form_submitted`** – envio bem-sucedido do formulário.
- **`form_error`** – erros de validação ou erro de envio.

#### Landing / CTAs

- **`cta_click_start_test`** / **`cta_click_learn_more`**  
  - Origem: `trackCTAClick` (`src/lib/analytics.ts`).  
  - Usado em: `Header`, `Hero`, `ComoFuncionaPage` (`src/components/Header.tsx`, `src/components/Hero.tsx`, `src/components/pages/ComoFuncionaPage.tsx`).

#### Pagamento (Mercado Pago PIX)

Funções em `src/lib/analytics.ts`, chamadas em `src/components/PaymentModal.tsx`:

- **`begin_checkout`** – abertura do modal / início do processo de pagamento (`trackBeginCheckout`).
- **`add_payment_info`** – QR Code gerado / pagamento iniciado (`trackAddPaymentInfo`).
- **`pix_code_copied`** – usuário copiou o código PIX (`trackPixCodeCopied`).
- **`payment_error`** – erros na criação do pagamento ou falhas de status (`trackPaymentError`).

> **Importante**: o evento **`purchase`** NÃO é mais enviado pelo frontend via GTM. Ele foi movido para o backend (ver seção abaixo).

---

### Evento de purchase (server-side GA4)

O evento de conversão **`purchase`** é tratado exclusivamente no backend, para evitar perdas de tracking e garantir consistência com o status real do pagamento.

- **Local**: `supabase/functions/send-whatsapp-on-payment/index.ts`.
- **Fonte dos dados**:
  - Tabela `payments`: `payment_id`, `amount`, `status`, `ga_client_id`, `ga_session_id`, `ga_session_number`, `coupon_code`, `original_amount`.
  - Mercado Pago: status e valor confirmados via API (`/v1/payments/{id}`).
- **Condições**:
  - Só envia o evento GA4 quando o status é `approved`.
  - Usa `ga_client_id` como `client_id` e, se disponíveis, `ga_session_id` + `ga_session_number` como parâmetros de sessão.
- **Payload GA4 (resumo)**:
  - `name: 'purchase'`
  - `params` contendo: `transaction_id`, `value`, `currency`, `payment_type` (`pix` ou `coupon`), `coupon` (se houver), `discount` (se houver) e `items` com o produto digital.

Isso significa que:
- O **funil até o pagamento** é rastreado no frontend via GTM.
- A **conversão final (purchase)** é garantida pelo backend, independente de recarregamentos/abas/navegador.

---

### Eventos legacy / removidos

Durante a migração de React SPA (Vite) para Next.js App Router, alguns eventos foram removidos ou desativados por não estarem mais em uso:

- **Removidos do código** (não existem mais em `src/lib/analytics.ts`):
  - `view_item`
  - `result_partial_viewed`
  - `unlock_button_clicked`
  - `result_full_viewed`
  - `result_tab_changed`
  - `result_section_expanded`
  - `coupon_applied`
  - `coupon_invalid`
  - `free_unlock`

- **`purchase` (frontend)**
  - A função `trackPurchase` continua apenas comentada em `src/lib/analytics.ts` como referência histórica.  
  - A lógica real de compra agora vive apenas no backend (Measurement Protocol).

---

### Resumo arquitetural do tracking

- **GTM**:
  - Inicializado em `src/app/providers.tsx` via `initializeGTM()` (`src/lib/gtm.ts`).
  - Todos os eventos frontend passam por `pushToDataLayer`.

- **GA4 (client)**:
  - Usa GTM + tags de GA4 configuradas no container.
  - Identificadores de cliente/sessão são lidos de cookies em `src/lib/gaCookies.ts` e enviados para o backend na criação do pagamento.

- **GA4 (server)**:
  - Evento `purchase` enviado em `send-whatsapp-on-payment` após confirmação real do pagamento.
  - Usa Measurement Protocol (`https://www.google-analytics.com/mp/collect`).

Esse documento descreve o **estado atual** do tracking (GTM + GA4) no projeto, servindo como referência para manutenção e futuras evoluções.

