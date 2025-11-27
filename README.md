# MicroSaaS Metrics MVP 📊

Dashboard web para visualização de métricas de performance de um MicroSaaS, incluindo faturamento, custos de anúncios, ROAS e funil de conversão.

## 🎯 Sobre o Projeto

Este projeto migra um script Python local para uma solução web completa, integrando:

- **Frontend React** com dashboards interativos
- **Supabase Edge Functions** para processamento serverless
- **Google Ads API** para custos de publicidade
- **Sistema de cache** para otimização de performance

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e npm
- Conta Supabase (projeto: `iwovfvrmjaonzqlaavmi`)
- Credenciais do Google Ads API

### Instalação Local

```sh
# 1. Clone o repositório
git clone <YOUR_GIT_URL>
cd microsaas-metrics-mvp

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Configuração do Backend

**⚠️ IMPORTANTE:** Antes de usar o frontend, você precisa fazer o deploy das Edge Functions no Supabase.

Siga o guia completo em: **[SETUP_DEPLOYMENT.md](./SETUP_DEPLOYMENT.md)**

**Resumo dos passos:**

1. Instalar Supabase CLI: `npm install -g supabase`
2. Linkar projeto: `supabase link --project-ref iwovfvrmjaonzqlaavmi`
3. Criar tabelas: `supabase db push`
4. Configurar secrets do Google Ads (via CLI ou Dashboard)
5. Deploy das functions: `supabase functions deploy`

## 📁 Estrutura do Projeto

```
microsaas-metrics-mvp/
├── src/
│   ├── components/       # Componentes React
│   │   └── dashboard/    # Componentes do dashboard
│   ├── hooks/           # Custom hooks (useMetrics)
│   ├── services/        # API services (Supabase)
│   ├── types/           # TypeScript types
│   └── pages/           # Páginas da aplicação
├── supabase/
│   ├── functions/       # Edge Functions
│   │   ├── get-google-ads-cost/
│   │   └── get-daily-metrics/
│   └── migrations/      # Migrations SQL
├── SETUP_DEPLOYMENT.md  # 📖 Guia de setup completo
└── COMO_FUNCIONA_COLETA_DADOS.md  # Documentação técnica
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🛠️ Stack Tecnológico

### Frontend
- **Vite** - Build tool ultra-rápido
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **shadcn/ui** - Componentes UI
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos interativos
- **date-fns** - Manipulação de datas

### Backend
- **Supabase** - Backend as a Service
- **Edge Functions (Deno)** - Serverless functions
- **PostgreSQL** - Banco de dados
- **Google Ads API** - Integração de custos

## 🔌 APIs e Endpoints

### Frontend → Backend

O frontend se comunica com um único endpoint principal:

**`POST /functions/v1/get-daily-metrics`**

```typescript
// Request
{
  "start_date": "2025-01-15",
  "end_date": "2025-01-17"
}

// Response
{
  "period": { "start": "...", "end": "..." },
  "days": [
    {
      "date": "2025-01-15",
      "forms_submitted": 100,
      "payments_initiated": 10,
      "payments_approved": 5,
      "revenue": 64.50,
      "cost": 25.00,
      "profit": 39.50,
      "roas": 2.58
    }
  ],
  "totals": { ... }
}
```

## 💾 Sistema de Cache

O sistema utiliza cache inteligente para otimizar requisições:

- **Cache de Métricas**: Armazena respostas da API `get-analytics`
- **Cache de Custos**: Armazena custos do Google Ads
- **Regra Especial**: Dia atual nunca é cacheado (sempre busca dados atualizados)
- **Persistência**: Cache armazenado em tabelas PostgreSQL

## 🎨 Funcionalidades

- ✅ Dashboard com KPIs principais (Revenue, Ad Spend, ROAS, Total Approved)
- ✅ Gráfico de faturamento vs custos com ROAS
- ✅ Funil de conversão (Forms → Initiated → Approved)
- ✅ Tabela detalhada com métricas diárias
- ✅ Filtros de data (hoje, ontem, 7/14/30 dias, todos, personalizado)
- ✅ Loading states e error handling
- ✅ Responsivo (mobile-first)

## 🔐 Segurança

- Credenciais do Google Ads armazenadas como **Supabase Secrets**
- Nunca expostas no frontend ou código-fonte
- Acessíveis apenas pelas Edge Functions
- CORS configurado para requisições seguras
- RLS (Row Level Security) habilitado nas tabelas

## 🧪 Desenvolvimento Local

### Testar Edge Functions Localmente

```bash
# Iniciar Supabase local
supabase start

# Servir functions localmente
supabase functions serve

# Testar endpoint
curl -X POST 'http://localhost:54321/functions/v1/get-daily-metrics' \
  -H "Authorization: Bearer YOUR_LOCAL_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"start_date": "2025-01-15", "end_date": "2025-01-17"}'
```

### Variáveis de Ambiente

Crie `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://iwovfvrmjaonzqlaavmi.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**Como obter a Anon Key:**
1. Acesse: https://supabase.com/dashboard/project/iwovfvrmjaonzqlaavmi/settings/api
2. Copie o valor de "anon" / "public"

## 🚀 Deploy

### Frontend (Lovable)

O frontend pode ser deployado automaticamente via Lovable:

1. Acesse: [Lovable Project](https://lovable.dev/projects/eb35af2d-58a9-410d-87fb-5b2a959a1c11)
2. Clique em **Share → Publish**

### Backend (Supabase)

Veja instruções completas em: **[SETUP_DEPLOYMENT.md](./SETUP_DEPLOYMENT.md)**

```bash
# Deploy rápido das Edge Functions
supabase functions deploy
```

## 📚 Documentação Adicional

- **[SETUP_DEPLOYMENT.md](./SETUP_DEPLOYMENT.md)** - Guia completo de setup e deploy
- **[COMO_FUNCIONA_COLETA_DADOS.md](./COMO_FUNCIONA_COLETA_DADOS.md)** - Documentação técnica do fluxo de dados

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe e está configurado
- Certifique-se de que as variáveis começam com `VITE_`

### Erro: "Failed to fetch metrics"
- Verifique se as Edge Functions foram deployadas
- Teste os endpoints diretamente (veja SETUP_DEPLOYMENT.md)
- Verifique os logs no Supabase Dashboard

### Dados não aparecem
- Certifique-se de que o período selecionado tem dados
- Verifique se a Edge Function `get-analytics` está funcionando
- Verifique se as credenciais do Google Ads estão corretas

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir:

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit suas mudanças: `git commit -m 'feat: minha feature'`
3. Push para a branch: `git push origin feature/minha-feature`
4. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação em SETUP_DEPLOYMENT.md
2. Verifique os logs das Edge Functions no Supabase Dashboard
3. Entre em contato com o time de desenvolvimento

---

**Última atualização:** Novembro 2025
