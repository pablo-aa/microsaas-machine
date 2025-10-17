import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface RecommendedCareersProps {
  riasecScores: Record<string, number>;
  gardnerScores?: Record<string, number>;
  gopcScores?: Record<string, number>;
  isBlurred: boolean;
}

// Mapeamento de profissões por tipo RIASEC
const riasecCareers: Record<string, string[]> = {
  R: ["Engenheiro", "Mecânico", "Arquiteto", "Piloto", "Técnico"],
  I: ["Cientista", "Médico", "Pesquisador", "Analista de Dados", "Programador"],
  A: ["Designer", "Artista", "Músico", "Escritor", "Fotógrafo"],
  S: ["Professor", "Psicólogo", "Assistente Social", "Enfermeiro", "Terapeuta"],
  E: ["Empresário", "Gerente", "Advogado", "Vendedor", "Consultor"],
  C: ["Contador", "Administrador", "Analista Financeiro", "Auditor", "Secretário Executivo"]
};

// Mapeamento de profissões por tipo Gardner
const gardnerCareers: Record<string, string[]> = {
  "Intrapessoal": ["Escritor", "Filósofo", "Pesquisador", "Consultor", "Empreendedor"],
  "Interpessoal": ["Psicólogo", "Professor", "Assistente Social", "Terapeuta", "Recursos Humanos"],
  "Espacial": ["Arquiteto", "Designer", "Piloto", "Cirurgião", "Engenheiro"],
  "Lógico-Matemática": ["Cientista", "Engenheiro", "Matemático", "Analista", "Programador"],
  "Linguística": ["Escritor", "Jornalista", "Tradutor", "Professor de Idiomas", "Advogado"],
  "Musical": ["Músico", "Compositor", "Professor de Música", "Produtor Musical", "Maestro"],
  "Corporal-Cinestésica": ["Atleta", "Dançarino", "Cirurgião", "Fisioterapeuta", "Artesão"],
  "Naturalista": ["Biólogo", "Veterinário", "Agrônomo", "Geólogo", "Ambientalista"],
  "Existencial": ["Filósofo", "Teólogo", "Psicólogo", "Conselheiro", "Pesquisador"]
};

// Mapeamento de profissões por tipo GOPC
const gopcCareers: Record<string, string[]> = {
  "Gestão": ["Gerente", "Diretor", "Administrador", "Coordenador", "Supervisor"],
  "Operacional": ["Técnico", "Operador", "Assistente", "Analista", "Especialista"],
  "Pessoas": ["Recursos Humanos", "Psicólogo", "Treinador", "Assistente Social", "Recrutador"],
  "Criativo": ["Designer", "Publicitário", "Arquiteto", "Diretor de Arte", "Desenvolvedor"]
};

const RecommendedCareers: React.FC<RecommendedCareersProps> = ({ 
  riasecScores, 
  gardnerScores = {}, 
  gopcScores = {}, 
  isBlurred 
}) => {
  // Função para obter as top 3 categorias de cada teste
  const getTopCategories = (scores: Record<string, number>, count: number = 3) => {
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([category]) => category);
  };

  // Obter top categorias de cada teste
  const topRiasec = getTopCategories(riasecScores);
  const topGardner = gardnerScores ? getTopCategories(gardnerScores) : [];
  const topGopc = gopcScores ? getTopCategories(gopcScores) : [];

  // Coletar profissões das top categorias com sistema de pontuação
  const collectCareers = () => {
    // Objeto para armazenar pontuações de cada profissão
    const careerScores: Record<string, number> = {};
    
    // Pesos para cada teste
    const testWeights = {
      riasec: 1.5,  // Maior peso para RIASEC
      gardner: 1.2, // Peso médio para Gardner
      gopc: 1.0     // Peso padrão para GOPC
    };
    
    // Pesos para posição no ranking de cada teste (1º, 2º, 3º lugar)
    const rankWeights = [3, 2, 1];
    
    // Processar profissões do RIASEC
    topRiasec.forEach((category, index) => {
      if (riasecCareers[category]) {
        riasecCareers[category].forEach(career => {
          // Pontuação base = peso do teste * peso do ranking
          const score = testWeights.riasec * rankWeights[Math.min(index, rankWeights.length - 1)];
          careerScores[career] = (careerScores[career] || 0) + score;
        });
      }
    });
    
    // Processar profissões do Gardner
    topGardner.forEach((category, index) => {
      if (gardnerCareers[category]) {
        gardnerCareers[category].forEach(career => {
          // Pontuação base = peso do teste * peso do ranking
          const score = testWeights.gardner * rankWeights[Math.min(index, rankWeights.length - 1)];
          careerScores[career] = (careerScores[career] || 0) + score;
        });
      }
    });
    
    // Processar profissões do GOPC
    topGopc.forEach((category, index) => {
      if (gopcCareers[category]) {
        gopcCareers[category].forEach(career => {
          // Pontuação base = peso do teste * peso do ranking
          const score = testWeights.gopc * rankWeights[Math.min(index, rankWeights.length - 1)];
          careerScores[career] = (careerScores[career] || 0) + score;
        });
      }
    });
    
    // Bônus para profissões que aparecem em múltiplos testes (indica maior confiabilidade)
    Object.keys(careerScores).forEach(career => {
      let testsCount = 0;
      
      // Verificar se a profissão aparece no RIASEC
      if (topRiasec.some(category => riasecCareers[category]?.includes(career))) {
        testsCount++;
      }
      
      // Verificar se a profissão aparece no Gardner
      if (topGardner.some(category => gardnerCareers[category]?.includes(career))) {
        testsCount++;
      }
      
      // Verificar se a profissão aparece no GOPC
      if (topGopc.some(category => gopcCareers[category]?.includes(career))) {
        testsCount++;
      }
      
      // Adicionar bônus para profissões que aparecem em múltiplos testes
      if (testsCount > 1) {
        careerScores[career] *= (1 + (testsCount - 1) * 0.5); // 50% de bônus por teste adicional
      }
    });
    
    // Ordenar profissões por pontuação e pegar as top 6
    return Object.entries(careerScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 6)
      .map(([career]) => career);
  };

  const recommendedCareers = collectCareers();

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