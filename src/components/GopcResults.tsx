import { Card, CardContent } from "@/components/ui/card";

interface GopcResultsProps {
  isBlurred?: boolean;
}

// GOPC competencies
const gopcCompetencies = [
  { code: "AK", name: "Autoconhecimento", color: "#3B82F6", bgColor: "#EBF8FF" },
  { code: "PC", name: "Planejamento", color: "#10B981", bgColor: "#F0FDF4" },
  { code: "TD", name: "Tomada de Decisão", color: "#F97316", bgColor: "#FFF7ED" }
];

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

        {/* Right - Triangle Radar Chart */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-80 h-80">
            {/* Triangle SVG Radar Chart */}
            <svg viewBox="0 0 240 220" className="w-full h-full">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F3F4F6" strokeWidth="0.5"/>
                </pattern>
              </defs>
              
              {/* Background triangle levels */}
              <polygon
                points="120,30 70,170 170,170"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <polygon
                points="120,50 80,150 160,150"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <polygon
                points="120,70 90,130 150,130"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              
              {/* Main triangle outline */}
              <polygon
                points="120,30 70,170 170,170"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="2"
              />
              
              {/* Data triangle - sample scores */}
              <polygon
                points="120,60 85,140 155,140"
                fill="#3B82F6"
                fillOpacity="0.2"
                stroke="#3B82F6"
                strokeWidth="2"
              />
              
              {/* Data points */}
              <circle cx="120" cy="60" r="4" fill="#3B82F6" />
              <circle cx="85" cy="140" r="4" fill="#F97316" />
              <circle cx="155" cy="140" r="4" fill="#10B981" />
              
              {/* Axis lines */}
              <line x1="120" y1="30" x2="120" y2="170" stroke="#E5E7EB" strokeWidth="1"/>
              <line x1="120" y1="170" x2="70" y2="170" stroke="#E5E7EB" strokeWidth="1"/>
              <line x1="120" y1="170" x2="170" y2="170" stroke="#E5E7EB" strokeWidth="1"/>
              
              {/* Labels */}
              <text x="120" y="20" textAnchor="middle" className="text-xs fill-blue-600 font-medium">
                Autoconhecimento
              </text>
              <text x="120" y="15" textAnchor="middle" className="text-xs fill-blue-600">
                (AK) - 85%
              </text>
              
              <text x="50" y="180" textAnchor="middle" className="text-xs fill-orange-600 font-medium">
                Tomada de
              </text>
              <text x="50" y="190" textAnchor="middle" className="text-xs fill-orange-600 font-medium">
                Decisão
              </text>
              <text x="50" y="200" textAnchor="middle" className="text-xs fill-orange-600">
                (TD) - 65%
              </text>
              
              <text x="190" y="180" textAnchor="middle" className="text-xs fill-green-600 font-medium">
                Planejamento
              </text>
              <text x="190" y="190" textAnchor="middle" className="text-xs fill-green-600">
                (PC) - 75%
              </text>
            </svg>
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
              
              <div className={`flex-1 ${isBlurred ? 'filter blur-sm' : ''}`}>
                <h4 className="font-semibold text-foreground mb-2">
                  {competency.name}: 
                </h4>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-4/5"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strong Point Section */}
      <Card className={`${isBlurred ? 'relative overflow-hidden' : ''}`}>
        <CardContent className="p-6">
          <div className={isBlurred ? 'filter blur-sm select-none' : ''}>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Seu Ponto Forte: Autoconhecimento
            </h3>
            
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/5"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
          
          {isBlurred && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
              <p className="text-muted-foreground text-sm">
                Análise detalhada disponível após desbloqueio
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GopcResults;