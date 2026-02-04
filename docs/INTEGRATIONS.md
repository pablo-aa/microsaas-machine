# Integrações e Configurações - QualCarreira

## Variáveis de Ambiente

### Frontend (Next.js)
- `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `GROWTHBOOK_CLIENT_KEY` - Client key do GrowthBook
- `NEXT_PUBLIC_GA4_API_SECRET` - Secret para Measurement Protocol

### Backend (Edge Functions)
- `SUPABASE_URL` - URL do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (privilegiada)
- `MERCADOPAGO_ACCESS_TOKEN` - Token do Mercado Pago
- `RESEND_API_KEY` - API key do Resend (emails)
- `WAAPI_TOKEN`, `WAAPI_INSTANCE_ID`, `WAAPI_CHAT_ID` - WhatsApp
- `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` - GA4 Measurement Protocol
- `PUSHOVER_USER_KEY`, `PUSHOVER_API_TOKEN` - Pushover
- `PUBLIC_URL` - URL pública da aplicação

**Configuração**: Frontend em `.env.local`, Backend no dashboard Supabase (Edge Functions > Settings > Secrets)

## Supabase

- **Project ID**: `iwovfvrmjaonzqlaavmi`
- **URL**: `https://iwovfvrmjaonzqlaavmi.supabase.co`
- **Database**: PostgreSQL com RLS
- **Edge Functions**: 13 functions
- **Extensions**: pg_cron, pg_net, uuid-ossp, pgcrypto, http

## Mercado Pago

- **Public Key**: `APP_USR-40aea4f7-a179-402a-a1b8-f3b4bfed380e`
- **Preço**: R$ 12,90 (fixo após experimento A/B)
- **Webhook**: `https://iwovfvrmjaonzqlaavmi.supabase.co/functions/v1/send-whatsapp-on-payment`
- **Eventos**: `payment.updated`

## GrowthBook

- **Feature Flags**:
  - `payment_experience` (pausada - experimento concluído)
  - `contextual_questionnaire_enabled` (ativa)
- **Experimentos**: `qc-pricing-test` (concluído), `qc-contextual-questionnaire-test` (ativo)

## Google Analytics 4

- **Measurement ID**: `G-77JYHQR2GR`
- **Measurement Protocol**: Habilitado para eventos críticos
- **Eventos principais**: `experiment_viewed`, `purchase` (via Measurement Protocol)
- **GTM**: Usado para eventos de engajamento (pageview, scroll, cliques)

## WAAPI (WhatsApp)

- **Instance ID**: `60123`
- **Endpoint**: `https://waapi.app/api/v1/instances/{INSTANCE_ID}/client/action/send-message`
- Ver [`WHATSAPP_WAAPI_IMPLEMENTATION.md`](WHATSAPP_WAAPI_IMPLEMENTATION.md) para detalhes

## Resend (Email)

- Usado para emails de recuperação de resultado

## Pushover

- Usado para notificações de pagamentos aprovados

## Infraestrutura

### VPS (Principal)
- Deploy automático via GitHub App (push na `main`)
- Build via `nixpacks.toml`

### Vercel (Fallback)
- Deploy automático via GitHub (mantido como backup)
- Apontar DNS em caso de emergência

### Cron Jobs (Supabase)
- Recovery Email (via pg_cron)
- Hourly Payment Report (via pg_cron)

## Notas de Segurança

- Nunca commitar variáveis de ambiente no código
- Service Role Key apenas em Edge Functions
- Variáveis `NEXT_PUBLIC_*` são expostas ao cliente

## Referências

- Para arquitetura, consulte [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Para deploy, consulte [`DEPLOY.md`](DEPLOY.md)
