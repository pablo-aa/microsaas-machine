# QualCarreira - Teste Vocacional Online

Plataforma de teste vocacional baseada em metodologias científicas (RIASEC, Gardner e GOPC) para ajudar pessoas a descobrirem sua carreira ideal.

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI baseados em Radix UI
- **Supabase** - Backend (banco de dados + Edge Functions)
- **Mercado Pago** - Processamento de pagamentos via PIX

## 📋 Pré-requisitos

- Node.js 18+ (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- npm ou yarn
- Conta no Supabase (para desenvolvimento local, opcional)

## 🛠️ Instalação

```bash
# 1. Clone o repositório
git clone <seu-repositorio-url>
cd qual-carreira-seguir

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env.local na raiz do projeto
# Edite .env.local com suas credenciais (ver seção Variáveis de Ambiente abaixo)
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto. Para lista completa, consulte [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md).

**Essenciais:**
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
GROWTHBOOK_CLIENT_KEY=sdk-xxx
NEXT_PUBLIC_GA4_API_SECRET=xxx
```

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento (localhost:3000)

# Build e produção
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção (após build)

# Qualidade de código
npm run lint         # Executa ESLint

# Deploy (Vercel - fallback)
npm run deploy              # Deploy em produção via Vercel
npm run deploy:preview     # Deploy de preview via Vercel
```

**Nota**: Deploy principal é automático via VPS (GitHub App). Vercel é usado apenas como fallback.

## 🏗️ Estrutura do Projeto

```
qual-carreira-seguir/
├── src/
│   ├── app/                    # Rotas Next.js (App Router)
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx          # Layout raiz
│   │   ├── avaliacao/[id]/     # Página de avaliação (60 questões)
│   │   ├── resultado/[id]/    # Página de resultados
│   │   ├── comeco/             # Início do teste
│   │   └── ...
│   ├── components/             # Componentes React
│   │   ├── pages/              # Componentes de página
│   │   ├── ui/                 # Componentes UI (shadcn)
│   │   └── ...                 # Outros componentes
│   ├── lib/                    # Utilitários e helpers
│   │   ├── analytics.ts        # Tracking GA4/GTM
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── assessmentStorage.ts # Persistência local
│   │   └── ...
│   ├── hooks/                  # React hooks customizados
│   ├── data/                   # Dados estáticos
│   │   ├── questions.ts        # Perguntas do teste
│   │   ├── contextualQuestions.ts # Questionário contextual
│   │   └── ...
│   ├── flags/                  # Feature flags (GrowthBook)
│   ├── config/                  # Configurações
│   │   └── mercadopago.ts      # Config Mercado Pago
│   └── assets/                  # Assets estáticos
├── supabase/
│   ├── functions/              # Edge Functions (13 functions)
│   └── migrations/              # Migrações do banco
├── public/                      # Arquivos estáticos
├── docs/                        # Documentação completa
├── nixpacks.toml                # Config build (VPS)
├── vercel.json                  # Config Vercel (fallback)
└── package.json
```

## 🗄️ Banco de Dados e Edge Functions

**Supabase**: PostgreSQL com RLS habilitado  
**Edge Functions**: 13 functions serverless

**Principais tabelas**: `test_results`, `test_responses`, `payments`, `discount_coupons`  
**Principais functions**: `create-result`, `create-payment`, `send-whatsapp-on-payment`, `unlock-result`

Para detalhes completos, consulte [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 🚢 Deploy

O projeto está configurado para deploy automático via **VPS** (GitHub App) com **Vercel como fallback**.

**VPS (Principal):**
- Deploy automático a cada push na branch `main`
- Configurado via GitHub App
- Build via `nixpacks.toml`

**Vercel (Fallback):**
- Mantido como backup
- Apontar DNS em caso de emergência

Para guia completo de deploy, consulte [`docs/DEPLOY.md`](docs/DEPLOY.md).

## 📚 Documentação

### Principais
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Banco de dados, Edge Functions e fluxos do sistema
- [`INTEGRATIONS.md`](docs/INTEGRATIONS.md) - Integrações, configurações e variáveis de ambiente
- [`DEPLOY.md`](docs/DEPLOY.md) - Guia de deploy (VPS, Vercel, Edge Functions)

### Específicos
- [`EXPERIMENT_SETUP_GUIDE.md`](docs/EXPERIMENT_SETUP_GUIDE.md) - Configuração de experimentos A/B
- [`CONTEXTUAL_QUESTIONNAIRE_STRUCTURE.md`](docs/CONTEXTUAL_QUESTIONNAIRE_STRUCTURE.md) - Estrutura do questionário contextual
- [`GTM_STATUS.md`](docs/GTM_STATUS.md) - Status do tracking via GTM + GA4
- [`WHATSAPP_WAAPI_IMPLEMENTATION.md`](docs/WHATSAPP_WAAPI_IMPLEMENTATION.md) - Implementação do WhatsApp
- [`CARREIRAS_E_INDICES.md`](docs/CARREIRAS_E_INDICES.md) - Dados de carreiras e índices

## 🧪 Desenvolvimento

### Ambiente de Desenvolvimento

O projeto inclui um banner de desenvolvimento (`DevBanner`) que aparece apenas em ambiente local, oferecendo:

- Perfis de teste pré-configurados para validação rápida
- Acesso rápido a funcionalidades de debug

### Testes

Para testar o fluxo completo:

1. Acesse a landing page (`/`)
2. Inicie o teste (`/comeco`)
3. Responda as 60 questões (`/avaliacao/:id`)
4. Preencha o formulário de dados
5. Visualize o resultado parcial (`/resultado/:id`)
6. Desbloqueie via pagamento PIX

## 📝 Licença

Projeto privado - QualCarreira

## 📞 Suporte

Para dúvidas técnicas: suporte@qualcarreira.com
