# Edge Functions

O projeto utiliza 7 Edge Functions no Supabase.

## 1. get-daily-metrics

Orquestrador principal: combina métricas e custos.

- **Método**: POST  
- **Endpoint**: `/functions/v1/get-daily-metrics`  
- **Request**: `{ start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD" }`  
- **Response**: Array de métricas diárias (revenue, cost, profit, ROAS, conversões)  
- Busca métricas do `get-analytics`, custos do `get-google-ads-cost` (com cache), combina e calcula ROAS e profit; processa em batches de 5 dias.

## 2. get-google-ads-cost

Busca custos do Google Ads.

- **Método**: POST  
- **Endpoint**: `/functions/v1/get-google-ads-cost`  
- **Request**: `{ date: "YYYY-MM-DD" }` ou `{ start_date, end_date }`  
- **Response**: Custos em reais e micros  
- Consulta Google Ads API (GAQL); cache em PostgreSQL (`costs_cache`); range até 90 dias.

## 3. get-subscribers

Lista de assinantes paginada.

- **Método**: GET  
- **Endpoint**: `/functions/v1/get-subscribers?page=1&limit=50&search=termo`  
- **Response**: Array de assinantes com paginação  

## 4. get-questionnaire-stats

Estatísticas do questionário contextual.

- **Método**: GET  
- **Endpoint**: `/functions/v1/get-questionnaire-stats?question=q1&getAll=true`  
- **Response**: Estatísticas de distribuição das respostas  

## 5. manage-coupons

CRUD de cupons.

- **Métodos**: GET, POST, PATCH, DELETE  
- **Endpoint**: `/functions/v1/manage-coupons`  

## 6. apply-retroactive-discount

Aplica desconto retroativo.

- **Método**: POST  
- **Endpoint**: `/functions/v1/apply-retroactive-discount`  
- **Request**: `{ test_id: "uuid", coupon_code: "CODIGO" }`  

## 7. get-all-users

Exportação de usuários.

- **Método**: GET  
- **Endpoint**: `/functions/v1/get-all-users?limit=1000&cursor=xxx&startDate=...&endDate=...`  
- **Response**: Array com paginação cursor-based  

---

## Sistema de cache

Cache em duas camadas:

### Frontend (localStorage)

- **Arquivo**: `src/utils/cache.ts`  
- **Duração**: 24 horas  
- **Regras**: range histórico cacheado 24h; range incluindo hoje: histórico cacheado + dia atual sempre fresco. Chave: `metrics_cache_{startDate}_{endDate}`  

### Backend (PostgreSQL)

- **Tabelas**: `metrics_cache`, `costs_cache` (definidas em `supabase/migrations/`)  
- Custos Google Ads cacheados por data; dia atual nunca cacheado.  

### Regras

- Dia atual nunca é cacheado (frontend e backend).  
- Range incluindo hoje: combina histórico cacheado + dia atual.  
- Expiração e limpeza automática conforme configuração.  
