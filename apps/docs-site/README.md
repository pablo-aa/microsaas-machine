# Documentação Site - MicroSaaS Machine

Este é o site de documentação do projeto MicroSaaS Machine, construído com [Docusaurus](https://docusaurus.io/).

## Conteúdo é gerado pelo sync

O diretório `docs/` dentro de `apps/docs-site/` é **preenchido automaticamente** pelo script `scripts/sync-docs.js` em cada `npm run build` (e no prebuild). **Não edite os arquivos em `apps/docs-site/docs/` manualmente** — as alterações seriam apagadas no próximo build.

As **fontes de verdade** da documentação são:

- `docs/` (raiz do monorepo) – index.md, vps.md
- `README.md` (raiz) – copiado como readme.md
- `apps/qual-carreira-seguir/docs/*.md` – documentação QualCarreira
- `apps/dashboard/README.md` – visão geral do Dashboard (copiada como dashboard/readme.md)
- `apps/dashboard/docs/*.md` – documentação temática do Dashboard (arquitetura, setup, Edge Functions, etc.)

## Desenvolvimento local

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install
```

### Executar localmente

```bash
# Iniciar servidor de desenvolvimento (o sync roda no prebuild do build; para dev o Docusaurus usa docs/ já existentes)
npm start
```

A documentação estará disponível em `http://localhost:3000`.

### Build

```bash
# Criar build de produção (executa sync-docs.js antes e depois gera o site)
npm run build

# Servir build localmente
npm run serve
```

## Estrutura

```
apps/docs-site/
├── docs/                   # Preenchido pelo sync a partir das fontes (raiz, apps)
├── scripts/
│   └── sync-docs.js        # Copia fontes → docs/ (rodado no prebuild)
├── src/                    # Código fonte (CSS, componentes React)
├── static/                 # Arquivos estáticos (imagens, favicons)
├── docusaurus.config.ts    # Configuração principal
└── sidebars.ts             # Configuração da sidebar (definida à mão)
```

## Adicionar ou alterar uma página

1. **Edite o arquivo na fonte** (não em `apps/docs-site/docs/`):
   - Página geral ou índice: `docs/index.md` ou `docs/vps.md` (raiz)
   - Sobre o projeto: `README.md` (raiz)
   - QualCarreira: adicione ou edite um `.md` em `apps/qual-carreira-seguir/docs/`
   - Dashboard: edite `apps/dashboard/README.md` ou um dos arquivos em `apps/dashboard/docs/`
2. Se for um **novo** documento (ex.: novo .md no QualCarreira), adicione a entrada correspondente em `sidebars.ts`.
3. Rode `npm run build` (o sync copia as fontes para `docs/` e o Docusaurus gera o site).
4. Faça commit e push; o deploy no Cloudflare Pages é automático na branch `main`.

## Deploy

A documentação é deployada automaticamente no **Cloudflare Pages** a cada push na branch `main`.

- **URL de produção**: https://docs.octoper.com
- **Build command**: `cd apps/docs-site && npm install && npm run build`
- **Build output directory**: `apps/docs-site/build`
