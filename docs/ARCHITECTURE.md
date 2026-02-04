# Arquitetura - QualCarreira

## Banco de Dados

**Supabase Project ID**: `iwovfvrmjaonzqlaavmi`  
**URL**: `https://iwovfvrmjaonzqlaavmi.supabase.co`

### Tabelas Principais

- **`test_results`** - Resultados dos testes (pontuações RIASEC, Gardner, GOPC, questionário contextual)
- **`test_responses`** - Respostas individuais das questões (60 questões)
- **`payments`** - Pagamentos via Mercado Pago (status, cupons, GA4 tracking)
- **`discount_coupons`** - Cupons de desconto (percentual, limites, expiração)
- **`user_roles`** - Roles de usuários (admin/user)
- **Tabelas de suporte**: `cron_job_logs`, `metrics_cache`, `costs_cache`

**Relacionamentos**: `test_results` → `test_responses`, `test_results` → `payments`, `auth.users` → `user_roles`

**Extensões**: pg_cron, pg_net, uuid-ossp, pgcrypto, http  
**RLS**: Habilitado na maioria das tabelas

## Edge Functions

**Total**: 13 functions | **Base URL**: `https://iwovfvrmjaonzqlaavmi.supabase.co/functions/v1/`

### Resultados
- `create-result` - Cria resultado do teste (POST)
- `get-result` - Busca resultado por ID (GET)

### Pagamentos
- `create-payment` - Cria pagamento PIX, valida cupons (POST)
- `check-payment-status` - Verifica status no Mercado Pago (POST)
- `check-unlock-status` - Polling para detectar pagamento aprovado (POST)
- `unlock-result` - Desbloqueia resultado (POST)
- `unlock-free-result` - Desbloqueia com cupom 100% (POST)

### Cupons
- `validate-coupon` - Valida cupom de desconto (POST)

### Notificações
- `send-whatsapp-on-payment` - Notifica WhatsApp e envia GA4 purchase (Webhook)
- `send-recovery-email` - Envia email de recuperação (POST/Cron)

### Analytics
- `get-analytics` - Retorna métricas do sistema (GET)
- `hourly-payment-report` - Relatório horário via WhatsApp (Cron)

### Utilitários
- `test-pushover` - Testa integração Pushover (POST)

**Deploy**: `supabase functions deploy <name>` ou `supabase functions deploy` (todas)

## Fluxos Principais

### Fluxo do Usuário
```
Landing → Teste (60 questões) → Questionário Contextual (opcional) → 
Formulário → Resultado Parcial → Pagamento → Resultado Completo
```

### Fluxo de Pagamento
```
Desbloquear → Validar Cupom → Criar PIX → Usuário Paga → 
Webhook Mercado Pago → Desbloqueia → Notifica WhatsApp → GA4 Purchase
```

### Fluxo de Analytics
```
Frontend → GTM Data Layer → GA4
Frontend/Backend → Measurement Protocol → GA4 → BigQuery → GrowthBook
```

**Notas**: GTM para eventos de engajamento, Measurement Protocol para eventos críticos (experiment_viewed, purchase)

## Referências

- Para integrações e variáveis, consulte [`INTEGRATIONS.md`](INTEGRATIONS.md)
- Para deploy, consulte [`DEPLOY.md`](DEPLOY.md)
- Para migrações, consulte `supabase/migrations/`
