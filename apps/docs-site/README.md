# Documentação Site - MicroSaaS Machine

Este é o site de documentação do projeto MicroSaaS Machine, construído com [Docusaurus](https://docusaurus.io/).

## 🚀 Desenvolvimento Local

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install
```

### Executar Localmente

```bash
# Iniciar servidor de desenvolvimento
npm start
```

A documentação estará disponível em `http://localhost:3000`.

### Build

```bash
# Criar build de produção
npm run build

# Servir build localmente
npm run serve
```

## 📁 Estrutura

```
apps/docs-site/
├── docs/                   # Arquivos markdown da documentação
│   ├── index.md
│   └── vps.md
├── src/                    # Código fonte (CSS, componentes React)
├── static/                 # Arquivos estáticos (imagens, favicons)
├── docusaurus.config.ts    # Configuração principal
└── sidebars.ts             # Configuração da sidebar
```

## 🚢 Deploy

A documentação é deployada automaticamente no **Cloudflare Pages** a cada push na branch `main`.

- **URL de produção**: https://docs.octoper.com
- **Build command**: `cd apps/docs-site && npm install && npm run build`
- **Build output directory**: `apps/docs-site/build`

## 📝 Adicionar Nova Página

1. Crie um arquivo `.md` no diretório `apps/docs-site/docs/`
2. Adicione a referência no arquivo `sidebars.ts`
3. Faça commit e push - o deploy será automático
