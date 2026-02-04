import { 
  Brain, 
  Lightbulb, 
  Heart, 
  FileText, 
  Briefcase, 
  TrendingUp 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Análise de Personalidade",
    description: "Avaliamos seus traços de personalidade para identificar ambientes de trabalho ideais para você."
  },
  {
    icon: Lightbulb,
    title: "Mapeamento de Habilidades",
    description: "Identificamos suas habilidades naturais e adquiridas para sugerir carreiras compatíveis."
  },
  {
    icon: Heart,
    title: "Descoberta de Interesses",
    description: "Analisamos seus interesses para encontrar carreiras que manterão você motivado a longo prazo."
  },
  {
    icon: FileText,
    title: "Relatório Detalhado",
    description: "Receba um relatório completo com análises detalhadas e recomendações personalizadas."
  },
  {
    icon: Briefcase,
    title: "Sugestões de Carreira",
    description: "Descubra as carreiras mais compatíveis com seu perfil e potencial de crescimento."
  },
  {
    icon: TrendingUp,
    title: "Plano de Desenvolvimento",
    description: "Orientações sobre como desenvolver as habilidades necessárias para sua carreira ideal."
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
            Recursos
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa para encontrar seu caminho
          </h3>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Nossa plataforma utiliza métodos avançados de psicometria vocacional 
            para gerar recomendações precisas e alinhadas ao seu perfil.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in border-border/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-start">
                  <div className="bg-primary/10 rounded-lg p-3 mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;