# Guia de Deploy - QualCarreira

**Última atualização**: 2025-01-14

---

## Ordem de Deploy Recomendada

1. **Migração do banco de dados** (ZERO RISCO)
2. **Edge function `create-result`** (ZERO RISCO - backwards compatible)
3. **Frontend** (Vercel)

---

## 1. Migração do Banco de Dados

### Arquivo: `supabase/migrations/20260114_add_contextual_questionnaire.sql`

**Status**: ✅ SEGURO PARA DEPLOY
- Usa `IF NOT EXISTS` - não quebra se executar duas vezes
- Coluna `contextual_questionnaire` é nullable - não afeta registros existentes
- Zero downtime

**Comando**:
```bash
supabase db push
```

**Verificação**:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'test_results' AND column_name = 'contextual_questionnaire';
-- Deve retornar: contextual_questionnaire | jsonb | YES
```

---

## 2. Edge Function create-result

**Status**: ✅ TOTALMENTE COMPATÍVEL

**Backwards Compatibility**:
- ✅ Aceita requisições SEM `contextual_questionnaire` (código antigo funciona)
- ✅ Aceita requisições COM `contextual_questionnaire` válido
- ✅ Se validação falhar, continua sem o campo (graceful degradation)

**Comando**:
```bash
supabase functions deploy create-result
```

**Verificação**:
- Testar requisição antiga (sem `contextual_questionnaire`) - deve funcionar
- Testar requisição nova (com `contextual_questionnaire`) - deve salvar
- Verificar logs para confirmar comportamento

---

## 3. Frontend (Vercel)

### Variáveis de Ambiente Necessárias

```bash
# Vercel Environment Variables
GROWTHBOOK_CLIENT_KEY=sdk-xxx
NEXT_PUBLIC_GA4_API_SECRET=xxx
```

### Comando de Deploy

```bash
vercel --prod
```

### Verificações Pós-Deploy

1. **Testar fluxo completo**:
   - 60 questões → questionário contextual (se variante "enabled") → formulário
   - Verificar se dados são salvos corretamente no banco

2. **Testar refresh**:
   - Durante questionário contextual
   - Durante preenchimento do formulário
   - Verificar se estado é recuperado corretamente

3. **Verificar analytics**:
   - Evento `experiment_viewed` disparado
   - Evento `contextual_questionnaire_completed` (se aplicável)
   - Evento `form_submitted` com variant

---

## Backwards Compatibility

### ✅ Garantias

- **Backend**: Edge function aceita requisições antigas e novas
- **Frontend**: Props opcionais em todos os componentes
- **Banco**: Coluna nullable não quebra queries existentes
- **Estado**: Sistema de migração automática de dados antigos

### Comportamento

- **Código antigo (sem questionário contextual)**: Funciona normalmente
- **Código novo (com questionário contextual)**: Funciona quando variante = "enabled"
- **Se validação falhar**: Continua sem o campo, não quebra requisição

---

## Monitoramento Pós-Deploy

### Métricas a Observar

1. **Logs da Edge Function**:
   - Contar requisições com/sem `contextual_questionnaire`
   - Contar erros de validação (devem ser raros)
   - Verificar se nenhuma requisição está falhando

2. **Banco de Dados**:
   - Verificar se registros estão sendo criados normalmente
   - Verificar se `contextual_questionnaire` está sendo salvo quando presente

3. **Frontend**:
   - Taxa de conclusão do questionário contextual
   - Taxa de abandono no questionário
   - Erros de validação

4. **Analytics**:
   - Distribuição 80/20 no GrowthBook
   - Taxa de conversão (form_submitted / experiment_viewed)
   - Eventos disparados corretamente

---

## Rollback Plan

Se necessário reverter:

1. **Frontend**: Feature flag no GrowthBook pode ser pausada (não precisa reverter código)
2. **Edge Function**: Não precisa reverter (já é compatível)
3. **Banco**: Não precisa reverter (coluna nullable não causa problemas)

**Nota**: A coluna nullable permite que o código antigo continue funcionando indefinidamente.

---

## Checklist Final

### Pré-Deploy
- [x] Migração do banco preparada
- [x] Edge function revisada e testada
- [x] Frontend testado localmente
- [x] Variáveis de ambiente configuradas no Vercel
- [x] Feature flag configurada no GrowthBook

### Deploy
- [ ] Migração aplicada
- [ ] Edge function deployada
- [ ] Frontend deployado
- [ ] Testes manuais realizados

### Pós-Deploy
- [ ] Logs verificados
- [ ] Analytics verificados
- [ ] Monitoramento ativo por 24-48 horas

---

**Risco de Deploy**: 🟢 **BAIXO** (backwards compatibility garantida)
