# 🗺️ Roadmap de Implementação - Qual Carreira

## Status Geral: 🟡 Fase 3A em Andamento (20% completo)

---

## ✅ PROMPT 1: Integrar 60 Perguntas Reais
**Status**: ✅ **CONCLUÍDO**

### O que foi feito:
- ✅ Removidas perguntas mock do `Avaliacao.tsx`
- ✅ Importado `questions` e `TOTAL_QUESTIONS` de `src/data/questions.ts`
- ✅ Atualizada estrutura de respostas para `Array<{ question_id: number, score: number }>`
- ✅ Implementada lógica para salvar `question_id` + `score` juntos
- ✅ Atualizado progresso para mostrar "Questão X/60"
- ✅ Corrigida navegação (Anterior/Próxima) para buscar respostas por `question_id`

### Resultado:
- ✅ Usuário agora responde todas as 60 perguntas reais
- ✅ Dados preparados para envio ao backend no formato correto

---

## ⏳ PROMPT 2: Implementar LocalStorage para Persistência
**Status**: 🔴 **PENDENTE**

### O que fazer:
1. Criar `src/lib/assessmentStorage.ts` com helpers:
   - `saveProgress(testId, answers, currentQuestion)`
   - `loadProgress(testId)`
   - `clearProgress(testId)`

2. Modificar `Avaliacao.tsx`:
   - Salvar no localStorage após cada resposta (no `handleNext`)
   - Recuperar progresso no `useEffect` inicial
   - Limpar localStorage após finalizar

### Benefícios:
- ✅ Usuário não perde progresso ao recarregar página
- ✅ Pode pausar e continuar depois

---

## 🔴 PROMPT 3: Criar Edge Function `create-result`
**Status**: 🔴 **PENDENTE**

### O que fazer:
1. Criar `supabase/functions/create-result/index.ts`
2. Implementar:
   - Receber: `{ name, email, age, answers: Array<{question_id, score}> }`
   - Calcular scores RIASEC, Gardner, GOPC usando dados de `questions.ts`
   - Inserir em `test_results` table
   - Inserir todas as respostas em `test_responses` table
   - Retornar: `{ result_id, expires_at }`

3. Adicionar na `config.toml`:
```toml
[functions.create-result]
verify_jwt = false
```

---

## 🔴 PROMPT 4: Integrar FormularioDados com Backend
**Status**: 🔴 **PENDENTE**

### O que fazer:
1. Modificar `FormularioDados.tsx`:
   - Receber `answers` como prop
   - No submit, chamar edge function `create-result`
   - Exibir loading durante chamada
   - Ao receber `result_id`, redirecionar para `/resultado/:result_id`
   - Limpar localStorage após sucesso

---

## 🔴 PROMPT 5: Criar Rota `/resultado/:id`
**Status**: 🔴 **PENDENTE**

### O que fazer:
1. Criar `src/pages/Resultado.tsx`
2. Implementar:
   - Buscar dados via edge function `get-result`
   - Mostrar **sempre** a mensagem "Salve este link"
   - Mostrar resultados com blur se `is_unlocked = false`
   - Botão de desbloquear (PaymentSection)

3. Adicionar rota no router

---

## 🔴 PROMPT 6: Criar Edge Function `get-result`
**Status**: 🔴 **PENDENTE**

### O que fazer:
1. Criar `supabase/functions/get-result/index.ts`
2. Implementar:
   - Receber `result_id` como query param
   - Buscar dados de `test_results` e `test_responses`
   - Verificar se resultado não expirou
   - Retornar dados completos + status de unlock

---

## 🔴 PROMPT 7: Criar Edge Function `unlock-result`
**Status**: 🔴 **PENDENTE**

### O que fazer:
1. Criar `supabase/functions/unlock-result/index.ts`
2. Implementar:
   - Receber `result_id` e `payment_id`
   - Verificar status do pagamento (via `check-payment-status`)
   - Se aprovado: atualizar `is_unlocked = true` em `test_results`
   - Retornar status de sucesso

---

## 🔴 PROMPT 8: Integrar Fluxo de Pagamento Completo
**Status**: 🔴 **PENDENTE**

### O que fazer:
1. Modificar `PaymentModal.tsx`:
   - Após criar pagamento, iniciar polling de `check-payment-status`
   - Quando status = 'approved', chamar `unlock-result`
   - Recarregar página para remover blur

---

## 🟣 PROMPT 9: Configurar Email (Opcional)
**Status**: 🟣 **FUTURO**

### O que fazer:
1. Configurar `RESEND_API_KEY`
2. Criar template de email
3. Integrar em `create-result` com:
   - Contador de emails diários (max 100)
   - Fallback caso quota excedida (só mostra link)
   - Email contém link `/resultado/:id`

---

## 📊 Progresso Geral

```
Fase 3A - Backend Core
├── ✅ PROMPT 1: Integrar 60 perguntas
├── 🔴 PROMPT 2: LocalStorage
├── 🔴 PROMPT 3: create-result
├── 🔴 PROMPT 4: FormularioDados
├── 🔴 PROMPT 5: Rota /resultado/:id
├── 🔴 PROMPT 6: get-result
├── 🔴 PROMPT 7: unlock-result
└── 🔴 PROMPT 8: Pagamento completo

Fase 3B - Email (Opcional)
└── 🟣 PROMPT 9: Resend email
```

---

## 🎯 Próximo Passo

**Execute**: "Implementar PROMPT 2: LocalStorage para persistência de progresso"
