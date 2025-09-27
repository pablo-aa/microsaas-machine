import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, ArrowRight, BarChart3, FileText, Target, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const Comeco = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartAssessment = () => {
    setIsLoading(true);
    
    // Loading effect for 2 seconds
    setTimeout(() => {
      const assessmentId = uuidv4();
      navigate(`/avaliacao/${assessmentId}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-foreground">Carrerium</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Card */}
        <div className="text-center mb-16">
          <Card className="gradient-primary p-0 border-0 shadow-2xl max-w-4xl mx-auto animate-scale-in">
            <CardContent className="p-12 text-center text-white">
              {/* Icon */}
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-full"></div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-8">
                Descubra sua carreira ideal agora!
              </h1>

              {/* Benefits */}
              <div className="space-y-6 mb-10 max-w-2xl mx-auto">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-full p-2">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xl text-white/90">O teste leva apenas 5 minutos para ser concluído.</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-full p-2">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xl text-white/90">Responda com sinceridade para resultados mais precisos.</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-full p-2">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xl text-white/90">Você receberá recomendações personalizadas de carreira.</p>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleStartAssessment}
                disabled={isLoading}
                size="lg"
                className="bg-white hover:bg-white/90 text-primary text-xl font-bold px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Preparando seu teste...
                  </>
                ) : (
                  "Descobrir Minha Carreira! →"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">95% de Precisão</h3>
              <p className="text-muted-foreground">Algoritmo baseado em pesquisas científicas</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Relatório Detalhado</h3>
              <p className="text-muted-foreground">Análise completa do seu perfil profissional</p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Recomendações Personalizadas</h3>
              <p className="text-muted-foreground">Carreiras alinhadas com suas habilidades e interesses</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Comeco;