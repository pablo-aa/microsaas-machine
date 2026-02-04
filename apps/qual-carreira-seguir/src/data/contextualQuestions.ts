/**
 * Estrutura de dados para o questionário contextual pré-formulário
 * 6 perguntas principais + 3 condicionais
 */

export type CareerMoment =
  | "first_career"
  | "career_change"
  | "career_growth"
  | "unemployed"
  | "self_employed";

export type Urgency =
  | "0_30_days"
  | "1_3_months"
  | "3_6_months"
  | "6_plus_months"
  | "just_exploring";

export type MainGoal =
  | "more_satisfaction"
  | "more_money"
  | "more_stability"
  | "more_flexibility"
  | "fast_growth"
  | "more_autonomy";

export type BlockingFactor =
  | "dont_know_skills"
  | "fear_wrong_choice"
  | "lack_clarity"
  | "lack_time"
  | "money_insecurity"
  | "lack_support"
  | "tried_before";

export type CurrentSituation =
  | "many_ideas"
  | "know_what_want"
  | "unsatisfied_afraid"
  | "want_strategic"
  | "just_confirm";

export type WeeklyTime =
  | "0_2_hours"
  | "3_5_hours"
  | "6_10_hours"
  | "10_plus_hours";

export type TransitionDirection =
  | "completely_different"
  | "similar_to_current"
  | "dont_know_yet";

export type TransitionFear =
  | "start_from_zero"
  | "salary_reduction"
  | "cant_find_job"
  | "waste_time"
  | "lack_family_support";

export type UnemployedPriority =
  | "quick_direction"
  | "high_employability"
  | "find_love"
  | "understand_skills";

export interface ContextualAnswers {
  q1: CareerMoment;
  q2: Urgency;
  q3: MainGoal;
  q4: BlockingFactor[]; // Máximo 2 opções
  q5: CurrentSituation;
  q6: WeeklyTime;
  q7?: TransitionDirection; // Condicional: aparece se q1 = "career_change"
  q8?: TransitionFear; // Condicional: aparece se q1 = "career_change"
  q9?: UnemployedPriority; // Condicional: aparece se q1 = "unemployed"
}

export interface ContextualQuestion {
  id: string;
  text: string;
  title?: string; // Título mais descritivo
  subtitle?: string; // Subtítulo explicativo
  type: "single" | "multiple";
  required: boolean;
  options: Array<{
    value: string;
    label: string;
  }>;
  conditional?: {
    dependsOn: "q1";
    showWhen: CareerMoment[];
  };
  maxSelections?: number; // Para multi-select
}

export const contextualQuestions: ContextualQuestion[] = [
  {
    id: "q1",
    text: "Momento de carreira",
    title: "Em que momento da sua trajetória profissional você está?",
    subtitle: "Isso nos ajuda a entender melhor o contexto da sua busca e personalizar os resultados.",
    type: "single",
    required: true,
    options: [
      { value: "first_career", label: "Estou escolhendo minha primeira carreira" },
      { value: "career_change", label: "Quero mudar de área (transição de carreira)" },
      { value: "career_growth", label: "Quero crescer na minha área atual" },
      { value: "unemployed", label: "Estou desempregado(a) e buscando direção" },
      { value: "self_employed", label: "Sou autônomo(a)/tenho negócio e quero direcionar minha atuação" },
    ],
  },
  {
    id: "q2",
    text: "Urgência",
    title: "Qual é o prazo que você tem para tomar uma decisão?",
    subtitle: "Entender sua urgência nos permite priorizar informações mais relevantes para o seu momento.",
    type: "single",
    required: true,
    options: [
      { value: "0_30_days", label: "0 a 30 dias" },
      { value: "1_3_months", label: "1 a 3 meses" },
      { value: "3_6_months", label: "3 a 6 meses" },
      { value: "6_plus_months", label: "6+ meses" },
      { value: "just_exploring", label: "Só estou explorando por enquanto" },
    ],
  },
  {
    id: "q3",
    text: "Objetivo principal",
    title: "O que você mais busca em uma nova carreira?",
    subtitle: "Selecione o principal objetivo que você deseja alcançar com essa mudança ou escolha.",
    type: "single",
    required: true,
    options: [
      { value: "more_satisfaction", label: "Mais satisfação/propósito" },
      { value: "more_money", label: "Mais dinheiro" },
      { value: "more_stability", label: "Mais estabilidade" },
      { value: "more_flexibility", label: "Mais flexibilidade (horário/remoto)" },
      { value: "fast_growth", label: "Crescimento rápido" },
      { value: "more_autonomy", label: "Mais autonomia" },
    ],
  },
  {
    id: "q4",
    text: "O que mais te trava hoje?",
    title: "Quais são os principais obstáculos que você enfrenta?",
    subtitle: "Selecione até 2 fatores que mais dificultam sua decisão ou progresso profissional.",
    type: "multiple",
    required: true,
    maxSelections: 2,
    options: [
      { value: "dont_know_skills", label: "Não sei no que sou bom(boa)" },
      { value: "fear_wrong_choice", label: "Medo de escolher errado" },
      { value: "lack_clarity", label: "Falta de clareza do caminho (passo a passo)" },
      { value: "lack_time", label: "Falta de tempo/rotina corrida" },
      { value: "money_insecurity", label: "Insegurança com dinheiro/salário" },
      { value: "lack_support", label: "Falta de apoio/confiança" },
      { value: "tried_before", label: "Já tentei antes e não deu certo" },
    ],
  },
  {
    id: "q5",
    text: "Situação atual (frase que descreve melhor)",
    title: "Qual frase descreve melhor sua situação atual?",
    subtitle: "Escolha a opção que mais se aproxima do que você está sentindo ou vivenciando agora.",
    type: "single",
    required: true,
    options: [
      { value: "many_ideas", label: "Tenho muitas ideias e não consigo decidir" },
      { value: "know_what_want", label: "Até sei o que quero, mas não sei por onde começar" },
      { value: "unsatisfied_afraid", label: "Estou insatisfeito(a) e quero uma mudança, mas tenho medo" },
      { value: "want_strategic", label: "Quero algo mais estratégico, com plano e consistência" },
      { value: "just_confirm", label: "Estou bem, só quero confirmar se estou no caminho certo" },
    ],
  },
  {
    id: "q6",
    text: "Tempo disponível por semana",
    title: "Quanto tempo você tem disponível por semana para investir na sua carreira?",
    subtitle: "Considere o tempo que você pode dedicar para estudar, se preparar ou fazer networking relacionado à sua nova direção.",
    type: "single",
    required: true,
    options: [
      { value: "0_2_hours", label: "0 a 2 horas" },
      { value: "3_5_hours", label: "3 a 5 horas" },
      { value: "6_10_hours", label: "6 a 10 horas" },
      { value: "10_plus_hours", label: "10+ horas" },
    ],
  },
  {
    id: "q7",
    text: "Direção da transição",
    title: "Para qual direção você quer fazer a transição?",
    subtitle: "Você está pensando em algo completamente novo ou em uma área próxima da sua experiência atual?",
    type: "single",
    required: true,
    conditional: {
      dependsOn: "q1",
      showWhen: ["career_change"],
    },
    options: [
      { value: "completely_different", label: "Totalmente diferente do que faço hoje" },
      { value: "similar_to_current", label: "Próxima do que já faço hoje" },
      { value: "dont_know_yet", label: "Ainda não sei" },
    ],
  },
  {
    id: "q8",
    text: "Maior medo na transição",
    title: "Qual é o seu maior medo ao pensar em mudar de carreira?",
    subtitle: "Identificar seus medos nos ajuda a criar estratégias mais adequadas para sua transição.",
    type: "single",
    required: true,
    conditional: {
      dependsOn: "q1",
      showWhen: ["career_change"],
    },
    options: [
      { value: "start_from_zero", label: "Começar do zero" },
      { value: "salary_reduction", label: "Reduzir salário" },
      { value: "cant_find_job", label: "Não conseguir emprego na nova área" },
      { value: "waste_time", label: "Perder tempo escolhendo errado" },
      { value: "lack_family_support", label: "Falta de apoio da família/ambiente" },
    ],
  },
  {
    id: "q9",
    text: "Prioridade para quem está desempregado(a)",
    title: "Qual é a sua prioridade neste momento?",
    subtitle: "Como você está desempregado(a), o que é mais importante para você agora?",
    type: "single",
    required: true,
    conditional: {
      dependsOn: "q1",
      showWhen: ["unemployed"],
    },
    options: [
      { value: "quick_direction", label: "Conseguir uma direção rápida" },
      { value: "high_employability", label: "Escolher algo com alta empregabilidade" },
      { value: "find_love", label: "Encontrar algo que eu goste de verdade" },
      { value: "understand_skills", label: "Entender minhas habilidades e pontos fortes" },
    ],
  },
];

/**
 * Valida se uma resposta está dentro das opções permitidas
 */
export function validateAnswerValue(
  questionId: string,
  value: string | string[]
): boolean {
  const question = contextualQuestions.find((q) => q.id === questionId);
  if (!question) return false;

  const validValues = question.options.map((opt) => opt.value);

  if (question.type === "multiple") {
    if (!Array.isArray(value)) return false;
    return value.every((v) => validValues.includes(v));
  } else {
    if (Array.isArray(value)) return false;
    return validValues.includes(value);
  }
}

/**
 * Verifica quais perguntas devem ser exibidas baseado nas respostas atuais
 */
export function getVisibleQuestions(answers: Partial<ContextualAnswers>): string[] {
  const visible: string[] = [];

  for (const question of contextualQuestions) {
    // Perguntas principais sempre visíveis
    if (!question.conditional) {
      visible.push(question.id);
      continue;
    }

    // Perguntas condicionais
    if (question.conditional.dependsOn === "q1" && answers.q1) {
      if (question.conditional.showWhen.includes(answers.q1)) {
        visible.push(question.id);
      }
    }
  }

  return visible;
}

/**
 * Valida se todas as perguntas obrigatórias visíveis foram respondidas
 */
export function validateRequiredAnswers(
  answers: Partial<ContextualAnswers>
): { valid: boolean; missing: string[] } {
  const visible = getVisibleQuestions(answers);
  const missing: string[] = [];

  for (const questionId of visible) {
    const question = contextualQuestions.find((q) => q.id === questionId);
    if (!question || !question.required) continue;

    const answer = answers[questionId as keyof ContextualAnswers];

    if (question.type === "multiple") {
      if (!Array.isArray(answer) || answer.length === 0) {
        missing.push(questionId);
      } else if (question.maxSelections && answer.length > question.maxSelections) {
        missing.push(questionId); // Excede limite
      }
    } else {
      if (!answer || (typeof answer === 'string' && answer.trim() === "")) {
        missing.push(questionId);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

