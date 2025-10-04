import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import GardnerResults from "./GardnerResults";
import GopcResults from "./GopcResults";

interface RiasecResultsProps {
  isBlurred?: boolean;
  onDesbloquear: () => void;
  activeTab?: 'riasec' | 'gardner' | 'gopc';
  onTabChange?: (tab: 'riasec' | 'gardner' | 'gopc') => void;
}

// RIASEC data - mock data based on your image
const riasecData = [
  { name: "Realista", value: 18, color: "#10B981", code: "R" },
  { name: "Investigativo", value: 15, color: "#3B82F6", code: "I" },
  { name: "Artístico", value: 22, color: "#EC4899", code: "A" },
  { name: "Social", value: 16, color: "#F97316", code: "S" },
  { name: "Empreendedor", value: 14, color: "#8B5CF6", code: "E" },
  { name: "Convencional", value: 15, color: "#EAB308", code: "C" }
];

const RiasecResults = ({ 
  isBlurred = true, 
  onDesbloquear, 
  activeTab = 'riasec', 
  onTabChange 
}: RiasecResultsProps) => {
  const renderRiasecContent = () => (
    <div className="space-y-8">
      {/* Results Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Seus resultados <span className="text-primary">RIASEC</span>
        </h2>
        <p className="text-lg text-muted-foreground">Distribuição de Aptidões</p>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Pie Chart */}
        <div className="flex flex-col items-center">
          <div className="w-80 h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riasecData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                >
                  {riasecData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {riasecData.map((item) => (
              <div key={item.code} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{backgroundColor: item.color}}
                />
                <span className="text-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score List */}
        <div className="space-y-3">
          {riasecData.map((item) => (
            <div key={item.code} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{backgroundColor: item.color}}
                />
                <span className="font-medium text-foreground">
                  {item.name} ({item.code})
                </span>
              </div>
              <div className={`text-muted-foreground ${isBlurred ? 'filter blur-sm' : ''}`}>
                {item.value} pontos
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-foreground mb-6">Detalhamento das Aptidões</h3>
        
        {/* Category Headers - Clickable */}
        <div className="flex space-x-2 mb-6">
          {riasecData.map((item) => (
            <button 
              key={item.code}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                item.code === 'R' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Card - Blurred only on sensitive content */}
      <Card className={`relative ${isBlurred ? 'overflow-hidden' : ''}`}>
        <CardContent className="p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-foreground mb-2">Realista</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-foreground mb-2">Descrição</h5>
                  <div className={isBlurred ? 'filter blur-sm select-none' : ''}>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold text-foreground mb-2">Características Principais</h5>
                  <div className={isBlurred ? 'filter blur-sm select-none' : ''}>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold text-foreground mb-2">Carreiras Recomendadas</h5>
                  <div className={`flex flex-wrap gap-2 ${isBlurred ? 'filter blur-sm select-none' : ''}`}>
                    <div className="h-8 bg-muted rounded px-4 w-24"></div>
                    <div className="h-8 bg-muted rounded px-4 w-32"></div>
                    <div className="h-8 bg-muted rounded px-4 w-28"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {isBlurred && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-4">
                  Clique em cada símbolo para mais detalhes
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <section className="bg-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Tabs */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-1">
            <Button 
              variant={activeTab === 'riasec' ? 'default' : 'outline'}
              onClick={() => onTabChange?.('riasec')}
              className={activeTab === 'riasec' ? 'bg-primary text-white px-6' : 'text-muted-foreground'}
            >
              RIASEC
            </Button>
            <Button 
              variant={activeTab === 'gardner' ? 'default' : 'outline'}
              onClick={() => onTabChange?.('gardner')}
              className={activeTab === 'gardner' ? 'bg-primary text-white px-6' : 'text-muted-foreground'}
            >
              Gardner
            </Button>
            <Button 
              variant={activeTab === 'gopc' ? 'default' : 'outline'}
              onClick={() => onTabChange?.('gopc')}
              className={activeTab === 'gopc' ? 'bg-primary text-white px-6' : 'text-muted-foreground'}
            >
              GOPC
            </Button>
          </div>
          
          <Button 
            onClick={onDesbloquear}
            className="gradient-primary hover:opacity-90"
          >
            Desbloquear Resultados
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'riasec' && renderRiasecContent()}
        {activeTab === 'gardner' && <GardnerResults isBlurred={isBlurred} />}
        {activeTab === 'gopc' && <GopcResults isBlurred={isBlurred} />}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground mt-8 leading-relaxed">
          Este teste tem fins educacionais gerando informações e direcionamentos.
          Os resultados podem conter imprecisões e não substituem orientação profissional ou assessoramento especializado.
        </p>
      </div>
    </section>
  );
};

export default RiasecResults;