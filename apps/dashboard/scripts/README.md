# Scripts

Esta pasta contém scripts auxiliares para o projeto. A maioria dos scripts está em desuso.

## Script Ativo

### `obter_refresh_token.py`

Script para obter o Refresh Token do Google Ads API via OAuth 2.0.

**Uso:**
```bash
python scripts/obter_refresh_token.py
```

**Requisitos:**
- Python 3
- Biblioteca `google-auth-oauthlib`: `pip install google-auth-oauthlib`
- Client ID e Client Secret do Google Cloud Console

**O que faz:**
1. Solicita as credenciais do Google Cloud Console
2. Abre o navegador para autorização OAuth
3. Obtém o refresh token necessário para autenticação na API do Google Ads
4. Exibe o token para ser adicionado aos secrets da Edge Function

**Importante:**
O refresh token obtido deve ser adicionado aos **secrets da Edge Function** do projeto `@microsaas-metrics-mvp/` para permitir a autenticação com a API do Google Ads.
