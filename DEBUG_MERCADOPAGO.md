# 🔍 Debug: Erro no Mercado Pago (Dev Environment)

## Problema Atual
Em **DEV**, a geração do QR code está retornando erro: `Edge Function returned a non-2xx status code`  
Em **PROD**, está funcionando normalmente ✅

## Possíveis Causas

### 1. Token de Teste Expirado/Inválido
- Tokens de teste do Mercado Pago podem expirar ou ter suas permissões alteradas
- Verificar se o token TEST está configurado corretamente no Supabase (DEV)

### 2. Conta de Teste com Limitações
- Contas de teste do Mercado Pago têm limites de requisições
- Podem ter restrições de funcionalidades (ex: PIX de teste pode não estar habilitado)

### 3. Diferenças de Configuração
- Verificar se as variáveis de ambiente em DEV estão corretas
- Comparar configurações entre DEV e PROD

---

## 🧪 Teste Rápido: Usar Token de PROD em DEV

### Passo 1: Acessar Secrets do Supabase (PROD)
1. Ir para: https://supabase.com/dashboard/project/YOUR_PROD_PROJECT_ID/settings/vault
2. Localizar o secret `MERCADOPAGO_ACCESS_TOKEN`
3. Copiar o valor (começará com `APP_USR-...`)

### Passo 2: Temporariamente Usar Token de PROD em DEV
1. Ir para: https://supabase.com/dashboard/project/YOUR_DEV_PROJECT_ID/settings/vault
2. Localizar o secret `MERCADOPAGO_ACCESS_TOKEN`
3. **FAZER BACKUP** do valor atual (token de teste)
4. Substituir temporariamente pelo token de PROD
5. Testar a geração do QR code em DEV

### Passo 3: Adicionar Secret para Tipo de Token (Opcional)
Para facilitar debugging futuro:

```sql
-- No Supabase DEV, adicionar novo secret
-- Nome: MERCADOPAGO_TOKEN_TYPE
-- Valor: test

-- No Supabase PROD, adicionar novo secret  
-- Nome: MERCADOPAGO_TOKEN_TYPE
-- Valor: production
```

Isso permitirá identificar nos logs qual tipo de token está sendo usado.

### Passo 4: Analisar Resultado
- **Se funcionar com token de PROD**: problema está no token/conta de teste
- **Se NÃO funcionar**: problema está no código ou configuração do ambiente DEV

### Passo 5: Reverter (IMPORTANTE!)
Se o teste funcionou, **reverter imediatamente** o token de DEV para o token de teste original para não gerar cobranças reais em testes.

---

## 🔎 Como Investigar Logs da Edge Function

### Ver Logs em Tempo Real (Supabase Dashboard)
1. Ir para: https://supabase.com/dashboard/project/YOUR_DEV_PROJECT_ID/functions
2. Clicar em `create-payment`
3. Aba "Logs"
4. Tentar gerar um pagamento e observar logs em tempo real

### Logs Importantes a Verificar
```typescript
// Os logs adicionados no código mostrarão:
✓ test_id, email, name, assigned_price recebidos
✓ Token type sendo usado (test/production)
✓ Origin da requisição
✓ Transaction amount validado
✓ Response status do Mercado Pago
✓ Detalhes de erro específicos do MP
```

---

## 🛠️ Verificações no Mercado Pago (Conta de Teste)

### 1. Verificar Status da Aplicação de Teste
- Acessar: https://www.mercadopago.com.br/developers/panel/app
- Verificar se a aplicação de teste está ativa
- Confirmar que PIX está habilitado nas credenciais de teste

### 2. Gerar Novo Token de Teste
Se o token atual estiver com problemas:
1. Acessar aplicação de teste no painel
2. Ir em "Credenciais de teste"
3. Gerar novo Access Token de teste
4. Atualizar no Supabase DEV

### 3. Verificar Limites da Conta
- Contas de teste têm limites de requisições por dia
- Verificar se não excedeu o limite

---

## 📊 Comparação DEV vs PROD

| Item | DEV | PROD |
|------|-----|------|
| Token | TEST-xxx... | APP_USR-xxx... |
| Preço | R$ 14,90 | R$ 14,90 |
| Origin | localhost:8080 / lovable.app | qualcarreira.com |
| Conta MP | Teste | Produção |
| Limites | Restritos | Normais |

---

## 🚨 Erros Comuns do Mercado Pago

### 401 - Unauthorized
- Token inválido ou expirado
- Token não tem permissões necessárias

### 400 - Bad Request
- Payload inválido
- Dados do payer incompletos
- Email inválido

### 500 - Internal Server Error
- Problema temporário no Mercado Pago
- Tentar novamente em alguns minutos

---

## ✅ Checklist de Verificação

- [ ] Token de teste está configurado no Supabase DEV
- [ ] Token começa com `TEST-` (não `APP_USR-`)
- [ ] Aplicação de teste está ativa no painel MP
- [ ] PIX está habilitado nas credenciais
- [ ] assigned_price está sendo enviado corretamente
- [ ] test_id existe no banco de dados
- [ ] Email está em formato válido
- [ ] Logs da edge function mostram o erro específico
- [ ] Testar com token de PROD confirmou onde está o problema

---

## 🔄 Próximos Passos Após Diagnóstico

### Se o problema for o Token de Teste:
1. Gerar novo token de teste no Mercado Pago
2. Atualizar secret no Supabase DEV
3. Testar novamente

### Se o problema for o Código:
1. Verificar logs detalhados da edge function
2. Comparar payload enviado vs esperado pelo MP
3. Verificar validações de assigned_price
4. Testar localmente com Supabase CLI

### Se o problema for Limite da Conta:
1. Aguardar reset do limite (geralmente 24h)
2. Considerar criar nova conta de teste
3. Ou usar token de PROD temporariamente para testes críticos
