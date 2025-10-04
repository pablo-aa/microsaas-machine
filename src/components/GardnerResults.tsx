import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface GardnerResultsProps {
  isBlurred?: boolean;
}

// Gardner data - only top 3
const gardnerData = [
  { name: "Intrapessoal", value: 35, color: "#10B981", percentage: "39%" },
  { name: "Interpessoal", value: 30, color: "#3B82F6", percentage: "33%" },
  { name: "Espacial", value: 25, color: "#F97316", percentage: "28%" }
];

// Top 3 intelligences
const topIntelligences = [
  { name: "Intrapessoal", color: "#10B981", rank: 1 },
  { name: "Interpessoal", color: "#3B82F6", rank: 2 },
  { name: "Espacial", color: "#F97316", rank: 3 }
];

const careerRecommendations = {
  intrapessoal: ["Escritor", "Filósofo", "Pesquisador", "Consultor", "Empreendedor"],
  interpessoal: ["Psicólogo", "Professor", "Assistente Social", "Terapeuta", "Recursos Humanos"],
  espacial: ["Arquiteto", "Designer", "Piloto", "Cirurgião", "Engenheiro"]
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

const GardnerResults = ({ isBlurred = true }: GardnerResultsProps) => {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Left - Pie Chart */}
        <div className="flex flex-col items-center">
          <div className="w-80 h-80 mb-6">
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
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{backgroundColor: item.color}}
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
            {topIntelligences.map((intelligence, index) => (
              <div 
                key={intelligence.name}
                className={`p-4 rounded-lg border-2 ${
                  intelligence.name === 'Intrapessoal' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
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
              </div>
            ))}
          </div>

          {/* Detailed Section - Intrapessoal */}
          <Card className={`${isBlurred ? 'relative overflow-hidden' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h4 className="text-lg font-bold text-foreground">Intrapessoal</h4>
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
                <p className="text-foreground">
                  Você demonstra forte inteligência intrapessoal: autoconhecimento, reflexão e clareza sobre seus valores,
                  usando essas habilidades para tomar decisões alinhadas ao que importa para você.
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Intrapessoal */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="font-semibold text-foreground">Intrapessoal</h4>
            </div>
            
            {isBlurred ? (
              <div className="space-y-2 filter blur-sm select-none">
                {careerRecommendations.intrapessoal.map((career, idx) => (
                  <div key={idx} className="h-6 bg-muted rounded w-full"></div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {careerRecommendations.intrapessoal.map((career, idx) => (
                  <li key={idx} className="text-foreground">{career}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Interpessoal */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h4 className="font-semibold text-foreground">Interpessoal</h4>
            </div>
            
            {isBlurred ? (
              <div className="space-y-2 filter blur-sm select-none">
                {careerRecommendations.interpessoal.map((career, idx) => (
                  <div key={idx} className="h-6 bg-muted rounded w-full"></div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {careerRecommendations.interpessoal.map((career, idx) => (
                  <li key={idx} className="text-foreground">{career}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Espacial */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <h4 className="font-semibold text-foreground">Espacial</h4>
            </div>
            
            {isBlurred ? (
              <div className="space-y-2 filter blur-sm select-none">
                {careerRecommendations.espacial.map((career, idx) => (
                  <div key={idx} className="h-6 bg-muted rounded w-full"></div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {careerRecommendations.espacial.map((career, idx) => (
                  <li key={idx} className="text-foreground">{career}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardnerResults;