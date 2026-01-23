# Estrutura do Questionário Contextual

## 📋 Visão Geral

O **Questionário Contextual** é um formulário opcional que aparece após a conclusão das 60 questões principais do teste vocacional. Ele coleta informações adicionais sobre o contexto profissional do usuário para personalizar melhor os resultados.

### Características Principais

- **6 perguntas principais** sempre exibidas
- **3 perguntas condicionais** que aparecem baseadas na resposta da Q1
- **Total possível**: 6 a 9 perguntas (dependendo das respostas)
- **Persistência automática** do progresso no `localStorage`
- **Validação em tempo real** com feedback visual
- **Integração com analytics** (GA4 + GTM)

---

## 🏗️ Arquitetura de Dados

### Tipos TypeScript

#### 1. CareerMoment (Q1)
```typescript
type CareerMoment =
  | "first_career"           // Escolhendo primeira carreira
  | "career_change"          // Mudando de área
  | "career_growth"          // Crescendo na área atual
  | "unemployed"             // Desempregado buscando direção
  | "self_employed";         // Autônomo/negócio próprio
```

#### 2. Urgency (Q2)
```typescript
type Urgency =
  | "0_30_days"              // 0 a 30 dias
  | "1_3_months"             // 1 a 3 meses
  | "3_6_months"             // 3 a 6 meses
  | "6_plus_months"          // 6+ meses
  | "just_exploring";         // Só explorando
```

#### 3. MainGoal (Q3)
```typescript
type MainGoal =
  | "more_satisfaction"       // Mais satisfação/propósito
  | "more_money"              // Mais dinheiro
  | "more_stability"          // Mais estabilidade
  | "more_flexibility"        // Mais flexibilidade
  | "fast_growth"             // Crescimento rápido
  | "more_autonomy";          // Mais autonomia
```

#### 4. BlockingFactor (Q4 - múltipla escolha)
```typescript
type BlockingFactor =
  | "dont_know_skills"        // Não sei no que sou bom
  | "fear_wrong_choice"        // Medo de escolher errado
  | "lack_clarity"            // Falta de clareza do caminho
  | "lack_time"                // Falta de tempo
  | "money_insecurity"         // Insegurança com dinheiro
  | "lack_support"             // Falta de apoio/confiança
  | "tried_before";           // Já tentei antes
```

#### 5. CurrentSituation (Q5)
```typescript
type CurrentSituation =
  | "many_ideas"               // Muitas ideias, não consigo decidir
  | "know_what_want"           // Sei o que quero, não sei por onde começar
  | "unsatisfied_afraid"       // Insatisfeito, quero mudança mas tenho medo
  | "want_strategic"           // Quero algo estratégico, com plano
  | "just_confirm";            // Estou bem, só quero confirmar
```

#### 6. WeeklyTime (Q6)
```typescript
type WeeklyTime =
  | "0_2_hours"                // 0 a 2 horas
  | "3_5_hours"                // 3 a 5 horas
  | "6_10_hours"               // 6 a 10 horas
  | "10_plus_hours";           // 10+ horas
```

#### 7. TransitionDirection (Q7 - condicional)
```typescript
type TransitionDirection =
  | "completely_different"     // Totalmente diferente
  | "similar_to_current"       // Próxima do que já faço
  | "dont_know_yet";           // Ainda não sei
```

#### 8. TransitionFear (Q8 - condicional)
```typescript
type TransitionFear =
  | "start_from_zero"          // Começar do zero
  | "salary_reduction"         // Reduzir salário
  | "cant_find_job"            // Não conseguir emprego
  | "waste_time"               // Perder tempo escolhendo errado
  | "lack_family_support";     // Falta de apoio da família
```

#### 9. UnemployedPriority (Q9 - condicional)
```typescript
type UnemployedPriority =
  | "quick_direction"          // Direção rápida
  | "high_employability"       // Alta empregabilidade
  | "find_love"                // Encontrar algo que goste
  | "understand_skills";       // Entender habilidades
```

### Interface Principal

```typescript
interface ContextualAnswers {
  q1: CareerMoment;                    // Obrigatório
  q2: Urgency;                         // Obrigatório
  q3: MainGoal;                       // Obrigatório
  q4: BlockingFactor[];               // Obrigatório (máx. 2)
  q5: CurrentSituation;               // Obrigatório
  q6: WeeklyTime;                      // Obrigatório
  q7?: TransitionDirection;           // Condicional (se q1 = "career_change")
  q8?: TransitionFear;                // Condicional (se q1 = "career_change")
  q9?: UnemployedPriority;             // Condicional (se q1 = "unemployed")
}
```

---

## 📝 Estrutura das Perguntas

### Q1: Momento de Carreira
- **ID**: `q1`
- **Tipo**: Single select (radio)
- **Obrigatória**: Sim
- **Condicional**: Não
- **Opções**: 5
- **Função**: Define quais perguntas condicionais serão exibidas

**Opções:**
1. `first_career` - "Estou escolhendo minha primeira carreira"
2. `career_change` - "Quero mudar de área (transição de carreira)"
3. `career_growth` - "Quero crescer na minha área atual"
4. `unemployed` - "Estou desempregado(a) e buscando direção"
5. `self_employed` - "Sou autônomo(a)/tenho negócio e quero direcionar minha atuação"

**Lógica Condicional:**
- Se `q1 = "career_change"` → Mostra Q7 e Q8
- Se `q1 = "unemployed"` → Mostra Q9
- Outros valores → Não mostra perguntas condicionais

---

### Q2: Urgência
- **ID**: `q2`
- **Tipo**: Single select (radio)
- **Obrigatória**: Sim
- **Condicional**: Não
- **Opções**: 5

**Opções:**
1. `0_30_days` - "0 a 30 dias"
2. `1_3_months` - "1 a 3 meses"
3. `3_6_months` - "3 a 6 meses"
4. `6_plus_months` - "6+ meses"
5. `just_exploring` - "Só estou explorando por enquanto"

---

### Q3: Objetivo Principal
- **ID**: `q3`
- **Tipo**: Single select (radio)
- **Obrigatória**: Sim
- **Condicional**: Não
- **Opções**: 6

**Opções:**
1. `more_satisfaction` - "Mais satisfação/propósito"
2. `more_money` - "Mais dinheiro"
3. `more_stability` - "Mais estabilidade"
4. `more_flexibility` - "Mais flexibilidade (horário/remoto)"
5. `fast_growth` - "Crescimento rápido"
6. `more_autonomy` - "Mais autonomia"

---

### Q4: Fatores Bloqueadores
- **ID**: `q4`
- **Tipo**: Multiple select (checkbox)
- **Obrigatória**: Sim
- **Condicional**: Não
- **Opções**: 7
- **Limite**: Máximo 2 seleções

**Opções:**
1. `dont_know_skills` - "Não sei no que sou bom(boa)"
2. `fear_wrong_choice` - "Medo de escolher errado"
3. `lack_clarity` - "Falta de clareza do caminho (passo a passo)"
4. `lack_time` - "Falta de tempo/rotina corrida"
5. `money_insecurity` - "Insegurança com dinheiro/salário"
6. `lack_support` - "Falta de apoio/confiança"
7. `tried_before` - "Já tentei antes e não deu certo"

**Validação Especial:**
- Mínimo: 1 seleção
- Máximo: 2 seleções
- Toast de aviso quando limite é atingido

---

### Q5: Situação Atual
- **ID**: `q5`
- **Tipo**: Single select (radio)
- **Obrigatória**: Sim
- **Condicional**: Não
- **Opções**: 5

**Opções:**
1. `many_ideas` - "Tenho muitas ideias e não consigo decidir"
2. `know_what_want` - "Até sei o que quero, mas não sei por onde começar"
3. `unsatisfied_afraid` - "Estou insatisfeito(a) e quero uma mudança, mas tenho medo"
4. `want_strategic` - "Quero algo mais estratégico, com plano e consistência"
5. `just_confirm` - "Estou bem, só quero confirmar se estou no caminho certo"

---

### Q6: Tempo Semanal Disponível
- **ID**: `q6`
- **Tipo**: Single select (radio)
- **Obrigatória**: Sim
- **Condicional**: Não
- **Opções**: 4

**Opções:**
1. `0_2_hours` - "0 a 2 horas"
2. `3_5_hours` - "3 a 5 horas"
3. `6_10_hours` - "6 a 10 horas"
4. `10_plus_hours` - "10+ horas"

---

### Q7: Direção da Transição (Condicional)
- **ID**: `q7`
- **Tipo**: Single select (radio)
- **Obrigatória**: Sim (quando visível)
- **Condicional**: Sim
- **Depende de**: `q1 = "career_change"`
- **Opções**: 3

**Opções:**
1. `completely_different` - "Totalmente diferente do que faço hoje"
2. `similar_to_current` - "Próxima do que já faço hoje"
3. `dont_know_yet` - "Ainda não sei"

**Comportamento:**
- Só aparece se Q1 = "career_change"
- Se Q1 mudar, resposta é limpa automaticamente

---

### Q8: Maior Medo na Transição (Condicional)
- **ID**: `q8`
- **Tipo**: Single select (radio)
- **Obrigatória**: Sim (quando visível)
- **Condicional**: Sim
- **Depende de**: `q1 = "career_change"`
- **Opções**: 5

**Opções:**
1. `start_from_zero` - "Começar do zero"
2. `salary_reduction` - "Reduzir salário"
3. `cant_find_job` - "Não conseguir emprego na nova área"
4. `waste_time` - "Perder tempo escolhendo errado"
5. `lack_family_support` - "Falta de apoio da família/ambiente"

**Comportamento:**
- Só aparece se Q1 = "career_change"
- Se Q1 mudar, resposta é limpa automaticamente

---

### Q9: Prioridade para Desempregado (Condicional)
- **ID**: `q9`
- **Tipo**: Single select (radio)
- **Obrigatória**: Sim (quando visível)
- **Condicional**: Sim
- **Depende de**: `q1 = "unemployed"`
- **Opções**: 4

**Opções:**
1. `quick_direction` - "Conseguir uma direção rápida"
2. `high_employability` - "Escolher algo com alta empregabilidade"
3. `find_love` - "Encontrar algo que eu goste de verdade"
4. `understand_skills` - "Entender minhas habilidades e pontos fortes"

**Comportamento:**
- Só aparece se Q1 = "unemployed"
- Se Q1 mudar, resposta é limpa automaticamente

---

## 🔄 Lógica Condicional

### Função: `getVisibleQuestions()`

```typescript
function getVisibleQuestions(answers: Partial<ContextualAnswers>): string[]
```

**Comportamento:**
1. Sempre inclui Q1-Q6 (perguntas principais)
2. Verifica Q1 para determinar perguntas condicionais:
   - Se `q1 === "career_change"` → Adiciona Q7 e Q8
   - Se `q1 === "unemployed"` → Adiciona Q9
3. Retorna array de IDs das perguntas visíveis

**Exemplo:**
```typescript
// Caso 1: Primeira carreira
getVisibleQuestions({ q1: "first_career" })
// Retorna: ["q1", "q2", "q3", "q4", "q5", "q6"]

// Caso 2: Mudança de carreira
getVisibleQuestions({ q1: "career_change" })
// Retorna: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"]

// Caso 3: Desempregado
getVisibleQuestions({ q1: "unemployed" })
// Retorna: ["q1", "q2", "q3", "q4", "q5", "q6", "q9"]
```

### Limpeza Automática de Respostas

Quando Q1 muda:
- Respostas de perguntas condicionais que não são mais visíveis são **automaticamente removidas**
- Evita dados inconsistentes no estado

**Implementação:**
```typescript
if (questionId === "q1") {
  const newVisible = getVisibleQuestions(newAnswers);
  // Remove respostas de perguntas não mais visíveis
  for (const key in cleanedAnswers) {
    if (!newVisible.includes(key) && key !== "q1") {
      delete cleanedAnswers[key];
    }
  }
}
```

---

## ✅ Validação

### Função: `validateRequiredAnswers()`

```typescript
function validateRequiredAnswers(
  answers: Partial<ContextualAnswers>
): { valid: boolean; missing: string[] }
```

**Validações:**
1. **Perguntas visíveis obrigatórias**: Todas devem ter resposta
2. **Tipo correto**: 
   - Single select: string não vazia
   - Multiple select: array com pelo menos 1 item
3. **Limite de seleções**: Q4 não pode exceder 2 itens
4. **Valores permitidos**: Usa `validateAnswerValue()` para verificar

### Função: `validateAnswerValue()`

```typescript
function validateAnswerValue(
  questionId: string,
  value: string | string[]
): boolean
```

**Validações:**
- Verifica se o valor está nas opções permitidas da pergunta
- Valida tipo (string para single, array para multiple)
- Retorna `true` se válido, `false` caso contrário

### Validação no Frontend

**Momentos de validação:**
1. **On blur/touch**: Marca campo como "touched"
2. **On change**: Limpa erro quando usuário responde
3. **On submit**: Validação completa antes de enviar

**Feedback visual:**
- Borda vermelha em campos com erro
- Mensagem de erro abaixo do campo
- Scroll automático para primeiro erro
- Toast de erro geral se formulário incompleto

---

## 💾 Persistência de Dados

### Armazenamento Local

**Localização**: `localStorage` via `assessmentStorage`

**Chave**: `assessment_flow_${testId}`

**Estrutura:**
```typescript
{
  testId: string;
  answers: number[];              // Respostas do teste principal
  contextualAnswers?: {         // Respostas do questionário contextual
    q1: CareerMoment;
    q2: Urgency;
    // ... outras respostas
  };
  currentStage: string;
  experimentVariant?: string;
  // ... outros campos
}
```

### Comportamento

1. **Auto-save**: Salva automaticamente quando respostas mudam
2. **Auto-load**: Carrega progresso salvo ao montar componente
3. **Atômico**: Salvamento é atômico (não parcial)
4. **Recuperação**: Se usuário recarregar página, progresso é restaurado

**Implementação:**
```typescript
// Auto-save
useEffect(() => {
  if (Object.keys(answers).length > 0) {
    assessmentStorage.updateFlowState(testId, {
      contextualAnswers: answers as ContextualAnswers,
    });
  }
}, [answers, testId]);

// Auto-load
useEffect(() => {
  const flowState = assessmentStorage.loadFlowState(testId);
  if (flowState?.contextualAnswers) {
    setAnswers(flowState.contextualAnswers);
  }
}, [testId]);
```

### Armazenamento no Banco

**Tabela**: `test_results`

**Coluna**: `contextual_questionnaire` (JSONB, nullable)

**Estrutura JSON:**
```json
{
  "q1": "career_change",
  "q2": "1_3_months",
  "q3": "more_satisfaction",
  "q4": ["fear_wrong_choice", "lack_clarity"],
  "q5": "unsatisfied_afraid",
  "q6": "3_5_hours",
  "q7": "completely_different",
  "q8": "start_from_zero"
}
```

**Validação no Backend:**
- Edge function `create-result` valida estrutura
- Aceita apenas valores permitidos
- Degradação graciosa: se inválido, não salva mas não quebra requisição

---

## 📊 Analytics

### Evento: `contextual_questionnaire_completed`

**Disparado quando**: Usuário completa e submete o questionário

**Parâmetros:**
```typescript
{
  event: 'contextual_questionnaire_completed',
  eventCategory: 'Questionnaire',
  eventAction: 'Complete',
  contextual_questionnaire_variant: 'enabled' | 'disabled',
  test_properties: {
    q1: string,
    q2: string,
    // ... todas as respostas
  },
  user_properties: {
    test_id: string
  }
}
```

**Enviado para:**
- GTM Data Layer
- GA4 (via Measurement Protocol)

**Variante:**
- `contextual_questionnaire_variant`: Indica se usuário está no grupo de teste
- Usado para análise A/B do experimento

---

## 🎨 Interface do Usuário

### Componente Principal

**Arquivo**: `src/components/pages/ContextualQuestionnairePage.tsx`

### Estrutura Visual

```
┌─────────────────────────────────────┐
│ Header (Logo + Nome)                │
├─────────────────────────────────────┤
│                                     │
│  [Badge: "Quase lá!"]              │
│  Título: "Conte-nos mais..."       │
│  Subtítulo explicativo             │
│                                     │
│  [Barra de Progresso]              │
│  X% completo | X de Y perguntas    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Q1: [Radio Options]         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Q2: [Radio Options]         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (outras perguntas)             │
│                                     │
│  [Botão: Continuar]                 │
│                                     │
└─────────────────────────────────────┘
```

### Elementos Visuais

1. **Header**: Logo + nome do site (fixo no topo)
2. **Badge**: "Quase lá!" (indicador de progresso)
3. **Título**: "Conte-nos mais sobre você"
4. **Subtítulo**: Explicação do propósito
5. **Barra de Progresso**: 
   - Percentual completo
   - Contador de perguntas respondidas/total
6. **Cards de Perguntas**:
   - Título da pergunta
   - Subtítulo explicativo (se houver)
   - Indicador de obrigatório (*)
   - Opções de resposta
   - Mensagem de erro (se houver)
7. **Botão de Submissão**: 
   - "Continuar" com ícone
   - Estado de loading durante processamento

### Estados Visuais

**Campo Normal:**
- Borda padrão
- Hover: fundo levemente destacado

**Campo com Erro:**
- Borda vermelha
- Ícone de alerta
- Mensagem de erro abaixo

**Campo Desabilitado:**
- Opacidade reduzida
- Cursor "not-allowed"
- (Aplica-se a checkboxes quando limite atingido)

**Botão Desabilitado:**
- Durante submissão: mostra spinner + "Processando..."
- Estado normal: mostra ícone de check + "Continuar"

### Responsividade

- **Mobile**: Layout vertical, padding reduzido
- **Tablet**: Layout intermediário
- **Desktop**: Layout com max-width de 3xl, centralizado

---

## 🔄 Fluxo de Dados

### 1. Inicialização

```
Usuário completa 60 questões
    ↓
AvaliacaoPage verifica variant
    ↓
Se variant === "enabled"
    ↓
Redireciona para ContextualQuestionnairePage
    ↓
Componente carrega progresso salvo (se houver)
```

### 2. Preenchimento

```
Usuário responde pergunta
    ↓
handleSingleSelect / handleMultipleSelect
    ↓
Atualiza estado local (answers)
    ↓
useEffect detecta mudança
    ↓
Salva em localStorage (auto-save)
    ↓
Se Q1 mudou → Limpa respostas condicionais
    ↓
Recalcula perguntas visíveis
```

### 3. Submissão

```
Usuário clica "Continuar"
    ↓
validateForm() valida todas as respostas
    ↓
Se inválido → Mostra erros, scroll para primeiro
    ↓
Se válido → handleSubmit()
    ↓
trackContextualQuestionnaireCompleted()
    ↓
onComplete(answers) callback
    ↓
AvaliacaoPage recebe respostas
    ↓
Salva no flowState
    ↓
Redireciona para FormularioDadosPage
```

### 4. Persistência Final

```
FormularioDadosPage submete
    ↓
Edge function create-result
    ↓
Valida contextual_questionnaire
    ↓
Salva no banco (coluna JSONB)
```

---

## 📐 Estrutura de Arquivos

```
src/
├── data/
│   └── contextualQuestions.ts          # Definições de tipos e perguntas
│
├── components/
│   └── pages/
│       └── ContextualQuestionnairePage.tsx  # Componente principal
│
├── lib/
│   ├── assessmentStorage.ts            # Persistência local
│   └── analytics.ts                    # Tracking de eventos
│
└── app/
    └── avaliacao/
        └── [id]/
            └── page.tsx                 # Server component (busca variant)
```

---

## 🧪 Exemplos de Uso

### Exemplo 1: Primeira Carreira

**Respostas:**
```typescript
{
  q1: "first_career",
  q2: "just_exploring",
  q3: "more_satisfaction",
  q4: ["fear_wrong_choice", "lack_clarity"],
  q5: "many_ideas",
  q6: "3_5_hours"
}
```

**Perguntas visíveis**: Q1, Q2, Q3, Q4, Q5, Q6 (6 perguntas)

---

### Exemplo 2: Mudança de Carreira

**Respostas:**
```typescript
{
  q1: "career_change",
  q2: "1_3_months",
  q3: "more_money",
  q4: ["money_insecurity", "lack_time"],
  q5: "unsatisfied_afraid",
  q6: "6_10_hours",
  q7: "completely_different",
  q8: "salary_reduction"
}
```

**Perguntas visíveis**: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8 (8 perguntas)

---

### Exemplo 3: Desempregado

**Respostas:**
```typescript
{
  q1: "unemployed",
  q2: "0_30_days",
  q3: "high_employability",
  q4: ["dont_know_skills", "lack_support"],
  q5: "know_what_want",
  q6: "10_plus_hours",
  q9: "quick_direction"
}
```

**Perguntas visíveis**: Q1, Q2, Q3, Q4, Q5, Q6, Q9 (7 perguntas)

---

## 🔍 Validações Especiais

### Q4: Limite de Seleções

```typescript
// Máximo 2 seleções
if (current.length >= 2 && checked) {
  toast({
    title: "Limite atingido",
    description: "Você pode selecionar no máximo 2 opção(ões)."
  });
  return; // Não adiciona
}
```

### Q1: Limpeza de Condicionais

```typescript
// Se Q1 mudar, limpa respostas de perguntas não mais visíveis
if (questionId === "q1") {
  const newVisible = getVisibleQuestions(newAnswers);
  for (const key in cleanedAnswers) {
    if (!newVisible.includes(key) && key !== "q1") {
      delete cleanedAnswers[key];
    }
  }
}
```

### Validação de Valores

```typescript
// Garante que apenas valores permitidos são aceitos
if (!validateAnswerValue(questionId, value)) {
  setErrors({ [questionId]: "Valor inválido selecionado" });
  return false;
}
```

---

## 🚀 Integração com Experimento A/B

### Feature Flag

**Chave**: `contextual_questionnaire_enabled`

**Valores**: `"enabled"` | `"disabled"`

**Default**: `"disabled"`

### Fluxo de Atribuição

1. Usuário completa 60 questões
2. Server component busca variant do GrowthBook
3. Se `"enabled"` → Mostra questionário contextual
4. Se `"disabled"` → Pula direto para formulário de dados
5. Variant é salvo em `experimentVariant` no flowState

### Tracking

- `experiment_viewed`: Disparado quando variant é atribuído
- `contextual_questionnaire_completed`: Disparado quando questionário é completado
- `form_submitted`: Inclui `contextual_questionnaire_variant` como parâmetro

---

## 📝 Notas de Implementação

### Boas Práticas

1. **Validação Dupla**: Frontend e backend validam dados
2. **Degradação Graciosa**: Se validação falhar, não quebra fluxo
3. **Persistência Atômica**: Salvamento é sempre completo, nunca parcial
4. **Limpeza Automática**: Respostas condicionais são limpas quando não mais aplicáveis
5. **Feedback Visual**: Erros são claros e específicos

### Considerações

- **Performance**: Auto-save usa debounce implícito via React state
- **Acessibilidade**: Labels e ARIA attributes em todos os campos
- **UX**: Scroll automático para erros, progresso visual claro
- **Analytics**: Todos os eventos incluem variant para análise A/B

---

## 📚 Referências

- **Arquivo de Dados**: `src/data/contextualQuestions.ts`
- **Componente**: `src/components/pages/ContextualQuestionnairePage.tsx`
- **Persistência**: `src/lib/assessmentStorage.ts`
- **Analytics**: `src/lib/analytics.ts`
- **Edge Function**: `supabase/functions/create-result/index.ts`
- **Guia de Deploy**: `docs/DEPLOY.md`
- **Guia de Experimentos**: `docs/EXPERIMENT_SETUP_GUIDE.md`

---

**Última atualização**: Janeiro 2025
