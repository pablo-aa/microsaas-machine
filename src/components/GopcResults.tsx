import { Card, CardContent } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

interface GopcResultsProps {
  isBlurred?: boolean;
}

// Radar chart data
const radarData = [
  { competency: "Autoconhecimento", value: 85, fullMark: 100 },
  { competency: "Planejamento", value: 75, fullMark: 100 },
  { competency: "Tomada de Decisão", value: 65, fullMark: 100 }
];

// GOPC competencies
const gopcCompetencies = [
  { code: "AK", name: "Autoconhecimento", color: "#3B82F6", bgColor: "#EBF8FF" },
  { code: "PC", name: "Planejamento", color: "#10B981", bgColor: "#F0FDF4" },
  { code: "TD", name: "Tomada de Decisão", color: "#F97316", bgColor: "#FFF7ED" }
];

const competencyDescriptions: Record<string, string> = {
  AK: 'Capacidade de reconhecer emoções, valores e limites, usando isso para evoluir pessoal e profissionalmente.',
  PC: 'Planejar objetivos com etapas claras, prazos e priorização, mantendo foco e consistência.',
  TD: 'Analisar cenários, pesar prós e contras e tomar decisões com responsabilidade.'
};

const GopcResults = ({ isBlurred = true }: GopcResultsProps) => {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Left - Competency Cards */}
        <div className="space-y-4">
          {gopcCompetencies.map((competency) => (
            <Card 
              key={competency.code}
              className="border-2"
              style={{ 
                borderColor: competency.color,
                backgroundColor: competency.bgColor 
              }}
            >
              <CardContent className="p-6 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
                  style={{ backgroundColor: competency.color }}
                >
                  {competency.code}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {competency.name}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right - Professional Radar Chart */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <PolarAngleAxis 
                  dataKey="competency" 
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
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
                  formatter={(value: number) => [`${value}%`, 'Pontuação']}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
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
          {gopcCompetencies.map((competency) => (
            <div key={competency.code} className="flex items-start space-x-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: competency.color }}
              >
                {competency.code}
              </div>
              
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">
                    {competency.name}
                  </h4>
                  {isBlurred ? (
                    <div className="filter blur-sm select-none">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-4/5"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{competencyDescriptions[competency.code]}</p>
                  )}
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strong Point Section */}
      <Card className={`${isBlurred ? 'relative overflow-hidden' : ''}`}>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Seu Ponto Forte
          </h3>
          
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
            <div>
              <h4 className="font-semibold text-foreground mb-3">Autoconhecimento</h4>
              <p className="text-muted-foreground">
                Seu ponto forte é o autoconhecimento: você reconhece suas habilidades, limites e motivações,
                o que facilita escolhas de carreira mais assertivas e consistentes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GopcResults;