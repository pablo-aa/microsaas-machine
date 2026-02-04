// Mapeamento de IDs do questionário contextual para labels legíveis

export const QUESTIONNAIRE_LABELS: Record<string, Record<string, string>> = {
  q1: {
    first_career: "Estou escolhendo minha primeira carreira",
    career_change: "Quero mudar de área (transição de carreira)",
    career_growth: "Quero crescer na minha área atual",
    unemployed: "Estou desempregado(a) e buscando direção",
    self_employed: "Sou autônomo(a)/tenho negócio e quero direcionar minha atuação",
  },
  q2: {
    "0_30_days": "0 a 30 dias",
    "1_3_months": "1 a 3 meses",
    "3_6_months": "3 a 6 meses",
    "6_plus_months": "6+ meses",
    just_exploring: "Só estou explorando por enquanto",
  },
  q3: {
    more_satisfaction: "Mais satisfação/propósito",
    more_money: "Mais dinheiro",
    more_stability: "Mais estabilidade",
    more_flexibility: "Mais flexibilidade (horário/remoto)",
    fast_growth: "Crescimento rápido",
    more_autonomy: "Mais autonomia",
  },
  q4: {
    dont_know_skills: "Não sei no que sou bom(boa)",
    fear_wrong_choice: "Medo de escolher errado",
    lack_clarity: "Falta de clareza do caminho (passo a passo)",
    lack_time: "Falta de tempo/rotina corrida",
    money_insecurity: "Insegurança com dinheiro/salário",
    lack_support: "Falta de apoio/confiança",
    tried_before: "Já tentei antes e não deu certo",
  },
  q5: {
    many_ideas: "Tenho muitas ideias e não consigo decidir",
    know_what_want: "Até sei o que quero, mas não sei por onde começar",
    unsatisfied_afraid: "Estou insatisfeito(a) e quero uma mudança, mas tenho medo",
    want_strategic: "Quero algo mais estratégico, com plano e consistência",
    just_confirm: "Estou bem, só quero confirmar se estou no caminho certo",
  },
  q6: {
    "0_2_hours": "0 a 2 horas",
    "3_5_hours": "3 a 5 horas",
    "6_10_hours": "6 a 10 horas",
    "10_plus_hours": "10+ horas",
  },
  q7: {
    completely_different: "Totalmente diferente do que faço hoje",
    similar_to_current: "Próxima do que já faço hoje",
    dont_know_yet: "Ainda não sei",
  },
  q8: {
    start_from_zero: "Começar do zero",
    salary_reduction: "Reduzir salário",
    cant_find_job: "Não conseguir emprego na nova área",
    waste_time: "Perder tempo escolhendo errado",
    lack_family_support: "Falta de apoio da família/ambiente",
  },
  q9: {
    quick_direction: "Conseguir uma direção rápida",
    high_employability: "Escolher algo com alta empregabilidade",
    find_love: "Encontrar algo que eu goste de verdade",
    understand_skills: "Entender minhas habilidades e pontos fortes",
  },
};

// Função helper para obter label de uma opção
export const getQuestionnaireLabel = (question: string, option: string): string => {
  return QUESTIONNAIRE_LABELS[question]?.[option] || option;
};

// Função para obter título da pergunta
export const getQuestionTitle = (question: string): string => {
  const titles: Record<string, string> = {
    q1: "Q1: Momento de Carreira",
    q2: "Q2: Urgência",
    q3: "Q3: Objetivo Principal",
    q4: "Q4: Fatores Bloqueadores",
    q5: "Q5: Situação Atual",
    q6: "Q6: Tempo Semanal Disponível",
    q7: "Q7: Direção da Transição",
    q8: "Q8: Maior Medo na Transição",
    q9: "Q9: Prioridade para Desempregado",
  };
  return titles[question] || question;
};
