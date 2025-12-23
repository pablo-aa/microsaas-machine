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
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
# Outras variáveis conforme necessário
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

# Deploy
npm run deploy              # Deploy em produção via Vercel
npm run deploy:preview     # Deploy de preview via Vercel
```

## 🏗️ Estrutura do Projeto

```
qual-carreira-seguir/
├── src/
│   ├── app/              # Rotas Next.js (App Router)
│   │   ├── page.tsx      # Landing page
│   │   ├── layout.tsx    # Layout raiz
│   │   ├── avaliacao/    # Página de avaliação
│   │   ├── resultado/     # Página de resultados
│   │   └── ...
│   ├── components/       # Componentes React
│   │   ├── pages/        # Componentes de página
│   │   └── ui/           # Componentes UI (shadcn)
│   ├── lib/              # Utilitários e helpers
│   ├── hooks/            # React hooks customizados
│   ├── data/             # Dados estáticos (perguntas, etc)
│   └── types/            # Definições TypeScript
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Migrações do banco
├── public/               # Arquivos estáticos
└── docs/                 # Documentação
```

## 🗄️ Banco de Dados (Supabase)

O projeto usa Supabase como backend. Principais tabelas:

- `test_results` - Resultados dos testes vocacionais
- `test_responses` - Respostas individuais das questões
- `payments` - Registros de pagamentos
- `discount_coupons` - Cupons de desconto

Para configurar o banco, consulte `docs/specs/SUPABASE_SETUP.md`.

## 🔌 Edge Functions

As Edge Functions do Supabase estão em `supabase/functions/`:

- `create-result` - Cria resultado do teste
- `get-result` - Busca resultado por ID
- `unlock-result` - Desbloqueia resultado após pagamento
- `create-payment` - Cria pagamento via Mercado Pago
- `check-payment-status` - Verifica status do pagamento
- `validate-coupon` - Valida cupons de desconto
- E outras...

## 🚢 Deploy

O projeto está configurado para deploy automático via **Vercel**:

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no dashboard da Vercel
3. Deploys automáticos a cada push na branch `main`

Ou use os comandos manuais:

```bash
npm run deploy        # Deploy em produção
npm run deploy:preview # Deploy de preview
```

## 📚 Documentação

Documentação técnica está em `docs/`:

- `specs/SUPABASE_SETUP.md` - Setup e deploy de Edge Functions
- `specs/ADMIN_CUPONS_SPEC.md` - Especificação do sistema de cupons
- `specs/CUPONS_TESTING_CHECKLIST.md` - Checklist de testes
- `GTM_STATUS.md` - Status atual do tracking via GTM + GA4
- `specs/VALIDATION_TEST.md` - Guia de validação e perfis de teste

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
