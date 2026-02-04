"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  contextualQuestions,
  type ContextualAnswers,
  getVisibleQuestions,
  validateRequiredAnswers,
  validateAnswerValue,
} from "@/data/contextualQuestions";
import { assessmentStorage } from "@/lib/assessmentStorage";
import { trackContextualQuestionnaireCompleted } from "@/lib/analytics";
import logoQualCarreira from "@/assets/logo-qualcarreira.png";

interface ContextualQuestionnairePageProps {
  testId: string;
  contextualQuestionnaireVariant?: string; // NOVO
  onComplete: (answers: ContextualAnswers) => void;
}

const ContextualQuestionnairePage = ({
  testId,
  contextualQuestionnaireVariant,
  onComplete,
}: ContextualQuestionnairePageProps) => {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Partial<ContextualAnswers>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Carregar progresso salvo ao montar (do flowState)
  useEffect(() => {
    const flowState = assessmentStorage.loadFlowState(testId);
    if (flowState?.contextualAnswers) {
      setAnswers(flowState.contextualAnswers as Partial<ContextualAnswers>);
    }
  }, [testId]);

  // Salvar progresso automaticamente quando respostas mudam (atômico)
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      assessmentStorage.updateFlowState(testId, {
        contextualAnswers: answers as ContextualAnswers,
      });
    }
  }, [answers, testId]);

  const visibleQuestions = getVisibleQuestions(answers);

  const handleSingleSelect = (questionId: string, value: string) => {
    setTouched(new Set([...touched, questionId]));
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: value };
      
      // Se Q1 mudou, limpar respostas condicionais que não são mais visíveis
      if (questionId === "q1") {
        const newVisible = getVisibleQuestions(newAnswers as Partial<ContextualAnswers>);
        const cleanedAnswers = { ...newAnswers };
        for (const key in cleanedAnswers) {
          if (key.startsWith("q") && !newVisible.includes(key) && key !== "q1") {
            delete cleanedAnswers[key as keyof ContextualAnswers];
          }
        }
        return cleanedAnswers;
      }
      
      return newAnswers;
    });
    
    // Limpar erro ao responder
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleMultipleSelect = (questionId: string, value: string, checked: boolean) => {
    setTouched(new Set([...touched, questionId]));
    setAnswers((prev) => {
      const current = (prev[questionId as keyof ContextualAnswers] as string[]) || [];
      const question = contextualQuestions.find((q) => q.id === questionId);
      const maxSelections = question?.maxSelections || Infinity;

      let newSelection: string[];
      if (checked) {
        if (current.length >= maxSelections) {
          toast({
            title: "Limite atingido",
            description: `Você pode selecionar no máximo ${maxSelections} opção(ões).`,
            variant: "default",
          });
          return prev;
        }
        newSelection = [...current, value];
      } else {
        newSelection = current.filter((v) => v !== value);
      }

      const newAnswers = { ...prev, [questionId]: newSelection };
      
      // Limpar erro ao responder
      if (errors[questionId]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[questionId];
          return newErrors;
        });
      }

      return newAnswers;
    });
  };

  const validateForm = (): boolean => {
    const validation = validateRequiredAnswers(answers);
    
    if (!validation.valid) {
      const newErrors: Record<string, string> = {};
      validation.missing.forEach((questionId) => {
        const question = contextualQuestions.find((q) => q.id === questionId);
        newErrors[questionId] = question
          ? `Por favor, responda: ${question.text}`
          : "Esta pergunta é obrigatória";
      });
      setErrors(newErrors);
      
      // Scroll para primeiro erro
      const firstErrorId = validation.missing[0];
      if (firstErrorId) {
        const element = document.getElementById(`question-${firstErrorId}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      
      return false;
    }

    // Validar valores permitidos
    for (const questionId in answers) {
      const answer = answers[questionId as keyof ContextualAnswers];
      if (answer && !validateAnswerValue(questionId, answer as string | string[])) {
        setErrors((prev) => ({
          ...prev,
          [questionId]: "Valor inválido selecionado",
        }));
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, responda todas as perguntas obrigatórias.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validar estrutura final
      const finalAnswers = answers as ContextualAnswers;
      
      // Disparar evento de analytics
      trackContextualQuestionnaireCompleted(
        testId, 
        finalAnswers as unknown as Record<string, string | string[]>, 
        contextualQuestionnaireVariant || "enabled"
      );
      
      // Não salvar aqui - o callback do AvaliacaoPage já salva via updateFlowState
      // Isso evita salvamento duplo e garante consistência
      
      // Chamar callback com fallback: se falhar, permitir continuar
      try {
        onComplete(finalAnswers);
      } catch (error) {
        console.error("Error in onComplete callback:", error);
        // Fallback: permitir continuar mesmo se callback falhar
        toast({
          title: "Atenção",
          description: "Houve um problema ao salvar, mas você pode continuar.",
          variant: "default",
        });
        // Continuar mesmo assim
        onComplete(finalAnswers);
      }
    } catch (error) {
      console.error("Error submitting contextual questionnaire:", error);
      toast({
        title: "Erro ao processar",
        description: "Houve um problema. Você pode tentar novamente ou continuar.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = visibleQuestions.length > 0
    ? (Object.keys(answers).filter((key) => {
        const answer = answers[key as keyof ContextualAnswers];
        if (Array.isArray(answer)) {
          return answer.length > 0;
        }
        return answer !== undefined && (typeof answer !== 'string' || answer.trim() !== "");
      }).length /
        visibleQuestions.length) *
      100
    : 0;

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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Quase lá!
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Conte-nos mais sobre você
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Essas informações nos ajudam a personalizar melhor seus resultados.
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% completo
            </span>
            <span className="text-sm text-muted-foreground">
              {Object.keys(answers).filter((key) => {
                const answer = answers[key as keyof ContextualAnswers];
                if (Array.isArray(answer)) return answer.length > 0;
                return answer !== undefined && (typeof answer !== 'string' || answer.trim() !== "");
              }).length}{" "}
              de {visibleQuestions.length} perguntas
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-6">
          {contextualQuestions.map((question) => {
            const isVisible = visibleQuestions.includes(question.id);
            if (!isVisible) return null;

            const answer = answers[question.id as keyof ContextualAnswers];
            const hasError = errors[question.id];
            const isTouched = touched.has(question.id);

            return (
              <Card
                key={question.id}
                id={`question-${question.id}`}
                className={hasError ? "border-red-500" : ""}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold text-foreground">
                        {question.title || question.text}
                        {question.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {question.subtitle && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {question.subtitle}
                        </p>
                      )}
                    </div>

                    {question.type === "single" ? (
                      <RadioGroup
                        value={(answer as string) || ""}
                        onValueChange={(value) => handleSingleSelect(question.id, value)}
                        className="space-y-2"
                      >
                        {question.options.map((option) => (
                          <label
                            key={option.value}
                            htmlFor={`${question.id}-${option.value}`}
                            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer w-full"
                            onClick={(e) => {
                              // Prevenir duplo clique se já estiver selecionado
                              if (answer === option.value) {
                                e.preventDefault();
                                return;
                              }
                            }}
                          >
                            <RadioGroupItem
                              value={option.value}
                              id={`${question.id}-${option.value}`}
                              aria-label={option.label}
                            />
                            <span className="flex-1 cursor-pointer font-normal">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2">
                        {question.options.map((option) => {
                          const isChecked = Array.isArray(answer)
                            ? answer.includes(option.value as any)
                            : false;
                          const isDisabled =
                            !isChecked &&
                            Array.isArray(answer) &&
                            answer.length >= (question.maxSelections || Infinity);

                          return (
                            <label
                              key={option.value}
                              htmlFor={`${question.id}-${option.value}`}
                              className={`flex items-center space-x-2 p-3 rounded-lg transition-colors w-full ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-muted/50 cursor-pointer"
                              }`}
                            >
                              <Checkbox
                                id={`${question.id}-${option.value}`}
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  handleMultipleSelect(
                                    question.id,
                                    option.value,
                                    checked === true
                                  )
                                }
                                disabled={isDisabled}
                                aria-label={option.label}
                              />
                              <span className="flex-1 cursor-pointer font-normal">
                                {option.label}
                              </span>
                            </label>
                          );
                        })}
                        {question.maxSelections && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Selecione até {question.maxSelections} opção(ões)
                          </p>
                        )}
                      </div>
                    )}

                    {hasError && isTouched && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors[question.id]}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gradient-primary hover:opacity-90 px-8 py-3 text-base font-semibold"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Continuar
                <CheckCircle2 className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ContextualQuestionnairePage;

