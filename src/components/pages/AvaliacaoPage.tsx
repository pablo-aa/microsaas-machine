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
} from "@/lib/analytics";

type AssessmentStage = "questions" | "processing" | "form";

interface Answer {
  question_id: number;
  score: number;
}

const isBrowser = typeof window !== "undefined";

const AvaliacaoPage = () => {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>();
  const [stage, setStage] = useState<AssessmentStage>("questions");
  const [testId, setTestId] = useState<string>("");

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

    const savedProgress = assessmentStorage.loadProgress(id);
    if (savedProgress) {
      setAnswers(savedProgress.answers);
      setCurrentQuestion(savedProgress.currentQuestion);

      const currentQuestionData = questions[savedProgress.currentQuestion];
      const currentAnswer = savedProgress.answers.find(
        (a) => a.question_id === currentQuestionData?.id,
      );
      setSelectedAnswer(currentAnswer?.score);

      trackTestResumed(id, savedProgress.currentQuestion + 1, savedProgress.answers.length);

      toast({
        title: "Progresso recuperado",
        description: `Continuando da questão ${savedProgress.currentQuestion + 1}/${TOTAL_QUESTIONS}`,
      });
    }
  }, [params.id, router, toast]);

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

      assessmentStorage.saveProgress(testId, newAnswers, nextQuestionIndex);

      const nextQuestionData = questions[nextQuestionIndex];
      const nextAnswer = newAnswers.find(
        (a) => a.question_id === nextQuestionData.id,
      );
      setSelectedAnswer(nextAnswer?.score);
    } else {
      trackTestCompleted(testId, TOTAL_QUESTIONS);
      assessmentStorage.clearProgress(testId);
      setStage("processing");
      setTimeout(() => {
        setStage("form");
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
    assessmentStorage.clearProgress(testId);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(undefined);
    setStage("questions");
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

    assessmentStorage.saveProgress(testId, randomAnswers, lastQuestionIndex);

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

    assessmentStorage.saveProgress(testId, profileAnswersArray, lastQuestionIndex);

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

  if (stage === "form") {
    return <FormularioDadosPage answers={answers} testId={testId} />;
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

            {isBrowser && !window.location.hostname.includes("qualcarreira.com") && (
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
