"use client";

import { useState } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { Clock, CheckCircle, ArrowRight, BarChart3, FileText, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { usePageView } from "@/hooks/useGTM";
import { trackTestStarted } from "@/lib/analytics";
import logoQualCarreira from "@/assets/logo-qualcarreira.png";

export default function ComecoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  usePageView();

  const handleStartAssessment = () => {
    setIsLoading(true);
    const assessmentId = uuidv4();

    // Track test started
    trackTestStarted(assessmentId);

    // Loading effect for 2 seconds
    setTimeout(() => {
      router.push(`/avaliacao/${assessmentId}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-1">
              <img
                src={
                  typeof logoQualCarreira === "string"
                    ? logoQualCarreira
                    : logoQualCarreira.src
                }
                alt="QualCarreira - Teste Vocacional"
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-foreground">Qual Carreira</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Card */}
        <div className="text-center mb-12">
          <Card className="gradient-primary p-0 border-0 shadow-xl max-w-3xl mx-auto animate-scale-in">
            <CardContent className="p-8 text-center text-white">
              {/* Icon */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 bg-primary rounded-full"></div>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-6">
                Descubra sua carreira ideal agora!
              </h1>

              {/* Benefits */}
              <div className="space-y-4 mb-8 max-w-xl mx-auto">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-1.5">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-base text-white/90">
                    O teste leva apenas 5 minutos para ser concluído.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-1.5">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-base text-white/90">
                    Responda com sinceridade para resultados mais precisos.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-1.5">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-base text-white/90">
                    Você receberá recomendações personalizadas de carreira.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleStartAssessment}
                disabled={isLoading}
                size="lg"
                className="bg-white hover:bg-white/90 text-primary text-base font-bold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 w-full sm:w-auto max-w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="truncate">Preparando seu teste...</span>
                  </>
                ) : (
                  <span className="truncate">Descobrir Minha Carreira! →</span>
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
              <p className="text-muted-foreground">
                Análise completa do seu perfil profissional
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Recomendações Personalizadas
              </h3>
              <p className="text-muted-foreground">
                Carreiras alinhadas com suas habilidades e interesses
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

