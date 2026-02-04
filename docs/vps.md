# Documentação da VPS

Documentação enxuta da infraestrutura do servidor.

## Visão Geral

- **IP**: `[PREENCHER]`
- **Provedor**: `[PREENCHER]`
- **Especificações**: `[PREENCHER]`
- **Sistema Operacional**: `[PREENCHER]`

## Serviços

### Processos Principais

- **PM2**: `[LISTAR PROCESSOS]`
- **Nginx**: `[STATUS E CONFIGURAÇÕES]`
- **Outros**: `[LISTAR OUTROS SERVIÇOS]`

## Domínios

### Domínios Configurados

- `[DOMÍNIO 1]` - `[DESCRIÇÃO]`
- `[DOMÍNIO 2]` - `[DESCRIÇÃO]`

### SSL/TLS

- Certificados gerenciados via: `[LET'S ENCRYPT / CLOUDFLARE / OUTRO]`

## Deploy

### Processo Automático

- **Método**: GitHub App / Webhook / Outro
- **Branch**: `main`
- **Build**: `[COMANDO DE BUILD]`

### Aplicações em Produção

- **qual-carreira-seguir**: `[STATUS E INFORMAÇÕES]`
- **dashboard**: `[STATUS E INFORMAÇÕES]`

## Variáveis de Ambiente

### Aplicações

As seguintes variáveis são utilizadas (valores não documentados por segurança):

**qual-carreira-seguir:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROWTHBOOK_CLIENT_KEY`
- `NEXT_PUBLIC_GA4_API_SECRET`
- `[OUTRAS VARIÁVEIS]`

**dashboard:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `[OUTRAS VARIÁVEIS]`

## Notas

- Esta documentação deve ser atualizada quando houver mudanças na infraestrutura
- Valores sensíveis (senhas, tokens) não devem ser documentados aqui
