import { Card, CardContent } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

interface GopcResultsProps {
  gopcScores: Record<string, number>;
  isBlurred?: boolean;
}

// GOPC competencies
const gopcCompetencies = [
  { code: "AK", name: "Autoconhecimento", color: "#3B82F6", bgColor: "#EBF8FF" },
  { code: "PC", name: "Planejamento", color: "#10B981", bgColor: "#F0FDF4" },
  { code: "TD", name: "Tomada de Decisão", color: "#F97316", bgColor: "#FFF7ED" }
];

// Nº de itens por eixo (a partir da sua classificação do questionário)
// AK = 37, PC = 8, TD = 15
const GOPC_ITEM_COUNT: Record<string, number> = { AK: 37, PC: 8, TD: 15 };
const LIKERT_MAX = 5;           // escala 1–5
const RADAR_MAX = 100;          // manter em percentuais

const competencyDescriptions: Record<string, string> = {
  AK: "Capacidade de reconhecer emoções, valores e limites, usando isso para evoluir pessoal e profissionalmente.",
  PC: "Planejar objetivos com etapas claras, prazos e priorização, mantendo foco e consistência.",
  TD: "Analisar cenários, pesar prós e contras e tomar decisões com responsabilidade."
};

const GopcResults = ({ gopcScores, isBlurred = true }: GopcResultsProps) => {
  // Normaliza por eixo: score / (itens*5) → 0–100%
  const normalizePercent = (axisCode: "AK" | "PC" | "TD", raw: number) => {
    const denom = (GOPC_ITEM_COUNT[axisCode] ?? 0) * LIKERT_MAX;
    if (!denom || !raw) return 0;
    const ratio = Math.max(0, Math.min(1, raw / denom));
    return Math.round(ratio * RADAR_MAX);
  };

  // Radar chart data (percentual normalizado por eixo)
  const radarData = [
    { competency: "Autoconhecimento", value: normalizePercent("AK", gopcScores.AK || 0), fullMark: RADAR_MAX },
    { competency: "Planejamento", value: normalizePercent("PC", gopcScores.PC || 0), fullMark: RADAR_MAX },
    { competency: "Tomada de Decisão", value: normalizePercent("TD", gopcScores.TD || 0), fullMark: RADAR_MAX }
  ];

  // Ponto forte (maior valor após normalização)
  const sortedCompetencies = [...radarData].sort((a, b) => b.value - a.value);
  const strongestCompetency = sortedCompetencies[0];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Seus resultados <span className="text-primary">GOPC</span>
        </h2>
        <p className="text-lg text-muted-foreground">Competências GOPC</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Left - Competency Cards with Scores */}
        <div className="space-y-4">
          {gopcCompetencies.map((competency) => {
            const scoreData = radarData.find(d => d.competency === competency.name);
            const score = scoreData?.value || 0;
            const isStrongest = strongestCompetency?.competency === competency.name;

            return (
              <Card
                key={competency.code}
                className={`border-2 ${isStrongest ? "shadow-lg ring-2 ring-primary/20" : ""}`}
                style={{
                  borderColor: competency.color,
                  backgroundColor: competency.bgColor
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: competency.color }}
                      >
                        {competency.code}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-foreground">
                          {competency.name}
                        </h3>
                        {isStrongest && !isBlurred && (
                          <span className="text-xs font-medium text-primary">
                            ⭐ Seu Ponto Forte
                          </span>
                        )}
                      </div>
                    </div>
                    {!isBlurred && (
                      <div className="text-right">
                        <div className="text-3xl font-bold" style={{ color: competency.color }}>
                          {score}%
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right - Professional Radar Chart */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full h-64 sm:h-80 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <PolarAngleAxis
                  dataKey="competency"
                  tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, RADAR_MAX]}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                />
                <Radar
                  name="GOPC"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Pontuação"]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px"
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* What is GOPC? */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          O que significa GOPC?
        </h3>

        <p className="text-muted-foreground mb-6">
          GOPC é um modelo que avalia três competências essenciais para o desenvolvimento de carreira:
        </p>

        <div className="space-y-6">
          {gopcCompetencies.map((competency) => {
            const scoreData = radarData.find(d => d.competency === competency.name);
            const score = scoreData?.value || 0;

            return (
              <div key={competency.code} className="flex items-start space-x-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: competency.color }}
                >
                  {competency.code}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">
                      {competency.name}
                    </h4>
                    {isBlurred ? (
                      <div className="filter blur-sm select-none">
                        <div className="text-xl font-bold" style={{ color: competency.color }}>
                          {score}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-xl font-bold" style={{ color: competency.color }}>
                        {score}%
                      </div>
                    )}
                  </div>
                  {isBlurred ? (
                    <div className="filter blur-sm select-none">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-4/5"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {competencyDescriptions[competency.code]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strong Point Section - Highlighted */}
      <Card className={`border-2 border-primary bg-primary/5 ${isBlurred ? "relative overflow-hidden" : ""}`}>
        <CardContent className="p-8">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              ⭐
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Seu Ponto Forte
              </h3>
              {!isBlurred && strongestCompetency && (
                <h4 className="text-xl font-semibold text-primary mb-3">
                  {strongestCompetency.competency} ({strongestCompetency.value}%)
                </h4>
              )}
            </div>
          </div>

          {isBlurred ? (
            <>
              <div className="filter blur-sm select-none">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/5"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px] pointer-events-none">
                <p className="text-muted-foreground text-sm">
                  Análise detalhada disponível após desbloqueio
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg p-6">
              <p className="text-foreground text-lg leading-relaxed">
                Seu ponto forte é o{" "}
                <span className="font-bold text-primary">
                  {strongestCompetency?.competency.toLowerCase()}
                </span>
                :{" "}
                {
                  competencyDescriptions[
                    gopcCompetencies.find((c) => c.name === strongestCompetency?.competency)?.code || "AK"
                  ]
                }{" "}
                Esta competência é fundamental para o planejamento de carreira, pois permite que você tome decisões
                alinhadas aos seus valores e objetivos pessoais.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GopcResults;