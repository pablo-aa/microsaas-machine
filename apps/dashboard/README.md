# MicroSaaS Metrics MVP

Dashboard web para visualização de métricas de performance (faturamento, custos de anúncios, ROAS, funil de conversão). Frontend React + Supabase Edge Functions + Google Ads API.

## Stack

- **Frontend**: Vite, React 18, TypeScript, shadcn/ui, Tailwind, Recharts, TanStack Query
- **Backend**: Supabase (Edge Functions em Deno, PostgreSQL)
- **Integrações**: Google Ads API (custos)

## Setup rápido

```sh
cd apps/dashboard
npm install
# Crie .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Antes de usar o app, faça deploy das Edge Functions e configure os secrets do Google Ads no Supabase. Detalhes em [Setup e deploy](docs/SETUP_AND_DEPLOY.md).

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md) – Fluxo de dados, stack, estrutura do projeto
- [Setup e deploy](docs/SETUP_AND_DEPLOY.md) – Instalação, backend, variáveis, deploy
- [Edge Functions](docs/EDGE_FUNCTIONS.md) – Endpoints e sistema de cache
- [Funcionalidades](docs/FEATURES.md) – Dashboard, assinantes, cupons, exportação, autenticação
- [Troubleshooting](docs/TROUBLESHOOTING.md) – Erros comuns e recursos

No site de documentação (docs.octoper.com), a seção Dashboard inclui todas essas páginas na navegação lateral.
