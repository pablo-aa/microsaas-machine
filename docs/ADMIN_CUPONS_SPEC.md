# Especificação: Interface Admin de Cupons de Desconto

## 📋 Visão Geral

Sistema de administração de cupons de desconto para o Qual Carreira. Permite criar, editar, listar e excluir cupons com diferentes percentuais de desconto (0% a 100%).

---

## 🗄️ Estrutura da Tabela

### Tabela: `discount_coupons`

```sql
CREATE TABLE discount_coupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,                    -- Código do cupom (ex: "AMIGO50")
  discount_percentage integer NOT NULL,          -- 0 a 100
  description text,                              -- Descrição opcional
  is_active boolean NOT NULL DEFAULT true,       -- Ativo/Inativo
  expires_at timestamptz,                        -- Data de expiração (nullable)
  max_uses integer,                              -- Máximo de usos (nullable = ilimitado)
  current_uses integer NOT NULL DEFAULT 0,       -- Contador de usos
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
```

### Constraints e Validações

- `code`: UNIQUE, case-insensitive (usar UPPER ao salvar)
- `discount_percentage`: CHECK (0 <= valor <= 100)
- `max_uses`: CHECK (valor > 0 ou NULL)
- `current_uses`: CHECK (valor >= 0)
- Index: `idx_discount_coupons_code_upper` em `UPPER(code)`

---

## 🔐 Conexão com o Banco

### Credenciais (Supabase)

```
Project ID: iwovfvrmjaonzqlaavmi
URL: https://iwovfvrmjaonzqlaavmi.supabase.co
```

**Importante:** Usar **SERVICE_ROLE_KEY** para operações admin (não a anon key).

---

## 📊 Interface Sugerida

### 1. Listagem de Cupons

**Endpoint/Query:**
```sql
SELECT 
  id,
  code,
  discount_percentage,
  description,
  is_active,
  expires_at,
  max_uses,
  current_uses,
  created_at,
  CASE 
    WHEN max_uses IS NULL THEN 'Ilimitado'
    WHEN max_uses - current_uses <= 0 THEN 'Esgotado'
    ELSE (max_uses - current_uses)::text || ' restantes'
  END as status_usos,
  CASE 
    WHEN NOT is_active THEN 'Inativo'
    WHEN expires_at IS NOT NULL AND expires_at < now() THEN 'Expirado'
    WHEN max_uses IS NOT NULL AND current_uses >= max_uses THEN 'Esgotado'
    ELSE 'Ativo'
  END as status
FROM discount_coupons
ORDER BY created_at DESC;
```

**Campos para exibir na tabela:**
- Código (code)
- Desconto (discount_percentage) - mostrar com %
- Status (ativo/inativo/expirado/esgotado)
- Usos (current_uses / max_uses)
- Validade (expires_at)
- Ações (Editar / Desativar / Excluir)

**Filtros recomendados:**
- Status: Todos / Ativos / Inativos / Expirados
- Desconto: Todos / 0-25% / 26-50% / 51-75% / 76-100%
- Busca por código

---

### 2. Criar Novo Cupom

**Formulário:**

```typescript
interface CupomForm {
  code: string;              // Obrigatório, máx 50 chars
  discount_percentage: number; // Obrigatório, 0-100
  description?: string;      // Opcional, máx 255 chars
  is_active: boolean;        // Checkbox, default true
  expires_at?: string;       // Date picker, opcional
  max_uses?: number;         // Opcional, null = ilimitado
}
```

**Validações (Frontend):**
- `code`: 
  - Obrigatório
  - Apenas letras, números (sem espaços ou caracteres especiais)
  - Converter para MAIÚSCULAS automaticamente
  - Mínimo 4 caracteres, máximo 50
- `discount_percentage`:
  - Obrigatório
  - Entre 0 e 100
  - Apenas números inteiros
- `expires_at`:
  - Opcional
  - Deve ser maior que data atual
- `max_uses`:
  - Opcional (vazio = ilimitado)
  - Deve ser >= 1 se preenchido

**Query INSERT:**
```sql
INSERT INTO discount_coupons (
  code, 
  discount_percentage, 
  description, 
  is_active, 
  expires_at, 
  max_uses
)
VALUES (
  UPPER(:code),
  :discount_percentage,
  :description,
  :is_active,
  :expires_at,
  :max_uses
)
RETURNING *;
```

**Mensagens de erro:**
- Código duplicado: "Já existe um cupom com este código"
- Validação falhou: "Verifique os campos obrigatórios"

---

### 3. Editar Cupom

**Regras importantes:**
- ⚠️ **NÃO permitir editar `code`** (é a chave de identificação)
- ⚠️ **NÃO permitir editar `current_uses`** (é gerenciado automaticamente)
- Permitir editar todos os outros campos
- Se `max_uses` for reduzido para menos que `current_uses`, mostrar aviso

**Query UPDATE:**
```sql
UPDATE discount_coupons
SET 
  discount_percentage = :discount_percentage,
  description = :description,
  is_active = :is_active,
  expires_at = :expires_at,
  max_uses = :max_uses,
  updated_at = now()
WHERE id = :id
RETURNING *;
```

**Aviso ao reduzir max_uses:**
```
"Atenção: Este cupom já teve {current_uses} usos. 
Reduzir max_uses para {novo_valor} não afetará os usos já realizados, 
mas impedirá novos usos."
```

---

### 4. Desativar Cupom

**Ação rápida** (não excluir, apenas desativar):

```sql
UPDATE discount_coupons
SET 
  is_active = false,
  updated_at = now()
WHERE id = :id;
```

**Mensagem:** "Cupom {code} desativado com sucesso. Não será mais aceito em novos pagamentos."

---

### 5. Excluir Cupom

**⚠️ CUIDADO:** Só permitir exclusão se:
- `current_uses = 0` (nunca foi usado)
- Ou forçar exclusão com confirmação dupla

**Query:**
```sql
DELETE FROM discount_coupons
WHERE id = :id
AND current_uses = 0;  -- Proteção
```

**Se current_uses > 0:**
```
"Este cupom já foi usado {current_uses} vezes. 
Exclusão pode afetar relatórios.
Recomendamos DESATIVAR ao invés de excluir.
Deseja mesmo excluir?"
```

---

## 📈 Estatísticas / Dashboard (Opcional)

### Queries úteis:

**Total de cupons por status:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE is_active AND (expires_at IS NULL OR expires_at > now())) as ativos,
  COUNT(*) FILTER (WHERE NOT is_active) as inativos,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < now()) as expirados,
  COUNT(*) as total
FROM discount_coupons;
```

**Cupons mais usados:**
```sql
SELECT 
  code,
  discount_percentage,
  current_uses,
  max_uses,
  CASE WHEN max_uses IS NULL THEN 100.0
       ELSE (current_uses::float / max_uses * 100)
  END as percentual_uso
FROM discount_coupons
WHERE current_uses > 0
ORDER BY current_uses DESC
LIMIT 10;
```

**Total economizado pelos usuários:**
```sql
SELECT 
  dc.code,
  dc.discount_percentage,
  COUNT(p.id) as pagamentos,
  SUM(p.original_amount) as valor_original,
  SUM(p.amount) as valor_pago,
  SUM(p.original_amount - p.amount) as economia_total
FROM discount_coupons dc
LEFT JOIN payments p ON p.coupon_code = dc.code
GROUP BY dc.code, dc.discount_percentage
ORDER BY economia_total DESC NULLS LAST;
```

---

## 🎨 Sugestões de UI/UX

### Cards de Status:
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Cupons Ativos  │  │  Total de Usos  │  │ Economia Total  │
│      12         │  │      348        │  │   R$ 2.450,80   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Tabela de cupons:
```
| Código    | Desconto | Status  | Usos     | Validade   | Ações              |
|-----------|----------|---------|----------|------------|--------------------|
| AMIGO50   | 50%      | Ativo   | 45/100   | Sem limite | [Editar] [Desativar] [Excluir]
| TESTE20   | 20%      | Ativo   | 12/∞     | 31/12/2025 | [Editar] [Desativar] [Excluir]
| BLACK100  | 100%     | Esgotado| 10/10    | 28/11/2025 | [Editar] [Desativar] [Excluir]
| PROMO30   | 30%      | Inativo | 0/50     | 15/01/2026 | [Editar] [Ativar]   [Excluir]
```

### Badges de status:
- **Ativo:** Verde
- **Inativo:** Cinza
- **Expirado:** Laranja
- **Esgotado:** Vermelho

### Formulário de criação:
```
┌─────────────────────────────────────────┐
│ Novo Cupom                              │
├─────────────────────────────────────────┤
│ Código*                                 │
│ [AMIGO50        ] (maiúsculas)         │
│                                         │
│ Desconto (%)*                           │
│ [50] %                                  │
│                                         │
│ Descrição                               │
│ [Cupom para indicação de amigos]       │
│                                         │
│ □ Ativo                                 │
│                                         │
│ Data de Expiração                       │
│ [__/__/____] (opcional)                │
│                                         │
│ Máximo de Usos                          │
│ [100] (deixe vazio para ilimitado)     │
│                                         │
│        [Cancelar]  [Criar Cupom]       │
└─────────────────────────────────────────┘
```

---

## 🔒 Segurança

### Permissões necessárias:
- Apenas usuários ADMIN podem acessar
- Usar SERVICE_ROLE_KEY do Supabase
- Validar permissões no backend

### RLS (Row Level Security):
```sql
-- Política já configurada no banco
CREATE POLICY "Service role full access"
  ON discount_coupons FOR ALL
  USING (auth.role() = 'service_role');
```

---

## 🧪 Dados de Teste

### Cupons já criados no banco:

```sql
-- Visualizar cupons atuais
SELECT * FROM discount_coupons ORDER BY created_at DESC;
```

**Cupons existentes:**
- `TESTE20` - 20% desconto, ilimitado
- `AMIGO50` - 50% desconto, ilimitado
- `GRATIS100` - 100% desconto, máx 10 usos
- `PROMO30` - 30% desconto, expira em 7 dias, máx 50 usos

---

## 🚀 Testes Recomendados

### Checklist de funcionalidades:

- [ ] Criar cupom com todos os campos
- [ ] Criar cupom apenas com campos obrigatórios
- [ ] Tentar criar cupom com código duplicado (deve falhar)
- [ ] Tentar criar cupom com desconto > 100 (deve falhar)
- [ ] Editar cupom existente
- [ ] Desativar cupom
- [ ] Reativar cupom desativado
- [ ] Excluir cupom não usado
- [ ] Tentar excluir cupom já usado (deve mostrar aviso)
- [ ] Filtrar cupons por status
- [ ] Buscar cupom por código

---

## 📞 Suporte Técnico

**Projeto:** Qual Carreira  
**Ambiente:** Produção  
**Banco:** Supabase (PostgreSQL)

**Contatos para dúvidas:**
- Documentação adicional: `/docs/SUPABASE_SETUP.md`
- Sistema relacionado: Edge Functions de pagamento
- Tabelas relacionadas: `payments` (FK: `coupon_code`)

---

## 🔗 Dependências

### Tabelas relacionadas:

A tabela `payments` possui uma coluna `coupon_code` que referencia os cupons:

```sql
-- Ver pagamentos que usaram cupons
SELECT 
  p.payment_id,
  p.coupon_code,
  p.original_amount,
  p.amount,
  (p.original_amount - p.amount) as desconto,
  p.created_at
FROM payments p
WHERE p.coupon_code IS NOT NULL
ORDER BY p.created_at DESC;
```

**Importante:** Não há FK constraint, mas os códigos devem ser consistentes.

---

## 📝 Changelog

- **2025-02-04**: Criação inicial do sistema de cupons
- **Versão**: 1.0
- **Autor**: Sistema Qual Carreira

