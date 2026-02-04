"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import LikertScale from "@/components/LikertScale";
import FormularioDadosPage from "@/components/pages/FormularioDadosPage";
import ContextualQuestionnairePage from "@/components/pages/ContextualQuestionnairePage";
import type { ContextualAnswers } from "@/data/contextualQuestions";
import { v4 as uuidv4 } from "uuid";
import { questions, TOTAL_QUESTIONS } from "@/data/questions";
import { assessmentStorage } from "@/lib/assessmentStorage";
import { useToast } from "@/hooks/use-toast";
import logoQualCarreira from "@/assets/logo-qualcarreira.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { profiles, generateProfileAnswers, type ProfileType } from "@/lib/testProfiles";
import { usePageView, useTestAbandonment } from "@/hooks/useGTM";
import {
  trackQuestionAnswered,
  trackTestNavigationBack,
  trackTestResumed,
  trackTestCompleted,
  trackExperimentViewed,
} from "@/lib/analytics";

type AssessmentStage = "questions" | "processing" | "contextual_questionnaire" | "form";

interface Answer {
  question_id: number;
  score: number;
}

interface AvaliacaoPageProps {
  contextualQuestionnaireVariant?: string;
}

const AvaliacaoPage = ({ contextualQuestionnaireVariant = "disabled" }: AvaliacaoPageProps) => {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>();
  const [stage, setStage] = useState<AssessmentStage>("questions");
  const [testId, setTestId] = useState<string>("");
  const [showTestProfiles, setShowTestProfiles] = useState(false);
  const [contextualAnswers, setContextualAnswers] = useState<ContextualAnswers | null>(null);
  const [experimentVariant, setExperimentVariant] = useState<string | null>(null);

  usePageView();
  useTestAbandonment(
    stage === "questions",
    testId,
    currentQuestion,
    answers.length,
    TOTAL_QUESTIONS,
  );

  useEffect(() => {
    const id = params.id;

    if (!id) {
      const newTestId = uuidv4();
      router.replace(`/avaliacao/${newTestId}`);
      return;
    }

    setTestId(id);

    // Carregar estado completo (com migração automática)
    const flowState = assessmentStorage.loadFlowState(id);
    
    if (flowState) {
      // Restaurar TUDO de forma síncrona
      setAnswers(flowState.answers);
      setCurrentQuestion(flowState.currentQuestion);
      
      // Restaurar selectedAnswer
      const currentQuestionData = questions[flowState.currentQuestion];
      const currentAnswer = flowState.answers.find(
        (a) => a.question_id === currentQuestionData?.id,
      );
      setSelectedAnswer(currentAnswer?.score);
      
      // Restaurar contextualAnswers
      if (flowState.contextualAnswers) {
        setContextualAnswers(flowState.contextualAnswers);
      }
      
      // Restaurar variante salva (prioridade sobre prop)
      if (flowState.experimentVariant) {
        setExperimentVariant(flowState.experimentVariant);
      } else {
        // Se não tem variante salva, usar da prop mas NÃO salvar ainda
        // A variante será salva quando completar 60 questões (junto com o tracking)
        // Isso garante que o evento experiment_viewed seja disparado corretamente
        setExperimentVariant(contextualQuestionnaireVariant);
      }
      
      // Determinar e restaurar stage (determinístico)
      const restoredStage = assessmentStorage.determineStage(flowState);
      setStage(restoredStage);
      
      // Toast apenas se realmente recuperou progresso significativo
      if (flowState.answers.length > 0 || flowState.contextualAnswers || flowState.formData) {
        trackTestResumed(id, flowState.currentQuestion + 1, flowState.answers.length);
        toast({
          title: "Progresso recuperado",
          description: restoredStage === 'form' 
            ? "Continuando do formulário de dados"
            : restoredStage === 'contextual_questionnaire'
            ? "Continuando do questionário contextual"
            : `Continuando da questão ${flowState.currentQuestion + 1}/${TOTAL_QUESTIONS}`,
        });
      }
    } else {
      // Novo usuário: apenas setar no state (não salvar ainda - será salvo quando completar 60 questões)
      // Isso evita salvar variante para usuários que podem abandonar antes de completar
      setExperimentVariant(contextualQuestionnaireVariant);
    }
  }, [params.id, router, toast, contextualQuestionnaireVariant]);

  // Verificar se deve mostrar perfis de teste apenas no cliente (evita erro de hidratação)
  useEffect(() => {
    const isBrowser = typeof window !== "undefined";
    const isNotProduction = isBrowser && !window.location.hostname.includes("qualcarreira.com");
    setShowTestProfiles(isNotProduction);
  }, []);

  // Salvar stage quando mudar (atômico)
  useEffect(() => {
    if (!testId) return;
    
    // Não salvar stage "processing" (temporário)
    if (stage === "processing") return;
    
    assessmentStorage.updateFlowState(testId, {
      currentStage: stage,
    });
  }, [stage, testId]);

  // Salvar answers quando mudarem (atômico)
  useEffect(() => {
    if (!testId || answers.length === 0) return;
    
    assessmentStorage.updateFlowState(testId, {
      answers,
      currentQuestion,
    });
  }, [answers, currentQuestion, testId]);

  const totalQuestions = TOTAL_QUESTIONS;
  const progress =
    ((currentQuestion + (selectedAnswer ? 1 : 0)) / totalQuestions) * 100;
  const answeredQuestions = answers.length;

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer === undefined) return;

    const newAnswers = [...answers];
    const currentQuestionData = questions[currentQuestion];

    const existingIndex = newAnswers.findIndex(
      (a) => a.question_id === currentQuestionData.id,
    );
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = {
        question_id: currentQuestionData.id,
        score: selectedAnswer,
      };
    } else {
      newAnswers.push({ question_id: currentQuestionData.id, score: selectedAnswer });
    }
    setAnswers(newAnswers);

    trackQuestionAnswered(testId, currentQuestion + 1, TOTAL_QUESTIONS, newAnswers.length);

    if (currentQuestion < totalQuestions - 1) {
      const nextQuestionIndex = currentQuestion + 1;
      setCurrentQuestion(nextQuestionIndex);

      // Não precisa salvar aqui - o useEffect (linha 134-141) já salva via updateFlowState
      // Removido saveProgress() para evitar duplicação e race conditions

      const nextQuestionData = questions[nextQuestionIndex];
      const nextAnswer = newAnswers.find(
        (a) => a.question_id === nextQuestionData.id,
      );
      setSelectedAnswer(nextAnswer?.score);
    } else {
      trackTestCompleted(testId, TOTAL_QUESTIONS);
      
      // Usar variante salva (ou da prop se ainda não foi salva)
      const variant = experimentVariant || contextualQuestionnaireVariant;
      const showContextualQuestionnaire = variant === "enabled";
      
      // Rastrear exposição ao experimento (apenas uma vez, quando completa 60 questões)
      // Verificar se variante já está salva no estado persistente para evitar duplicação
      const flowState = assessmentStorage.loadFlowState(testId);
      const shouldTrackExposure = !flowState?.experimentVariant;
      
      if (shouldTrackExposure) {
        const variationId = showContextualQuestionnaire ? 1 : 0;
        console.log('[Experiment] Tracking exposure:', { experimentId: 'qc-contextual-questionnaire-test', variationId, variant });
        trackExperimentViewed('qc-contextual-questionnaire-test', variationId);
      } else {
        console.log('[Experiment] Exposure already tracked, skipping. Variant:', flowState?.experimentVariant);
      }
      
      // Salvar variante no estado (garantir consistência após refresh)
      // IMPORTANTE: Sempre salvar aqui, mesmo que já esteja salva (garante atomicidade)
      setExperimentVariant(variant);
      assessmentStorage.updateFlowState(testId, {
        experimentVariant: variant,
      });
      
      setStage("processing");
      setTimeout(() => {
        if (showContextualQuestionnaire) {
          setStage("contextual_questionnaire");
          assessmentStorage.updateFlowState(testId, {
            currentStage: 'contextual_questionnaire',
          });
        } else {
          // Fluxo original: pular questionário contextual
          setStage("form");
          assessmentStorage.updateFlowState(testId, {
            currentStage: 'form',
          });
        }
      }, 2000);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      trackTestNavigationBack(testId, currentQuestion);

      setCurrentQuestion(currentQuestion - 1);
      const prevQuestionData = questions[currentQuestion - 1];
      const prevAnswer = answers.find(
        (a) => a.question_id === prevQuestionData.id,
      );
      setSelectedAnswer(prevAnswer?.score);
    }
  };

  const handleRestart = () => {
    assessmentStorage.clearFlowState(testId); // Limpa tudo
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(undefined);
    setStage("questions");
    setContextualAnswers(null);
    // Resetar variante para a prop (será salva novamente quando necessário)
    setExperimentVariant(contextualQuestionnaireVariant);
  };

  const handleAutoFill = () => {
    const randomAnswers: Answer[] = questions.map((q) => ({
      question_id: q.id,
      score: Math.floor(Math.random() * 5) + 1,
    }));

    const lastQuestionIndex = totalQuestions - 1;
    setAnswers(randomAnswers);
    setCurrentQuestion(lastQuestionIndex);
    setSelectedAnswer(randomAnswers[lastQuestionIndex].score);

    // Determinar stage baseado na variante (consistência com handleNext)
    const variant = experimentVariant || contextualQuestionnaireVariant;
    const showContextualQuestionnaire = variant === "enabled";
    const nextStage = showContextualQuestionnaire ? 'contextual_questionnaire' : 'form';

    // Rastrear exposição ao experimento (apenas uma vez, se ainda não foi rastreado)
    const flowState = assessmentStorage.loadFlowState(testId);
    const shouldTrackExposure = !flowState?.experimentVariant;
    
    if (shouldTrackExposure) {
      const variationId = showContextualQuestionnaire ? 1 : 0;
      console.log('[Experiment] Tracking exposure (autoFill):', { experimentId: 'qc-contextual-questionnaire-test', variationId, variant });
      trackExperimentViewed('qc-contextual-questionnaire-test', variationId);
    }

    // Usar updateFlowState para consistência com o resto do sistema
    assessmentStorage.updateFlowState(testId, {
      answers: randomAnswers,
      currentQuestion: lastQuestionIndex,
      currentStage: nextStage,
      experimentVariant: variant, // Garantir que variante está salva
    });

    toast({
      title: "Respostas preenchidas",
      description: "Todas as 60 questões foram respondidas aleatoriamente para teste",
    });
  };

  const handleProfileTest = (profileType: ProfileType) => {
    const profileAnswers = generateProfileAnswers(profileType);
    const profileAnswersArray: Answer[] = questions.map((q) => ({
      question_id: q.id,
      score: profileAnswers[q.id],
    }));

    const lastQuestionIndex = totalQuestions - 1;
    setAnswers(profileAnswersArray);
    setCurrentQuestion(lastQuestionIndex);
    setSelectedAnswer(profileAnswersArray[lastQuestionIndex].score);

    // Determinar stage baseado na variante (consistência com handleNext)
    const variant = experimentVariant || contextualQuestionnaireVariant;
    const showContextualQuestionnaire = variant === "enabled";
    const nextStage = showContextualQuestionnaire ? 'contextual_questionnaire' : 'form';

    // Rastrear exposição ao experimento (apenas uma vez, se ainda não foi rastreado)
    const flowState = assessmentStorage.loadFlowState(testId);
    const shouldTrackExposure = !flowState?.experimentVariant;
    
    if (shouldTrackExposure) {
      const variationId = showContextualQuestionnaire ? 1 : 0;
      console.log('[Experiment] Tracking exposure (profileTest):', { experimentId: 'qc-contextual-questionnaire-test', variationId, variant });
      trackExperimentViewed('qc-contextual-questionnaire-test', variationId);
    }

    // Usar updateFlowState para consistência com o resto do sistema
    assessmentStorage.updateFlowState(testId, {
      answers: profileAnswersArray,
      currentQuestion: lastQuestionIndex,
      currentStage: nextStage,
      experimentVariant: variant, // Garantir que variante está salva
    });

    const profile = profiles[profileType];
    toast({
      title: `Perfil ${profile.name} aplicado`,
      description: profile.description,
      duration: 4000,
    });
  };

  if (stage === "processing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Calculando seus resultados...
          </h2>
          <p className="text-muted-foreground">
            Analisando suas respostas com nossa IA avançada
          </p>
        </div>
      </div>
    );
  }

  if (stage === "contextual_questionnaire") {
    const variant = experimentVariant || contextualQuestionnaireVariant;
    return (
      <ContextualQuestionnairePage
        testId={testId}
        contextualQuestionnaireVariant={variant}
        onComplete={(answers) => {
          setContextualAnswers(answers);
          setStage("form");
          
          // Salvar atômicamente
          assessmentStorage.updateFlowState(testId, {
            contextualAnswers: answers,
            contextualQuestionnaireCompleted: true,
            currentStage: 'form',
          });
        }}
      />
    );
  }

  if (stage === "form") {
    const variant = experimentVariant || contextualQuestionnaireVariant;
    return (
      <FormularioDadosPage
        answers={answers}
        testId={testId}
        contextualAnswers={contextualAnswers || undefined}
        contextualQuestionnaireVariant={variant}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Questão {currentQuestion + 1}/{totalQuestions}
            </h1>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 text-primary">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span>{answeredQuestions} respondidas</span>
              </div>
              <span>{Math.round(progress)}% Completo</span>
            </div>
          </div>
        </div>

        <Progress value={progress} className="mb-12" />

        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="bg-primary text-white text-center py-3 px-6 rounded-lg mb-8">
              <h2 className="text-lg font-semibold">Avalie a afirmação</h2>
            </div>

            <div className="text-center mb-12">
              <p className="text-xl text-foreground font-medium leading-relaxed">
                {questions[currentQuestion].text}
              </p>
            </div>

            <LikertScale
              onSelect={handleAnswerSelect}
              selectedValue={selectedAnswer}
            />
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} de {totalQuestions}
            </span>

            {showTestProfiles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="ml-4 flex items-center gap-2"
                  >
                    🎯 Perfis de Teste
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <DropdownMenuLabel>Selecione um perfil</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.entries(profiles) as [
                    ProfileType,
                    (typeof profiles)[ProfileType]
                  ][]).map(([key, profile]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => handleProfileTest(key)}
                      className="cursor-pointer flex flex-col items-start py-3"
                    >
                      <span className="font-semibold">{profile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {profile.description}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleAutoFill}
                    className="cursor-pointer"
                  >
                    🎲 Aleatório (não recomendado)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {currentQuestion === totalQuestions - 1 &&
            answers.length === totalQuestions - 1 &&
            selectedAnswer ? (
              <Button
                onClick={handleNext}
                className="gradient-primary hover:opacity-90 px-8"
              >
                Finalizar
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === undefined}
                className="gradient-primary hover:opacity-90 px-8"
              >
                Próxima →
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Button variant="ghost" size="sm" onClick={handleRestart}>
            Reiniciar teste
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AvaliacaoPage;
