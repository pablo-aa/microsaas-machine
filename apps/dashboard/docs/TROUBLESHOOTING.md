# Troubleshooting

## "Missing Supabase environment variables"
- Verifique `.env.local` na raiz do app e variáveis com prefixo `VITE_`; reinicie o servidor após alterar.

## "Failed to fetch metrics"
- Confirme deploy das Edge Functions: `supabase functions list`
- Teste endpoints com curl ou Postman; verifique logs no Supabase (Edge Functions → Logs)
- Confirme que `get-analytics` está disponível (pode ser function externa)

## Dados não aparecem
- Verifique se o período selecionado tem dados
- Confirme credenciais do Google Ads nos secrets do Supabase
- Limpe cache: botão "Hard refresh" no dashboard ou `localStorage.clear()`
- Verifique logs das Edge Functions

## Erro de autenticação
- Sessão pode ter expirado (faça logout e login)
- Confirme permissões do usuário no Supabase e logs de auth

## Cache não funciona
- Confirme criação das tabelas: `supabase db push`
- Verifique RLS (Row Level Security) e logs do Supabase

## Google Ads API retorna erro
- Verifique todos os secrets; `GOOGLE_ADS_CUSTOMER_ID` sem hífens
- Confirme token de desenvolvedor ativo e acesso à API na conta

## Recursos

- [Supabase](https://supabase.com/docs)
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [React](https://react.dev), [Vite](https://vitejs.dev)
