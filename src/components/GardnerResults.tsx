import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { questions } from "@/data/questions"; // ✅ pega os domínios diretamente da sua fonte única

interface GardnerResultsProps {
  gardnerScores: Record<string, number>;
  isBlurred?: boolean;
}

const intelligenceDescriptions: Record<string, string> = {
  Intrapessoal: "Você demonstra forte inteligência intrapessoal: autoconhecimento, reflexão e clareza sobre seus valores, usando essas habilidades para tomar decisões alinhadas ao que importa para você.",
  Interpessoal: "Sua inteligência interpessoal se destaca: você compreende bem as emoções e motivações das outras pessoas, facilitando o trabalho em equipe e a construção de relacionamentos significativos.",
  Espacial: "Você possui forte inteligência espacial: capacidade de visualizar, manipular e criar representações mentais do espaço, útil para design, arquitetura e navegação.",
  "Lógico-Matemática": "Sua inteligência lógico-matemática é notável: facilidade com raciocínio abstrato, análise de padrões e resolução de problemas complexos.",
  Linguística: "Você demonstra forte inteligência linguística: habilidade com palavras, comunicação eficaz e expressão de ideias de forma clara.",
  Musical: "Sua inteligência musical se destaca: sensibilidade a sons, ritmos e melodias, com capacidade de criar ou interpretar música.",
  "Corporal-Cinestésica": "Você possui inteligência corporal-cinestésica desenvolvida: controle preciso dos movimentos corporais e habilidades físicas.",
  Naturalista: "Sua inteligência naturalista é evidente: conexão com a natureza, compreensão de ecossistemas e interesse pelo meio ambiente.",
  Existencial: "Você demonstra inteligência existencial: reflexão profunda sobre questões fundamentais da existência e propósito de vida."
};

const LIKERT_MAX = 5; // escala 1–5

const GardnerResults = ({ gardnerScores, isBlurred = true }: GardnerResultsProps) => {
  // ✅ Conta dinamicamente quantas questões existem em cada domínio Gardner
  const DOMAIN_ITEM_COUNTS = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) {
      if (q.gardner) {
        counts[q.gardner] = (counts[q.gardner] || 0) + 1;
      }
    }
    return counts;
  }, []);

  // ✅ Normaliza cada domínio: soma_bruta / (itens_domínio * 5) → 0–100%
  const normalizedEntries = useMemo(() => {
    return Object.entries(gardnerScores)
      .filter(([, value]) => (value ?? 0) > 0)
      .map(([name, raw]) => {
        const nItems = DOMAIN_ITEM_COUNTS[name] ?? 0;
        const denom = nItems * LIKERT_MAX;
        const norm = denom > 0 ? (raw / denom) * 100 : 0;
        return { name, raw, norm };
      });
  }, [gardnerScores, DOMAIN_ITEM_COUNTS]);

  // Ordena pelos valores NORMALIZADOS e pega Top 3
  const sortedGardner = useMemo(
    () => normalizedEntries.sort((a, b) => b.norm - a.norm).slice(0, 3),
    [normalizedEntries]
  );

  // Total (para percentual relativo do gráfico de pizza)
  const totalNorm = sortedGardner.reduce((sum, e) => sum + e.norm, 0);

  // Cores Top 3
  const colors = ["#10B981", "#3B82F6", "#F97316"];

  const gardnerData = sortedGardner.map((entry, index) => ({
    name: entry.name,
    value: Math.round(entry.norm), // valor normalizado 0–100 para o gráfico
    color: colors[index],
    percentage: totalNorm > 0 ? `${Math.round((entry.norm / totalNorm) * 100)}%` : "0%"
  }));

  const topIntelligences = sortedGardner.map((entry, index) => ({
    name: entry.name,
    color: colors[index],
    rank: index + 1
  }));

  const [selectedIntelligence, setSelectedIntelligence] = useState<string>(
    topIntelligences[0]?.name || ""
  );

  const careerRecommendations = {
    intrapessoal: ["Escritor", "Filósofo", "Pesquisador", "Consultor", "Empreendedor"],
    interpessoal: ["Psicólogo", "Professor", "Assistente Social", "Terapeuta", "Recursos Humanos"],
    espacial: ["Arquiteto", "Designer", "Piloto", "Cirurgião", "Engenheiro"],
    "lógico-matemática": ["Cientista", "Engenheiro", "Matemático", "Analista", "Programador"],
    linguística: ["Escritor", "Jornalista", "Tradutor", "Professor de Idiomas", "Advogado"],
    musical: ["Músico", "Compositor", "Professor de Música", "Produtor Musical", "Maestro"],
    "corporal-cinestésica": ["Atleta", "Dançarino", "Cirurgião", "Fisioterapeuta", "Artesão"],
    naturalista: ["Biólogo", "Veterinário", "Agrônomo", "Geólogo", "Ambientalista"],
    existencial: ["Filósofo", "Teólogo", "Psicólogo", "Conselheiro", "Pesquisador"]
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-lg border">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm">{payload[0].payload.percentage}</p>
        </div>
      );
    }
    return null;
  };

  if (gardnerData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Dados insuficientes para análise Gardner
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Seus resultados <span className="text-primary">GARDNER</span>
        </h2>
        <p className="text-lg text-muted-foreground">Inteligências Múltiplas</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Left - Pie Chart */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xs sm:max-w-sm h-64 sm:h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gardnerData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={false}
                >
                  {gardnerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 text-sm">
            {gardnerData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-center sm:justify-start space-x-2"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Top Intelligences */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Suas Inteligências Predominantes
          </h3>

          <div className="space-y-4 mb-8">
            {topIntelligences.map((intelligence) => (
              <button
                key={intelligence.name}
                onClick={() => setSelectedIntelligence(intelligence.name)}
                className={`w-full p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                  selectedIntelligence === intelligence.name
                    ? "shadow-lg"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
                style={{
                  borderColor:
                    selectedIntelligence === intelligence.name
                      ? intelligence.color
                      : undefined,
                  backgroundColor:
                    selectedIntelligence === intelligence.name
                      ? `${intelligence.color}15`
                      : undefined
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: intelligence.color }}
                  >
                    {intelligence.rank}
                  </div>
                  <span className="font-medium text-foreground">
                    {intelligence.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Detailed Section - Dynamic based on selection */}
          <Card className={`${isBlurred ? "relative overflow-hidden" : ""}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor:
                      topIntelligences.find((i) => i.name === selectedIntelligence)
                        ?.color
                  }}
                >
                  {
                    topIntelligences.find((i) => i.name === selectedIntelligence)
                      ?.rank
                  }
                </div>
                <h4 className="text-lg font-bold text-foreground">
                  {selectedIntelligence}
                </h4>
              </div>

              {isBlurred ? (
                <div className="filter blur-sm select-none">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-4/5"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ) : (
                <p className="text-foreground leading-relaxed">
                  {intelligenceDescriptions[selectedIntelligence]}
                </p>
              )}

              {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
                  <p className="text-muted-foreground text-sm">
                    Descrição detalhada disponível após desbloqueio
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Career Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Carreiras Recomendadas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {topIntelligences.map((intelligence) => {
            const careerKey = intelligence.name
              .toLowerCase()
              .replace(" ", "-") as keyof typeof careerRecommendations;
            const careers = (careerRecommendations as any)[careerKey] || [];

            return (
              <div key={intelligence.name}>
                <div className="flex items-center space-x-2 mb-4">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: intelligence.color }}
                  ></div>
                  <h4 className="font-semibold text-foreground">
                    {intelligence.name}
                  </h4>
                </div>

                {isBlurred ? (
                  <div className="space-y-2 filter blur-sm select-none">
                    {careers.slice(0, 5).map((_: string, idx: number) => (
                      <div key={idx} className="h-6 bg-muted rounded w-full"></div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {careers.map((career: string, idx: number) => (
                      <li key={idx} className="text-foreground">
                        {career}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GardnerResults;