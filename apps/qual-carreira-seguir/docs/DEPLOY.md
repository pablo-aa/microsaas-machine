# Deploy - QualCarreira

## Infraestrutura

**VPS (Principal)**: Deploy automático via GitHub App (push na `main`)  
**Vercel (Fallback)**: Deploy automático via GitHub, apontar DNS em emergência

## Ordem de Deploy

1. **Migração do banco** → `supabase db push`
2. **Edge Functions** → `supabase functions deploy [name]` ou `supabase functions deploy` (todas)
3. **Frontend** → Automático via GitHub (VPS) ou `vercel --prod` (Vercel)

## Migrações

```bash
supabase db push
```

**Nota**: Migrações usam `IF NOT EXISTS` e colunas nullable para zero downtime.

## Edge Functions

**Variáveis**: Configurar no dashboard Supabase (Edge Functions > Settings > Secrets)

Ver [`INTEGRATIONS.md`](INTEGRATIONS.md) para lista completa de variáveis.

## Frontend

### VPS (Principal)
- Deploy automático via GitHub App
- Variáveis: configurar no servidor/process manager
- Build: `nixpacks.toml`

### Vercel (Fallback)
- Deploy automático via GitHub (mantido ativo)
- Variáveis: dashboard Vercel (Settings > Environment Variables)
- Deploy manual: `vercel --prod`

## Fallback (VPS → Vercel)

**Processo**:
1. Acessar painel DNS
2. Alterar registros A/AAAA/CNAME para Vercel
3. Aguardar propagação (5-15 min)
4. Verificar: `curl https://qualcarreira.com`

**Reversão**: Após resolver problema na VPS, reverter DNS e aguardar propagação.

**Nota**: Vercel sempre atualizado via deploy automático.

## Referências

- Para arquitetura, consulte [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Para integrações e variáveis, consulte [`INTEGRATIONS.md`](INTEGRATIONS.md)
