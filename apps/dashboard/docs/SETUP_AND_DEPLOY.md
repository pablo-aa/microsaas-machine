# Setup e deploy

## Pré-requisitos

- Node.js 18+ e npm
- Conta Supabase (projeto usado no app)
- Credenciais do Google Ads API
- Supabase CLI instalado globalmente

## Instalação local

```sh
cd apps/dashboard
npm install
```

Crie `.env.local` na raiz do app (veja seção Variáveis de ambiente). Depois:

```sh
npm run dev
```

## Configuração do backend

Antes de usar o frontend, faça o deploy das Edge Functions no Supabase.

1. **Linkar projeto:** `supabase link --project-ref <PROJECT_REF>`
2. **Criar tabelas de cache:** `supabase db push`
3. **Configurar secrets do Google Ads** (Supabase Dashboard ou CLI):
   - `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`
   - Opcional: `BASE_PRICE` (preço base, padrão 12.90)
4. **Deploy das Edge Functions:** `supabase functions deploy`

## Variáveis de ambiente

### Frontend (`.env.local`)

- `VITE_SUPABASE_URL` – URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` – Chave anon/public

### Backend (Supabase secrets)

Variáveis listadas na seção Configuração do backend; valores não documentados por segurança.

## Deploy

### Frontend

Build: `npm run build`. Deploy em qualquer plataforma Vite/React (ex.: Vercel). Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de deploy. SPA routing: use `vercel.json` ou equivalente (já incluído no projeto).

### Backend (Supabase)

```bash
supabase functions deploy
# Ou uma function específica: supabase functions deploy get-daily-metrics
```

## Desenvolvimento local (Edge Functions)

```bash
supabase start
supabase functions serve
# Testar: curl -X POST 'http://localhost:54321/functions/v1/get-daily-metrics' ...
```

## Scripts

- `npm run dev` – Servidor de desenvolvimento
- `npm run build` – Build de produção
- `npm run build:dev` – Build em modo desenvolvimento
- `npm run preview` – Preview do build
- `npm run lint` – ESLint
