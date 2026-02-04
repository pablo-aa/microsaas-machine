# Arquitetura do Dashboard

Dashboard web para visualização de métricas de performance de um MicroSaaS (faturamento, custos de anúncios, ROAS, funil de conversão). Este projeto migra um script Python local para uma solução web completa.

## Componentes principais

- **Frontend (React + TypeScript)**: Interface com dashboards, tabelas e gráficos
- **Supabase Edge Functions (Deno)**: Processamento serverless das requisições
- **PostgreSQL**: Banco de dados com tabelas de cache e dados de negócio
- **Google Ads API**: Integração para custos de publicidade

## Fluxo de dados

```mermaid
graph TB
    Frontend[Frontend React] -->|POST /get-daily-metrics| EdgeFunction[get-daily-metrics]
    EdgeFunction -->|Busca métricas| AnalyticsAPI[get-analytics]
    EdgeFunction -->|Busca custos| GoogleAdsFunction[get-google-ads-cost]
    GoogleAdsFunction -->|Consulta API| GoogleAds[Google Ads API]
    GoogleAdsFunction -->|Cache| CostCache[(costs_cache PostgreSQL)]
    AnalyticsAPI -->|Cache| MetricsCache[(metrics_cache PostgreSQL)]
    Frontend -->|Cache LocalStorage| LocalCache[localStorage Cache]
    
    Frontend -->|GET /get-subscribers| SubscribersFunction[get-subscribers]
    Frontend -->|GET /get-questionnaire-stats| QuestionnaireFunction[get-questionnaire-stats]
    Frontend -->|CRUD| CouponsFunction[manage-coupons]
    Frontend -->|POST| RetroactiveFunction[apply-retroactive-discount]
    Frontend -->|GET /get-all-users| ExportFunction[get-all-users]
```

## Stack tecnológico

### Frontend
- Vite, React 18, TypeScript, shadcn/ui, Tailwind CSS, Recharts, date-fns, React Router, TanStack Query

### Backend
- Supabase (Backend as a Service), Edge Functions (Deno), PostgreSQL, Google Ads API

## Estrutura do projeto

```
apps/dashboard/
├── src/
│   ├── components/
│   │   ├── dashboard/          # KPIs, gráficos, tabela
│   │   ├── subscribers/        # Gráfico de questionário
│   │   └── ui/                 # shadcn/ui
│   ├── hooks/                  # useMetrics.ts
│   ├── pages/                  # Index, Subscribers, Coupons, Export, Login, Signup
│   ├── services/               # auth.ts, supabase.ts
│   ├── types/                  # metrics.ts
│   └── utils/                  # cache, dataAggregation, questionnaireLabels
├── supabase/
│   ├── functions/              # Edge Functions
│   └── migrations/             # Tabelas de cache
└── public/
```
