# Guia Rápido: Configurar Experimento A/B

## 1. GrowthBook: Feature Flag

1. Criar feature flag (ex: `payment_experience`)
   - Key: `payment_experience`
   - Type: `string`
   - Default: `"A"`

2. Criar experimento
   - Name: `qc-pricing-test`
   - Variations: `A` (controle), `B`, `C`
   - Traffic: 33.33% cada
   - Assignment attribute: `id` (V2 hashing)
   - Tracking key: `qc-pricing-test`

3. Publicar feature flag

## 2. Código: Consumir Flag

```typescript
// src/app/resultado/[id]/page.tsx (Server Component)
import { paymentExperienceFlag } from "@/flags/payment";

export default async function Page() {
  const variant = await paymentExperienceFlag();
  return <ResultadoPage paymentVariant={variant || "A"} />;
}
```

```typescript
// src/components/pages/ResultadoPage.tsx (Client Component)
interface ResultadoPageProps {
  paymentVariant?: string;
}

const ResultadoPage = ({ paymentVariant = "A" }: ResultadoPageProps) => {
  // Usar paymentVariant na lógica e passar para componentes filhos
  // ...
}
```

## 3. Tracking: Exposure Event

Enviar `experiment_viewed` diretamente para GA4 via Measurement Protocol:

```typescript
// No componente onde o experimento é "exposto"
useEffect(() => {
  const variantToVariationId: Record<string, number> = {
    'A': 0, 'B': 1, 'C': 2,
  };
  
  const variationId = variantToVariationId[paymentVariant] ?? 0;
  
  trackExperimentViewed('qc-pricing-test', variationId, paymentVariant);
  trackPageView(`/resultado/${id}`, paymentVariant);
}, [id, paymentVariant]);
```

**Importante**: Incluir `payment_variant` em TODOS os eventos relevantes (begin_checkout, purchase, etc.)

## 4. BigQuery: Custom Dimension

**GrowthBook > Data Sources > Dimensions > Create**

- Name: `Payment Variant`
- SQL:
```sql
SELECT 
  user_pseudo_id AS anonymous_id,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') AS value
FROM `qual-carreira.analytics_507559996.events_*`
WHERE (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') IS NOT NULL
```

## 5. GrowthBook: Métricas

**Experiment > Assignment Source**
- Type: `Fact Table`
- SQL:
```sql
SELECT 
  user_pseudo_id AS anonymous_id,
  TIMESTAMP_MICROS(event_timestamp) AS timestamp,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') AS experiment_id,
  CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') AS STRING) AS variation_id
FROM `qual-carreira.analytics_507559996.events_*`
WHERE event_name = 'experiment_viewed'
```

**Metric: Purchase (Taxa de Conversão)**
- Type: `Fact Table` (GA4 Events)
- Row filter: `event_name = 'purchase'`
- Associate dimension: `Payment Variant`
- **Tipo de agregação:** `Count` (conta eventos)

**Metric: Revenue per User (Receita por Usuário Exposto)**
- Type: `Fact Table` (GA4 Events)
- Row filter: `event_name = 'purchase'`
- Associate dimension: `Payment Variant`
- **Tipo de agregação:** `Sum` (soma o campo `value`)
- **Denominator:** `Users` (divide pela quantidade de usuários expostos)
- **SQL (se necessário):**
  ```sql
  SELECT 
    user_pseudo_id AS anonymous_id,
    TIMESTAMP_MICROS(event_timestamp) AS timestamp,
    (SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'value') AS value
  FROM `qual-carreira.analytics_507559996.events_*`
  WHERE event_name = 'purchase'
    AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') IS NOT NULL
  ```

**Importante:** Use a métrica "Revenue per User" como métrica principal para comparar qual variante gera mais receita por usuário exposto.

## 6. Validar

1. DebugView do GA4: conferir `experiment_viewed` com `experiment_id`, `variation_id`, `payment_variant`
2. BigQuery: confirmar eventos exportados (próximo dia)
3. GrowthBook > Analysis: verificar distribuição de usuários e conversões

### Validação: Última Fase (27/12/2025 02:31 UTC)

**Início da última fase:** `2025-12-27 02:31:00 UTC`

#### Query 1: Exposições por Variante (desde 27/12/2025 02:31 UTC)

```sql
-- Distribuição de exposições por variante (última fase)
SELECT 
  CASE 
    WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 0 THEN 'A'
    WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 1 THEN 'B'
    WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 2 THEN 'C'
    ELSE 'UNKNOWN'
  END AS variant,
  COUNT(*) AS exposicoes,
  COUNT(DISTINCT user_pseudo_id) AS usuarios_unicos,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentual
FROM `qual-carreira.analytics_507559996.events_*`
WHERE event_name = 'experiment_viewed'
  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') = 'qc-pricing-test'
  AND _TABLE_SUFFIX >= '20251227'
  AND TIMESTAMP_MICROS(event_timestamp) >= TIMESTAMP('2025-12-27 02:31:00', 'UTC')
GROUP BY variant
ORDER BY variant;
```

#### Query 2: Vendas por Variante (desde 27/12/2025 02:31 UTC)

```sql
-- Vendas por variante (última fase)
SELECT 
  COALESCE(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant'),
    'NULL'
  ) AS variant,
  COUNT(*) AS total_vendas,
  COUNT(DISTINCT user_pseudo_id) AS usuarios_unicos,
  ROUND(SUM(
    (SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'value')
  ), 2) AS receita_total
FROM `qual-carreira.analytics_507559996.events_*`
WHERE event_name = 'purchase'
  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') IS NOT NULL
  AND _TABLE_SUFFIX >= '20251227'
  AND TIMESTAMP_MICROS(event_timestamp) >= TIMESTAMP('2025-12-27 02:31:00', 'UTC')
GROUP BY variant
ORDER BY variant;
```

#### Query 3: Taxa de Conversão por Variante

```sql
-- Taxa de conversão: exposições vs compras (última fase)
WITH exposicoes AS (
  SELECT 
    CASE 
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 0 THEN 'A'
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 1 THEN 'B'
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 2 THEN 'C'
      ELSE 'UNKNOWN'
    END AS variant,
    COUNT(DISTINCT user_pseudo_id) AS usuarios_expostos
  FROM `qual-carreira.analytics_507559996.events_*`
  WHERE event_name = 'experiment_viewed'
    AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') = 'qc-pricing-test'
    AND _TABLE_SUFFIX >= '20251227'
    AND TIMESTAMP_MICROS(event_timestamp) >= TIMESTAMP('2025-12-27 02:31:00', 'UTC')
  GROUP BY variant
),
compras AS (
  SELECT 
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') AS variant,
    COUNT(DISTINCT user_pseudo_id) AS usuarios_compradores
  FROM `qual-carreira.analytics_507559996.events_*`
  WHERE event_name = 'purchase'
    AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') IS NOT NULL
    AND _TABLE_SUFFIX >= '20251227'
    AND TIMESTAMP_MICROS(event_timestamp) >= TIMESTAMP('2025-12-27 02:31:00', 'UTC')
  GROUP BY variant
)
SELECT 
  e.variant,
  e.usuarios_expostos,
  COALESCE(c.usuarios_compradores, 0) AS usuarios_compradores,
  ROUND(COALESCE(c.usuarios_compradores, 0) * 100.0 / e.usuarios_expostos, 2) AS taxa_conversao_pct
FROM exposicoes e
LEFT JOIN compras c ON e.variant = c.variant
ORDER BY e.variant;
```

#### Query 3.1: Faturamento por Variante

```sql
-- Receita total por variante (última fase)
WITH exposicoes AS (
  SELECT 
    CASE 
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 0 THEN 'A'
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 1 THEN 'B'
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 2 THEN 'C'
      ELSE 'UNKNOWN'
    END AS variant,
    COUNT(DISTINCT user_pseudo_id) AS usuarios_expostos
  FROM `qual-carreira.analytics_507559996.events_*`
  WHERE event_name = 'experiment_viewed'
    AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') = 'qc-pricing-test'
    AND _TABLE_SUFFIX >= '20251227'
    AND TIMESTAMP_MICROS(event_timestamp) >= TIMESTAMP('2025-12-27 02:31:00', 'UTC')
  GROUP BY variant
),
compras AS (
  SELECT 
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') AS variant,
    COUNT(*) AS total_compras,
    COUNT(DISTINCT user_pseudo_id) AS usuarios_compradores,
    ROUND(SUM((SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'value')), 2) AS receita_total,
    ROUND(AVG((SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'value')), 2) AS ticket_medio
  FROM `qual-carreira.analytics_507559996.events_*`
  WHERE event_name = 'purchase'
    AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') IS NOT NULL
    AND _TABLE_SUFFIX >= '20251227'
    AND TIMESTAMP_MICROS(event_timestamp) >= TIMESTAMP('2025-12-27 02:31:00', 'UTC')
  GROUP BY variant
)
SELECT 
  e.variant,
  e.usuarios_expostos,
  COALESCE(c.total_compras, 0) AS total_compras,
  COALESCE(c.usuarios_compradores, 0) AS usuarios_compradores,
  COALESCE(c.receita_total, 0) AS receita_total,
  COALESCE(c.ticket_medio, 0) AS ticket_medio,
  ROUND(COALESCE(c.receita_total, 0) / e.usuarios_expostos, 2) AS receita_por_usuario_exposto
FROM exposicoes e
LEFT JOIN compras c ON e.variant = c.variant
ORDER BY receita_total DESC;
```

#### Query 4: Validação de Consistência (variation_id vs payment_variant)

```sql
-- Verificar se variation_id corresponde ao payment_variant
WITH experiment_users AS (
  SELECT DISTINCT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') AS variation_id,
    CASE 
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 0 THEN 'A'
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 1 THEN 'B'
      WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') = 2 THEN 'C'
      ELSE 'UNKNOWN'
    END AS variant_esperado
  FROM `qual-carreira.analytics_507559996.events_*`
  WHERE event_name = 'experiment_viewed'
    AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') = 'qc-pricing-test'
    AND _TABLE_SUFFIX >= '20251227'
    AND TIMESTAMP_MICROS(event_timestamp) >= TIMESTAMP('2025-12-27 02:31:00', 'UTC')
),
purchase_users AS (
  SELECT DISTINCT
    user_pseudo_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') AS variant_real
  FROM `qual-carreira.analytics_507559996.events_*`
  WHERE event_name = 'purchase'
    AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'payment_variant') IS NOT NULL
    AND _TABLE_SUFFIX >= '20251227'
    AND TIMESTAMP_MICROS(event_timestamp) >= TIMESTAMP('2025-12-27 02:31:00', 'UTC')
)
SELECT 
  e.variant_esperado,
  p.variant_real,
  CASE 
    WHEN e.variant_esperado = p.variant_real THEN '✅ OK'
    ELSE '❌ INCONSISTENTE'
  END AS status,
  COUNT(*) AS ocorrencias
FROM experiment_users e
INNER JOIN purchase_users p ON e.user_pseudo_id = p.user_pseudo_id
GROUP BY e.variant_esperado, p.variant_real, status
ORDER BY status, e.variant_esperado;
```

**O que verificar:**
- ✅ Exposições balanceadas (~33% cada variante)
- ✅ `variation_id` corresponde ao `payment_variant` (0=A, 1=B, 2=C)
- ✅ Taxa de conversão calculada corretamente
- ✅ Receita total e ticket médio por variante
- ⚠️ Se houver inconsistências, verificar tracking no código

### Problema: Sample Ratio Mismatch (SRM) no GrowthBook

**Sintoma:** GrowthBook mostra warning "Sample Ratio Mismatch" e dados agrupados incorretamente (100% para cada variante em vez de ~33%).

**Causa:** O GrowthBook está usando "Payment Variant" como dimensão, mas o Assignment Source precisa retornar `variation_id` que corresponda EXATAMENTE às variations do experimento.

**Solução:**

1. **Verificar Assignment Source:**
   - GrowthBook > Experiment > Data Sources > Assignment Source
   - A query deve retornar `variation_id` como **STRING** correspondendo às variations do experimento
   - Se o experimento tem variations `A`, `B`, `C`, o `variation_id` deve ser `"A"`, `"B"`, `"C"` (não `"0"`, `"1"`, `"2"`)

2. **Assignment Source SQL (deve retornar "0", "1", "2"):**
   ```sql
   SELECT 
     user_pseudo_id AS anonymous_id,
     TIMESTAMP_MICROS(event_timestamp) AS timestamp,
     (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'experiment_id') AS experiment_id,
     CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'variation_id') AS STRING) AS variation_id
   FROM `qual-carreira.analytics_507559996.events_*`
   WHERE event_name = 'experiment_viewed'
   ```
   **Importante:** O `variation_id` deve ser `"0"`, `"1"`, `"2"` (strings) para corresponder às variations do experimento.

3. **Verificar Experiment Variations:**
   - GrowthBook > Experiment > Settings
   - Variations devem ter IDs: `0` (baseline), `1`, `2`
   - Os valores das variations podem ser `"A"`, `"B"`, `"C"` ou `"9,90"`, `"12,90"`, `"14,90"` (isso é só label)
   - O importante é que os **IDs** sejam `0`, `1`, `2`

4. **NÃO usar "Payment Variant" como dimensão na análise:**
   - Na aba "Results" do experimento, **remova** "Payment Variant" da dimensão
   - Use apenas as variations padrão do experimento (sem dimensão customizada)
   - "Payment Variant" deve ser usado **APENAS** na métrica de conversão (Purchase) para associar compras às variantes
   - O SRM acontece porque o GrowthBook está tentando cruzar "Payment Variant" (A, B, C) com `variation_id` (0, 1, 2) e não consegue fazer o match

5. **Revalidar após correção:**
   - Aguardar alguns minutos para o GrowthBook reprocessar
   - Verificar se o SRM warning desapareceu
   - Verificar se a distribuição está ~33% para cada variante

## Checklist Rápido

- [ ] Feature flag criada e publicada no GrowthBook
- [ ] Experimento configurado com variantes e %
- [ ] Flag consumida no código (server-side)
- [ ] `trackExperimentViewed` implementado (client-side)
- [ ] `payment_variant` incluído em todos os eventos de conversão
- [ ] Custom dimension criada no GrowthBook
- [ ] Assignment source configurada
- [ ] Métrica de conversão configurada
- [ ] Validação em DebugView/BigQuery
- [ ] Análise funcionando no GrowthBook

## Variáveis de Ambiente Necessárias

```bash
# .env.local e Vercel
GROWTHBOOK_CLIENT_KEY=sdk-xxx
NEXT_PUBLIC_GA4_API_SECRET=xxx
```

