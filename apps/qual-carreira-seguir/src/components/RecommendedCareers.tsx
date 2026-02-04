import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface RecommendedCareersProps {
  riasecScores: Record<string, number>;
  gardnerScores?: Record<string, number>;
  gopcScores?: Record<string, number>;
  isBlurred: boolean;
}

// Mapeamento de profissões por tipo RIASEC (15 carreiras por categoria)
const riasecCareers: Record<string, string[]> = {
  R: ["Engenheiro", "Mecânico", "Arquiteto", "Piloto", "Técnico", "Eletricista", "Soldador", "Carpinteiro", "Operador de Máquinas", "Topógrafo", "Geólogo", "Agrimensor", "Marceneiro", "Montador", "Instalador"],
  I: ["Cientista", "Médico", "Pesquisador", "Analista de Dados", "Programador", "Físico", "Químico", "Biólogo", "Estatístico", "Epidemiologista", "Arqueólogo", "Antropólogo", "Astronomo", "Pesquisador de Mercado", "Cientista de Dados"],
  A: ["Designer", "Artista", "Músico", "Escritor", "Fotógrafo", "Arquiteto", "Publicitário", "Diretor de Arte", "Ilustrador", "Cineasta", "Ator", "Dançarino", "Estilista", "Decorador", "Editor"],
  S: ["Professor", "Psicólogo", "Assistente Social", "Enfermeiro", "Terapeuta", "Pedagogo", "Fonoaudiólogo", "Fisioterapeuta", "Nutricionista", "Coordenador Pedagógico", "Orientador Vocacional", "Cuidador", "Trabalhador Social", "Conselheiro", "Médico"],
  E: ["Empresário", "Gerente", "Advogado", "Vendedor", "Consultor", "Diretor", "Coordenador", "Supervisor", "Empreendedor", "Corretor", "Relações Públicas", "Gestor de Projetos", "Executivo", "Líder de Equipe", "Negociador"],
  C: ["Contador", "Administrador", "Analista Financeiro", "Auditor", "Secretário Executivo", "Analista de Sistemas", "Técnico Contábil", "Assistente Administrativo", "Operador de Caixa", "Atendente", "Recepcionista", "Arquivista", "Bibliotecário", "Digitador", "Auxiliar Administrativo"]
};

// Mapeamento de profissões por tipo Gardner (15 carreiras por categoria)
const gardnerCareers: Record<string, string[]> = {
  "Intrapessoal": ["Escritor", "Filósofo", "Pesquisador", "Consultor", "Empreendedor", "Psicólogo", "Terapeuta", "Coaching", "Mentor", "Autônomo", "Freelancer", "Artista", "Poeta", "Romancista", "Ensaísta"],
  "Interpessoal": ["Psicólogo", "Professor", "Assistente Social", "Terapeuta", "Recursos Humanos", "Médico", "Enfermeiro", "Coordenador", "Líder de Equipe", "Treinador", "Palestrante", "Mediador", "Conselheiro", "Mentor", "Coach"],
  "Espacial": ["Arquiteto", "Designer", "Piloto", "Cirurgião", "Engenheiro", "Urbanista", "Designer Gráfico", "Fotógrafo", "Cartógrafo", "Navegador", "Escultor", "Ilustrador", "Desenhista", "Topógrafo", "Geógrafo"],
  "Lógico-Matemática": ["Cientista", "Engenheiro", "Matemático", "Analista", "Programador", "Estatístico", "Físico", "Químico", "Economista", "Contador", "Auditor", "Pesquisador", "Cientista de Dados", "Analista de Sistemas", "Desenvolvedor"],
  "Linguística": ["Escritor", "Jornalista", "Tradutor", "Professor de Idiomas", "Advogado", "Redator", "Editor", "Revisor", "Locutor", "Apresentador", "Poeta", "Roteirista", "Copywriter", "Intérprete", "Linguista"],
  "Musical": ["Músico", "Compositor", "Professor de Música", "Produtor Musical", "Maestro", "Cantor", "Instrumentista", "DJ", "Sonoplasta", "Técnico de Som", "Arranjador", "Musicoterapeuta", "Crítico Musical", "Regente", "Engenheiro de Áudio"],
  "Corporal-Cinestésica": ["Atleta", "Dançarino", "Cirurgião", "Fisioterapeuta", "Artesão", "Educador Físico", "Personal Trainer", "Massagista", "Quiropraxista", "Acupunturista", "Pilates", "Yoga", "Marceneiro", "Escultor", "Ceramista"],
  "Naturalista": ["Biólogo", "Veterinário", "Agrônomo", "Geólogo", "Ambientalista", "Oceanógrafo", "Meteorologista", "Botânico", "Zoólogo", "Ecólogo", "Engenheiro Florestal", "Técnico Agrícola", "Pesquisador Ambiental", "Conservacionista", "Geógrafo"],
  "Existencial": ["Filósofo", "Teólogo", "Psicólogo", "Conselheiro", "Pesquisador", "Professor de Filosofia", "Escritor", "Mentor Espiritual", "Terapeuta", "Coaching", "Consultor", "Pesquisador Acadêmico", "Historiador", "Antropólogo", "Sociólogo"]
};

// Número de perguntas por categoria
const riasecQuestionCounts: Record<string, number> = { R: 5, I: 5, A: 4, S: 4, E: 3, C: 5 };
const gardnerQuestionCounts: Record<string, number> = {
  "Lógico-Matemática": 16, "Interpessoal": 9, "Intrapessoal": 9, "Espacial": 6,
  "Naturalista": 5, "Linguística": 4, "Existencial": 4, "Corporal-Cinestésica": 3, "Musical": 2
};
const gopcQuestionCounts: Record<string, number> = { AK: 37, PC: 8, TD: 15 };

// Interface para vetor de profissão
interface CareerVector {
  riasec: Record<string, number>;
  gardner: Record<string, number>;
  gopc: Record<string, number>;
}

// Interface para vetor da pessoa
interface PersonVector {
  riasec: Record<string, number>;
  gardner: Record<string, number>;
  gopc: Record<string, number>;
}

// Gerar vetores de profissões automaticamente
const generateCareerVectors = (): Record<string, CareerVector> => {
  const careers: Record<string, CareerVector> = {};
  
  const getWeight = (index: number): number => {
    if (index === 0) return 1.0;
    if (index === 1) return 0.85;
    if (index === 2) return 0.7;
    return Math.max(0.3, 1.0 - (index * 0.15));
  };
  
  Object.entries(riasecCareers).forEach(([category, careerList]) => {
    careerList.forEach((career, index) => {
      if (!careers[career]) {
        careers[career] = { riasec: {}, gardner: {}, gopc: {} };
      }
      careers[career].riasec[category] = getWeight(index);
    });
  });
  
  Object.entries(gardnerCareers).forEach(([category, careerList]) => {
    careerList.forEach((career, index) => {
      if (!careers[career]) {
        careers[career] = { riasec: {}, gardner: {}, gopc: {} };
      }
      careers[career].gardner[category] = getWeight(index);
    });
  });
  
  return careers;
};

// ETAPA 1: Normalização com peso de confiabilidade
const normalizeWithReliability = (
  scores: Record<string, number>,
  questionCounts: Record<string, number>,
  min: number = 1,
  max: number = 5
): Record<string, number> => {
  const normalized: Record<string, number> = {};
  Object.entries(scores).forEach(([category, score]) => {
    const nItems = questionCounts[category] || 1;
    const p = (score - nItems * min) / (nItems * (max - min));
    const wConf = Math.sqrt(nItems);
    normalized[category] = p * wConf;
  });
  return normalized;
};

// ETAPA 2: Função de realce para altas afinidades
const applyEnhancement = (
  normalizedScores: Record<string, number>,
  questionCounts: Record<string, number>,
  theta: number = 0.5,
  gamma: number = 1.3
): Record<string, number> => {
  const enhanced: Record<string, number> = {};
  const maxItems = Math.max(...Object.values(questionCounts));
  const maxPossible = Math.sqrt(maxItems);
  
  Object.entries(normalizedScores).forEach(([category, score]) => {
    const p = Math.min(1, score / maxPossible);
    if (p <= theta) {
      enhanced[category] = score * 0.3;
    } else {
      enhanced[category] = Math.pow((p - theta) / (1 - theta), gamma) * maxPossible;
    }
  });
  return enhanced;
};

// ETAPA 3: Pesos por posição no ranking
const applyRankingWeights = (
  scores: Record<string, number>,
  weights: number[] = [1.0, 0.75, 0.5, 0.25]
): Record<string, number> => {
  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, score], index) => {
      const weight = weights[Math.min(index, weights.length - 1)];
      return { category: cat, score: score * weight };
    });
  return ranked.reduce((acc, { category, score }) => {
    acc[category] = score;
    return acc;
  }, {} as Record<string, number>);
};

// ETAPA 4: Combinar os 3 modelos
const combineModels = (
  riasec: Record<string, number>,
  gardner: Record<string, number>,
  gopc: Record<string, number>,
  weights: { riasec: number; gardner: number; gopc: number } = { riasec: 0.4, gardner: 0.4, gopc: 0.2 }
): PersonVector => {
  const sumRiasec = Object.values(riasec).reduce((a, b) => a + Math.abs(b), 0) || 1;
  const sumGardner = Object.values(gardner).reduce((a, b) => a + Math.abs(b), 0) || 1;
  const sumGopc = Object.values(gopc).reduce((a, b) => a + Math.abs(b), 0) || 1;
  
  const riasecNorm = Object.fromEntries(
    Object.entries(riasec).map(([k, v]) => [k, (v / sumRiasec) * weights.riasec])
  );
  const gardnerNorm = Object.fromEntries(
    Object.entries(gardner).map(([k, v]) => [k, (v / sumGardner) * weights.gardner])
  );
  const gopcNorm = Object.fromEntries(
    Object.entries(gopc).map(([k, v]) => [k, (v / sumGopc) * weights.gopc])
  );
  
  return { riasec: riasecNorm, gardner: gardnerNorm, gopc: gopcNorm };
};

// ETAPA 5: Calcular compatibilidade pessoa-profissão
const calculateCompatibility = (personVector: PersonVector, careerVector: CareerVector): number => {
  let compatBruta = 0;
  
  Object.entries(careerVector.riasec || {}).forEach(([cat, weight]) => {
    compatBruta += (personVector.riasec[cat] || 0) * weight;
  });
  Object.entries(careerVector.gardner || {}).forEach(([cat, weight]) => {
    compatBruta += (personVector.gardner[cat] || 0) * weight;
  });
  Object.entries(careerVector.gopc || {}).forEach(([cat, weight]) => {
    compatBruta += (personVector.gopc[cat] || 0) * weight;
  });
  
  const normCareer = Math.sqrt(
    [
      ...Object.values(careerVector.riasec || {}),
      ...Object.values(careerVector.gardner || {}),
      ...Object.values(careerVector.gopc || {})
    ].reduce((sum, v) => sum + v * v, 0)
  );
  
  const compatNorm = normCareer > 0 ? compatBruta / normCareer : 0;
  
  const highDimensions = [
    ...Object.values(careerVector.riasec || {}),
    ...Object.values(careerVector.gardner || {}),
    ...Object.values(careerVector.gopc || {})
  ].filter(v => v >= 0.7).length;
  
  const compatCorrigida = compatNorm / Math.sqrt(Math.max(1, highDimensions));
  
  const numDimensions = [
    ...Object.keys(careerVector.riasec || {}),
    ...Object.keys(careerVector.gardner || {}),
    ...Object.keys(careerVector.gopc || {})
  ].length;
  
  const compatFinal = compatCorrigida * (1 + numDimensions * 0.001);
  
  return compatFinal;
};

// Função principal para calcular top 6
const getTop6Careers = (
  riasecScores: Record<string, number>,
  gardnerScores: Record<string, number>,
  gopcScores: Record<string, number>
): string[] => {
  const allCareers = generateCareerVectors();
  
  const riasecNorm = normalizeWithReliability(riasecScores, riasecQuestionCounts);
  const gardnerNorm = normalizeWithReliability(gardnerScores, gardnerQuestionCounts);
  const gopcNorm = normalizeWithReliability(gopcScores, gopcQuestionCounts);
  
  const riasecEnhanced = applyEnhancement(riasecNorm, riasecQuestionCounts);
  const gardnerEnhanced = applyEnhancement(gardnerNorm, gardnerQuestionCounts);
  const gopcEnhanced = applyEnhancement(gopcNorm, gopcQuestionCounts);
  
  const riasecRanked = applyRankingWeights(riasecEnhanced);
  const gardnerRanked = applyRankingWeights(gardnerEnhanced);
  const gopcRanked = applyRankingWeights(gopcEnhanced);
  
  const personVector = combineModels(riasecRanked, gardnerRanked, gopcRanked);
  
  const compatibilities = Object.entries(allCareers).map(([career, vector]) => ({
    career,
    score: calculateCompatibility(personVector, vector)
  })).sort((a, b) => {
    if (Math.abs(b.score - a.score) < 0.01) {
      return a.career.localeCompare(b.career);
    }
    return b.score - a.score;
  });
  
  return compatibilities.slice(0, 6).map(item => item.career);
};

const RecommendedCareers: React.FC<RecommendedCareersProps> = ({ 
  riasecScores, 
  gardnerScores = {}, 
  gopcScores = {}, 
  isBlurred 
}) => {
  const recommendedCareers = useMemo(() => {
    return getTop6Careers(riasecScores, gardnerScores, gopcScores);
  }, [riasecScores, gardnerScores, gopcScores]);

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto mb-10 text-center">
          {/* Badge "Veredito Final" com fundo roxo */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Veredito Final
          </div>
          
          <h2 className="text-3xl font-bold mb-3 text-gray-800">
            Profissões recomendadas com base nos testes
          </h2>
          <p className="text-gray-600">
            Com base na análise dos seus resultados, estas são as carreiras que mais se alinham com seu perfil
          </p>
          
          {/* Aviso de refatoração */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Nossas recomendações foram aprimoradas com um algoritmo mais preciso que considera normalização psicométrica e maior diversidade de profissões</span>
          </div>
        </div>
        
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 ">
            {recommendedCareers.map((career, index) => (
              <div key={index} className="transform transition-all duration-300 hover:scale-105">
                <Card className="h-full bg-white border-0 shadow-md hover:shadow-xl overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <p className={`text-xl font-semibold text-gray-800 mb-2 ${isBlurred ? 'blur-md' : ''}`}>{career}</p>
                    <p className={`text-sm text-gray-500 ${isBlurred ? 'blur-sm' : ''}`}>Compatibilidade alta com seu perfil</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto">
            <p>As áreas recomendadas podem parecer diversas, mas é comum que pessoas tenham múltiplas habilidades e aptidões que se complementam em diferentes carreiras.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendedCareers;