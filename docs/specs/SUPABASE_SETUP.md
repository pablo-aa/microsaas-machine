# Supabase Setup e Deploy de Edge Functions

Este documento descreve como configurar o Supabase e como automatizar (via scripts simples) o deploy das Edge Functions em DEV e em PROD, sem usar CI/CD.

## Requisitos

- Supabase CLI instalado: `npm i -g supabase`
- Fazer login no CLI: `supabase login`
- Ter os `project ref` de DEV e PROD (ex.: `sqmkerddgvshfqwgwnyc` para DEV, `iwovfvrmjaonzqlaavmi` para PROD)
- Configurar variáveis de ambiente no seu shell:

```bash
export SUPABASE_PROJECT_REF_DEV="<seu_dev_project_ref>"
export SUPABASE_PROJECT_REF_PROD="<seu_prod_project_ref>"
```

> Alternativa: você pode criar um arquivo `.env.local` e exportar antes de rodar os scripts.

## Configuração das Edge Functions

O arquivo `supabase/config.toml` controla flags como `verify_jwt` por função. Atualmente estão configuradas:

- `create-payment`
- `check-payment-status`
- `create-result`
- `get-result`
- `unlock-result`
- `get-analytics`

- `send-whatsapp-on-payment`

A função `process-payment-webhook` foi removida por não ser utilizada no fluxo atual (o front realiza polling via `check-payment-status`).

## Deploy Automático (DEV)

Para fazer deploy de todas as funções em DEV após qualquer modificação:

```bash
npm run deploy:functions:dev
```

Este comando percorre `supabase/functions/*` e realiza `supabase functions deploy <nome>` para cada função, usando o `project ref` de DEV.

Para testar webhooks do Mercado Pago, certifique-se que a função `send-whatsapp-on-payment` está publicada e que o `notification_url` do pagamento aponta para:
`<SUPABASE_URL>/functions/v1/send-whatsapp-on-payment`.

## Deploy Automático (PROD)

Depois de validar em DEV, para publicar as mesmas funções em PROD:

```bash
npm run deploy:functions:prod
```

## Variáveis de Ambiente (Supabase)

Caso suas funções dependam de segredos (ex.: `MERCADOPAGO_ACCESS_TOKEN`), defina-os no Dashboard do Supabase em cada projeto (DEV/PROD) em: `Project Settings → API → Edge Functions → Environment Variables`.

Para a função `send-whatsapp-on-payment`, configure:
- `WAAPI_TOKEN` (já criado) — token Bearer do WAAPI
- `WAAPI_CHAT_ID` (opcional) — ID do chat/grupo no WhatsApp; se não definido, usa `120363421610156383@g.us`

Observação: O endpoint do WAAPI utilizado é `https://waapi.app/api/v1/instances/60123/client/action/send-message`.

## Dicas

- Se preferir, você pode usar `supabase link --project-ref <REF>` para fixar um projeto no diretório antes do deploy, mas os scripts já passam `--project-ref` explicitamente.
- Sempre valide o fluxo completo em DEV antes de publicar em PROD.
- Os scripts não fazem migrações de banco. Use o arquivo `SUPABASE_MIGRATION.sql` manualmente conforme necessário.