import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-illustration.png";
import { trackCTAClick } from "@/lib/analytics";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            {/* Breadcrumb */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              ✨ Descubra sua carreira ideal
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Encontre seu{" "}
              <span className="text-gradient">caminho profissional</span>{" "}
              com precisão
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Nosso teste vocacional analisa suas habilidades, interesses 
              e personalidade para recomendar as melhores carreiras para você.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link to="/comeco" onClick={() => trackCTAClick('hero', 'start_test')}>
                <Button 
                  size="lg" 
                  className="gradient-primary hover:opacity-90 transition-opacity px-8 py-3 text-base font-semibold w-full sm:w-auto"
                >
                  Fazer teste →
                </Button>
              </Link>
              <Link to="/como-funciona" onClick={() => trackCTAClick('hero', 'learn_more')}>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/5 px-8 py-3 text-base font-semibold w-full sm:w-auto"
                >
                  Saiba Mais
                </Button>
              </Link>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground">Resultados em minutos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground">Comprovado cientificamente</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground">Relatório detalhado</span>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-slide-in-right">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Teste vocacional em ação - análise de personalidade e habilidades"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              
              {/* Floating Stats */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 animate-bounce-in">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gradient mb-1">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfação</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;