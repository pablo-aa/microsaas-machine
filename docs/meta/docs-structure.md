# Onde colocar nova documentação

Este documento descreve onde criar ou editar arquivos de documentação no monorepo, para que o conteúdo apareça no site (docs.octoper.com) de forma correta.

## Fontes de verdade (não editar docs-site/docs/)

O site Docusaurus em `apps/docs-site/` não é editado diretamente. O diretório `apps/docs-site/docs/` é preenchido pelo script `sync-docs.js` a partir das fontes abaixo. Sempre edite na **fonte** e, se for documento novo, atualize `apps/docs-site/sidebars.ts`.

## Documentação geral e infraestrutura

| Conteúdo | Onde colocar |
|----------|----------------|
| Índice da documentação, links para todas as seções | `docs/index.md` (raiz) |
| Infraestrutura (VPS, Coolify, Traefik, deploy) | `docs/vps.md` (raiz) |
| Visão geral do monorepo e das aplicações | `README.md` (raiz) — vira "Sobre o Projeto" no site |

## Documentação por aplicação

### QualCarreira

- **README do app**: `apps/qual-carreira-seguir/README.md` — setup, scripts, variáveis. Não é copiado para o site; no site a entrada da seção QualCarreira são os docs temáticos.
- **Docs temáticos** (arquitetura, integrações, deploy, guias): `apps/qual-carreira-seguir/docs/*.md`. Cada `.md` é copiado para o site e deve estar listado em `sidebars.ts` na categoria "QualCarreira".
- Para **novo tema**: crie `apps/qual-carreira-seguir/docs/NOME_DO_ARQUIVO.md` (ex.: `FEATURE_X.md`). O sync normaliza o nome (minúsculas, hífens). Adicione o item em `sidebars.ts`, por exemplo: `'qual-carreira-seguir/nome-do-arquivo'`.

### Dashboard

- **Visão geral**: `apps/dashboard/README.md` — copiada como `/dashboard/readme`.
- **Docs temáticos**: `apps/dashboard/docs/*.md` — arquitetura, setup e deploy, Edge Functions, funcionalidades, troubleshooting. Cada `.md` é copiado para o site e listado em `sidebars.ts` na categoria "Dashboard".
- **Novo tema**: crie `apps/dashboard/docs/NOME_DO_ARQUIVO.md` e adicione o item em `sidebars.ts` (ex.: `'dashboard/nome-do-arquivo'`).

## Resumo do fluxo

1. Editar o arquivo na pasta correta (raiz `docs/`, raiz `README.md`, ou `apps/<app>/docs/` ou `apps/<app>/README.md`).
2. Se for documento novo no QualCarreira (ou no Dashboard quando houver `docs/`): adicionar entrada em `apps/docs-site/sidebars.ts`.
3. Rodar `npm run build` em `apps/docs-site` (o sync roda no prebuild).
4. Deploy: push na `main` dispara o build no Cloudflare Pages.
