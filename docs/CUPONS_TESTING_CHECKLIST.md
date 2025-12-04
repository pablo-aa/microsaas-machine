# Checklist de Testes - Sistema de Cupons

## ✅ Correções Aplicadas (Última Revisão)

### 1. Analytics com cupom nos eventos de e-commerce
- ✅ `trackBeginCheckout` agora aceita `coupon` e `discountedPrice`
- ✅ `trackAddPaymentInfo` agora aceita `coupon` e `discountedPrice`
- ✅ `trackPurchase` agora aceita `coupon` e `discountedPrice`
- ✅ PaymentModal passa cupom para os eventos

### 2. Proteção contra undefined
- ✅ `handleFreeUnlock` verifica se `coupon.code` existe antes de usar
- ✅ `unlock-result` converte `paymentId` para string (fix: TypeError)

---

## 🧪 Cenários de Teste

### **Cenário 1: Sem cupom (fluxo normal)**

**Passos:**
1. Acessar `/?cupom=` (sem código)
2. Fazer o teste completo
3. Ver resultado parcial
4. Clicar em "Desbloquear Resultados"
5. Modal abre com preço: **R$ 12,90**
6. Gerar PIX e pagar

**Esperado:**
- ✅ Preço: R$ 12,90
- ✅ QR Code gerado
- ✅ Pagamento via Mercado Pago
- ✅ Analytics sem campo `coupon`
- ✅ Desbloqueio após pagamento aprovado

---

### **Cenário 2: Cupom 20% via URL**

**Passos:**
1. Acessar `/?cupom=TESTE20`
2. Toast aparece: "🎉 TESTE20 aplicado! 20% OFF"
3. Fazer o teste completo
4. Ver resultado parcial
5. PaymentSection mostra:
   - Preço original: ~~R$ 12,90~~
   - Preço com desconto: **R$ 10,32**
   - Badge: "Cupom TESTE20 aplicado"
6. Clicar em "Desbloquear Resultados"
7. Modal mostra: **R$ 10,32**
8. Gerar PIX e verificar valor

**Esperado:**
- ✅ Toast ao entrar com cupom
- ✅ Preço atualizado: R$ 10,32
- ✅ QR Code com valor R$ 10,32
- ✅ Analytics com `coupon: "TESTE20"`
- ✅ DB: `payments.coupon_code = "TESTE20"`
- ✅ DB: `payments.original_amount = 12.90`
- ✅ DB: `payments.amount = 10.32`
- ✅ WhatsApp notification inclui cupom

---

### **Cenário 3: Cupom 50% via URL**

**Passos:**
1. Acessar `/?cupom=AMIGO50`
2. Toast: "🎉 AMIGO50 aplicado! 50% OFF"
3. Fazer o teste
4. Ver PaymentSection com: **R$ 6,45**
5. Modal mostra: **R$ 6,45**
6. Pagar

**Esperado:**
- ✅ Preço correto: R$ 6,45
- ✅ PIX com R$ 6,45
- ✅ Analytics com `coupon: "AMIGO50"`

---

### **Cenário 4: Cupom 100% (Gratuito)**

**Passos:**
1. Acessar `/?cupom=GRATIS100`
2. Toast: "🎁 Acesso GRATUITO aplicado!"
3. Fazer o teste
4. Ver resultado parcial
5. **IMPORTANTE:** Não aparece seção de PIX
6. Aparece botão especial: **"🎁 Desbloquear Gratuitamente"**
7. Clicar no botão
8. Resultado é desbloqueado instantaneamente

**Esperado:**
- ✅ Sem QR Code / PIX
- ✅ Botão especial aparece
- ✅ Desbloqueio funciona
- ✅ DB: payment com `FREE_` prefix
- ✅ DB: `amount = 0.00`
- ✅ Analytics: `trackFreeUnlock` disparado
- ✅ WhatsApp notification enviada
- ✅ Email de boas-vindas enviado

---

### **Cenário 5: Cupom inválido**

**Passos:**
1. Acessar `/?cupom=INVALIDO999`
2. Verificar toast de erro

**Esperado:**
- ✅ Toast: "Cupom inválido"
- ✅ Preço volta para R$ 12,90
- ✅ localStorage limpo
- ✅ Analytics: `trackCouponInvalid` disparado

---

### **Cenário 6: Cupom expirado**

**Criar cupom expirado:**
```sql
INSERT INTO discount_coupons (code, discount_percentage, expires_at)
VALUES ('EXPIRADO', 30, now() - interval '1 day');
```

**Passos:**
1. Acessar `/?cupom=EXPIRADO`
2. Verificar toast de erro

**Esperado:**
- ✅ Toast: "Cupom inválido" ou "Cupom expirado"
- ✅ Preço R$ 12,90

---

### **Cenário 7: Cupom com max_uses esgotado**

**Criar cupom esgotado:**
```sql
INSERT INTO discount_coupons (code, discount_percentage, max_uses, current_uses)
VALUES ('ESGOTADO', 40, 10, 10);
```

**Passos:**
1. Acessar `/?cupom=ESGOTADO`
2. Verificar toast

**Esperado:**
- ✅ Toast: "Cupom inválido" ou "Limite de usos atingido"
- ✅ Preço R$ 12,90

---

### **Cenário 8: Trocar cupom durante sessão**

**Passos:**
1. Acessar `/?cupom=TESTE20`
2. Toast: "TESTE20 aplicado! 20% OFF"
3. **SEM fechar aba**, acessar `/?cupom=AMIGO50`
4. Toast: "Cupom anterior substituído"
5. Toast: "AMIGO50 aplicado! 50% OFF"
6. Abrir modal de pagamento
7. Verificar preço no modal

**Esperado:**
- ✅ Toast de substituição aparece
- ✅ Novo cupom aplicado
- ✅ Preço atualizado: R$ 6,45
- ✅ QR Code novo gerado com R$ 6,45

---

### **Cenário 9: Cupom aplicado via Dashboard (Backend)**

**Passos no dashboard admin:**
1. No dashboard, aplicar cupom `ADMIN30` para test_id `{id}`
2. Inserir no banco:
```sql
INSERT INTO payments (test_id, user_email, payment_id, amount, original_amount, status, coupon_code)
VALUES ('{id}', 'user@test.com', 'ADMIN_123', 9.03, 12.90, 'pending', 'ADMIN30');
```

**Passos no frontend:**
1. Usuário acessa `/resultado/{id}`
2. Sistema detecta cupom no backend
3. Toast: "🎯 Cupom especial aplicado! ADMIN30 - 30% de desconto"
4. PaymentSection mostra R$ 9,03

**Esperado:**
- ✅ Toast automático ao carregar
- ✅ Cupom backend tem prioridade sobre localStorage
- ✅ Preço atualizado para R$ 9,03

---

### **Cenário 10: Entrar direto na página de resultado com cupom**

**Passos:**
1. Fazer teste
2. Obter URL: `/resultado/{id}`
3. Fechar aba
4. Acessar: `/resultado/{id}?cupom=TESTE20`
5. Toast de cupom aplicado

**Esperado:**
- ✅ Cupom capturado na entrada
- ✅ Toast aparece
- ✅ Preço atualizado

---

## 🔍 Edge Cases

### **Edge Case 1: Pagamento pendente com cupom + Novo pagamento sem cupom**

**Cenário:**
1. Criar pagamento com cupom TESTE20 → Pendente
2. Limpar localStorage
3. Tentar criar novo pagamento (sem cupom)

**Esperado:**
- ✅ Sistema reusa pagamento antigo com cupom
- ✅ Preço correto mantido

---

### **Edge Case 2: Race condition em cupom com max_uses**

**Cenário:**
1. Cupom com `max_uses = 1`, `current_uses = 0`
2. Dois usuários tentam usar simultaneamente

**Esperado:**
- ✅ Apenas 1 consegue usar
- ✅ Segundo recebe erro "limite atingido"
- ✅ Função SQL `increment_coupon_usage` garante atomicidade

---

### **Edge Case 3: Duplo clique em "Desbloquear Gratuitamente"**

**Cenário:**
1. Cupom 100%
2. Clicar rapidamente 2x no botão

**Esperado:**
- ✅ Botão desabilitado após primeiro clique
- ✅ Função `unlock-free-result` é idempotente
- ✅ Não cria pagamentos duplicados

---

### **Edge Case 4: Cupom 100% sem email de notificação**

**Cenário:**
1. Usar cupom GRATIS100
2. Verificar se email/WhatsApp são enviados

**Esperado:**
- ✅ `send-whatsapp-on-payment` é invocado
- ✅ Email é enviado normalmente
- ✅ GA4 purchase event disparado

---

## 🔧 Verificações Técnicas

### **Backend:**

```bash
# Verificar logs das edge functions
supabase functions logs validate-coupon --project-ref iwovfvrmjaonzqlaavmi
supabase functions logs create-payment --project-ref iwovfvrmjaonzqlaavmi
supabase functions logs unlock-free-result --project-ref iwovfvrmjaonzqlaavmi
```

### **Database:**

```sql
-- Ver cupons ativos
SELECT * FROM discount_coupons WHERE is_active = true ORDER BY created_at DESC;

-- Ver pagamentos com cupom
SELECT 
  test_id, 
  coupon_code, 
  original_amount, 
  amount, 
  status,
  created_at 
FROM payments 
WHERE coupon_code IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 20;

-- Ver uso de cupons
SELECT 
  code,
  discount_percentage,
  current_uses,
  max_uses,
  CASE WHEN max_uses IS NULL THEN '∞' 
       ELSE (max_uses - current_uses)::text 
  END as restantes
FROM discount_coupons
ORDER BY current_uses DESC;
```

### **Analytics (GTM/GA4):**

Verificar no GA4 Realtime:
- ✅ Evento `coupon_applied` com parâmetros corretos
- ✅ Evento `begin_checkout` com `coupon` quando aplicável
- ✅ Evento `purchase` com `coupon` e `value` corretos
- ✅ Evento `free_unlock` para cupons 100%

---

## 📊 Monitoramento em Produção

### **Métricas para acompanhar:**

1. **Taxa de uso de cupons:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE coupon_code IS NOT NULL) * 100.0 / COUNT(*) as taxa_uso_cupom
FROM payments
WHERE created_at > now() - interval '7 days';
```

2. **Receita com/sem cupom:**
```sql
SELECT 
  CASE WHEN coupon_code IS NOT NULL THEN 'Com cupom' ELSE 'Sem cupom' END as tipo,
  COUNT(*) as qtd_pagamentos,
  SUM(amount) as receita,
  AVG(amount) as ticket_medio
FROM payments
WHERE status = 'approved'
  AND created_at > now() - interval '30 days'
GROUP BY CASE WHEN coupon_code IS NOT NULL THEN 'Com cupom' ELSE 'Sem cupom' END;
```

3. **Cupons mais usados:**
```sql
SELECT 
  coupon_code,
  COUNT(*) as usos,
  SUM(original_amount - amount) as desconto_total
FROM payments
WHERE coupon_code IS NOT NULL
  AND created_at > now() - interval '30 days'
GROUP BY coupon_code
ORDER BY usos DESC;
```

---

## ✅ Checklist Final

Antes de considerar completo:

- [x] Linter errors: 0
- [x] TypeScript errors: 0
- [x] Analytics com cupom: ✅
- [x] Proteção contra undefined: ✅
- [x] Edge functions deployadas
- [x] Migration aplicada
- [x] Variável BASE_PRICE configurada
- [ ] Testes manuais nos 10 cenários acima
- [ ] Verificar GA4 recebendo eventos
- [ ] Monitorar logs por 24h

---

**Última atualização:** 2025-02-04  
**Status:** Pronto para testes

