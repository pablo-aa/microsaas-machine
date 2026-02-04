// Auto-generated from qualcarreira.json (version: 2025-10-04)

// ============= RIASEC =============

export interface RiasecProfile {
  id: string;
  label: string;
  desc: string;
  traits: string[];
  careers: string[];
}

export const riasecProfiles: RiasecProfile[] = [
  {
    id: "R",
    label: "Realista",
    desc: "Pessoas com perfil realista preferem atividades práticas, concretas e que envolvem o uso de ferramentas, máquinas ou trabalho físico. Tendem a valorizar autonomia técnica e rotinas bem definidas. São objetivas, diretas e geralmente habilidosas com tarefas manuais ou operacionais.",
    traits: ["prático", "concreto", "técnico", "preciso", "físico"],
    careers: ["Engenheiro Mecânico", "Piloto", "Técnico em Eletrônica", "Agricultor", "Arquiteto", "Eletricista"]
  },
  {
    id: "I",
    label: "Investigativo",
    desc: "Indivíduos com perfil investigativo são movidos pela curiosidade, raciocínio lógico e desejo de entender fenômenos complexos. Preferem explorar ideias, analisar dados, resolver problemas e investigar causas. São autodidatas, críticos e valorizam conhecimento teórico ou científico.",
    traits: ["analítico", "curioso", "lógico", "preciso", "metódico"],
    careers: ["Cientista", "Médico", "Programador", "Matemático", "Biólogo", "Pesquisador"]
  },
  {
    id: "A",
    label: "Artístico",
    desc: "Pessoas com perfil artístico preferem contextos que permitam expressão criativa, originalidade e interpretação. Valorizam estética, imaginação e liberdade para experimentar novas formas, mídias e linguagens.",
    traits: ["criativo", "original", "expressivo", "imaginativo", "independente"],
    careers: ["Designer (Gráfico/Produto)", "Diretor de Arte", "Artista Visual/Ilustrador", "Escritor/Copywriter", "Músico/Produtor Musical", "Designer de Jogos/Multimídia"]
  },
  {
    id: "S",
    label: "Social",
    desc: "Pessoas com perfil social se orientam por ajudar, ensinar, orientar e cuidar. Preferem ambientes colaborativos, com interação humana frequente, e buscam impacto positivo no desenvolvimento de outras pessoas.",
    traits: ["empático", "comunicativo", "colaborativo", "pedagógico", "solidário"],
    careers: ["Professor", "Enfermeiro", "Psicólogo", "Assistente Social", "Fonoaudiólogo", "Terapeuta Ocupacional"]
  },
  {
    id: "E",
    label: "Empreendedor",
    desc: "Indivíduos com perfil empreendedor gostam de liderar, negociar, persuadir e mobilizar pessoas e recursos para atingir metas. Preferem contextos dinâmicos, assumem responsabilidades e correm riscos calculados.",
    traits: ["persuasivo", "proativo", "competitivo", "visionário", "orientado a resultados"],
    careers: ["Gerente de Marketing/Produto", "Profissional de Vendas", "Empreendedor/Fundador", "Consultor de Negócios", "Executivo de Contas", "Gestor de Projetos"]
  },
  {
    id: "C",
    label: "Convencional",
    desc: "Pessoas com perfil convencional preferem rotinas claras, precisão e organização de informações, documentos e processos. Valorizam confiabilidade, padronização e atenção a detalhes.",
    traits: ["organizado", "detalhista", "confiável", "metódico", "persistente"],
    careers: ["Contador", "Analista Financeiro", "Analista de Compliance", "Analista de Processos", "Assistente Administrativo", "Gestor de Escritório"]
  }
];

export const riasecInfo = {
  name: "RIASEC",
  fullName: "Modelo de Holland",
  description: "O modelo RIASEC de Holland classifica preferências vocacionais em seis categorias: Realista, Investigativo, Artístico, Social, Empreendedor e Convencional. Cada pessoa apresenta combinações únicas dessas dimensões.",
};

// ============= GARDNER =============

export interface GardnerDomain {
  id: string;
  desc: string;
  careers: string[];
}

export const gardnerDomains: GardnerDomain[] = [
  {
    id: "Linguística",
    desc: "Habilidade de usar a linguagem de forma eficaz para ler, escrever, argumentar e comunicar ideias com clareza e impacto.",
    careers: ["Escritor/Autor", "Editor", "Jornalista/Repórter", "Redator Técnico", "Tradutor/Intérprete", "Profissional de Relações Públicas"]
  },
  {
    id: "Lógico-Matemática",
    desc: "Capacidade de raciocínio lógico, análise de padrões, modelagem e resolução de problemas quantitativos e abstratos.",
    careers: ["Engenheiro", "Matemático", "Economista", "Cientista de Dados", "Físico", "Estatístico"]
  },
  {
    id: "Espacial",
    desc: "Aptidão para visualizar, imaginar e manipular formas, proporções e relações espaciais, aplicando senso estético e funcional.",
    careers: ["Arquiteto", "Designer Gráfico", "Designer de Produto", "UI/UX Designer", "Urbanista", "Ilustrador"]
  },
  {
    id: "Musical",
    desc: "Sensibilidade a ritmo, melodia e harmonia; criação, performance e produção de conteúdo sonoro e musical.",
    careers: ["Músico/Intérprete", "Produtor Musical", "Engenheiro/Técnico de Áudio", "Compositor", "Diretor Musical", "Professor de Música"]
  },
  {
    id: "Corporal-Cinestésica",
    desc: "Domínio da coordenação motora, expressão corporal e aprendizagem pela ação prática.",
    careers: ["Personal Trainer", "Dançarino", "Coreógrafo", "Fisioterapeuta", "Bombeiro", "Massoterapeuta"]
  },
  {
    id: "Interpessoal",
    desc: "Habilidade de compreender, comprometer-se e interagir de forma empática e eficaz; envolve trabalho em equipe, liderança e mediação de conflitos.",
    careers: ["Psicólogo", "Gerente de RH", "Professor", "Assistente Social", "Vendedor/Executivo de Contas", "Mediador"]
  },
  {
    id: "Intrapessoal",
    desc: "Consciência de si, motivação e autorregulação; clareza de valores, metas e propósito.",
    careers: ["Empreendedor", "Coach", "Pesquisador", "Terapeuta", "Filósofo", "Conselheiro de Carreira"]
  },
  {
    id: "Naturalista",
    desc: "Percepção de padrões do meio natural; interesse por biodiversidade, ecossistemas e sustentabilidade.",
    careers: ["Biólogo", "Veterinário", "Cientista Ambiental", "Agrônomo", "Ecólogo/Conservacionista", "Especialista em Sustentabilidade"]
  },
  {
    id: "Existencial",
    desc: "Reflexão sobre sentido, valores, ética e grandes questões humanas; interesse por mediação e orientação.",
    careers: ["Professor de Filosofia", "Mediador", "Líder Religioso/Capelão", "Terapeuta de Casal e Família", "Gestor de Serviços Sociais", "Consultor de Ética"]
  }
];

export const gardnerInfo = {
  name: "Inteligências Múltiplas",
  fullName: "Teoria de Gardner",
  description: "A teoria de Gardner propõe que a inteligência não é uma capacidade única, mas um conjunto de múltiplas inteligências independentes. Cada pessoa possui uma combinação única dessas inteligências, que influenciam suas preferências e aptidões.",
};

// ============= GOPC =============

export interface GopcAxis {
  id: string;
  label: string;
  desc: string;
  tips: string[];
}

export const gopcAxes: GopcAxis[] = [
  {
    id: "AK",
    label: "Autoconhecimento",
    desc: "Compreender seus interesses, valores, habilidades e traços de personalidade para orientar decisões de carreira.",
    tips: [
      "Compartilhe sua experiência ajudando colegas a se conhecerem melhor, atuando como mentor(a) ou orientador(a).",
      "Revise suas experiências passadas e anote situações em que você se sentiu satisfeito(a) e teve bons resultados.",
      "Liste 3 pontos fortes e 3 valores importantes para você e escolha oportunidades que combinem com essa lista."
    ]
  },
  {
    id: "PC",
    label: "Planejamento de Carreira",
    desc: "Estabelecer metas profissionais e planejar os passos necessários para alcançá-las, acompanhando o progresso.",
    tips: [
      "Defina uma meta profissional para os próximos 3 meses e divida em passos semanais com datas.",
      "Monte um plano de aprendizado: escolha 3 cursos e 2 projetos práticos, registre o andamento e revise todo mês.",
      "Acompanhe o progresso com um calendário ou checklist e ajuste as prioridades quando necessário."
    ]
  },
  {
    id: "TD",
    label: "Tomada de Decisão",
    desc: "Avaliar alternativas com critérios claros, reduzir incertezas e escolher caminhos viáveis no tempo certo.",
    tips: [
      "Escolha 3 a 5 opções e compare cada uma por critérios simples: combina com você? quanto esforço exige? qual o possível retorno? quais os riscos?",
      "Faça pequenos testes antes de decidir: um projeto curto, conversar com alguém da área ou acompanhar um profissional por um dia.",
      "Defina limites e prazos claros: por exemplo, 'se em 30 dias eu não alcançar X, escolho outra opção'."
    ]
  }
];

export const gopcInfo = {
  name: "GOPC",
  fullName: "Gestão e Orientação Profissional de Carreira",
  description: "GOPC é um modelo que avalia três competências essenciais para o desenvolvimento de carreira: Autoconhecimento (compreender interesses, valores, habilidades e personalidade), Planejamento de Carreira (estabelecer metas e planejar passos) e Tomada de Decisão (avaliar opções e decidir de forma informada).",
};

// ============= HELPER FUNCTIONS =============

export const getRiasecProfile = (letter: string): RiasecProfile | undefined => {
  return riasecProfiles.find(p => p.id === letter);
};

export const getGardnerDomain = (domainName: string): GardnerDomain | undefined => {
  return gardnerDomains.find(d => d.id === domainName);
};

export const getGopcAxis = (axisId: string): GopcAxis | undefined => {
  return gopcAxes.find(a => a.id === axisId);
};
