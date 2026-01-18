"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, Mail, Calendar, Loader2, Sparkles, Info } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { assessmentStorage } from "@/lib/assessmentStorage";
import {
  trackFormViewed,
  trackFormFieldInteraction,
  trackFormSubmitted,
  trackFormError,
} from "@/lib/analytics";
import type { ContextualAnswers } from "@/data/contextualQuestions";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255, "Email muito longo"),
  age: z
    .string()
    .trim()
    .min(1, "Idade é obrigatória")
    .refine((val) => {
      const num = parseInt(val);
      return num >= 14 && num <= 100;
    }, "Idade deve ser entre 14 e 100 anos"),
});

type FormData = z.infer<typeof formSchema>;

interface Answer {
  question_id: number;
  score: number;
}

interface FormularioDadosProps {
  answers: Answer[];
  testId: string;
  contextualAnswers?: ContextualAnswers;
  contextualQuestionnaireVariant?: string; // NOVO
}

const FormularioDadosPage = ({ answers, testId, contextualAnswers, contextualQuestionnaireVariant }: FormularioDadosProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    age: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    trackFormViewed(testId);
  }, [testId]);

  // Carregar dados salvos
  useEffect(() => {
    const flowState = assessmentStorage.loadFlowState(testId);
    if (flowState?.formData) {
      setFormData(flowState.formData);
    }
  }, [testId]);

  // Salvar dados quando mudarem (debounced, atômico)
  useEffect(() => {
    if (!formData.name && !formData.email && !formData.age) return; // Não salvar vazio
    
    const timeoutId = setTimeout(() => {
      assessmentStorage.updateFlowState(testId, {
        formData: formData,
      });
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(timeoutId);
  }, [formData, testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = formSchema.parse(formData);
      setIsLoading(true);

      trackFormSubmitted(testId, validatedData.age, contextualQuestionnaireVariant || "disabled");

      const requestBody: any = {
        name: validatedData.name,
        email: validatedData.email,
        age: parseInt(validatedData.age),
        answers: answers,
      };

      // Adicionar contextual_questionnaire apenas se presente (compatibilidade)
      if (contextualAnswers) {
        requestBody.contextual_questionnaire = contextualAnswers;
      }

      const { data, error } = await supabase.functions.invoke("create-result", {
        body: requestBody,
      });

      if (error) {
        trackFormError(testId, error.message || "Erro ao criar resultado");
        throw new Error(error.message || "Erro ao criar resultado");
      }

      if (!data || !data.result_id) {
        trackFormError(testId, "Resposta inválida do servidor");
        throw new Error("Resposta inválida do servidor");
      }

      // Limpar TODO o estado após sucesso
      assessmentStorage.clearFlowState(testId);
      router.push(`/resultado/${data.result_id}`);
    } catch (error) {
      console.error("Form submission error:", error);
      setIsLoading(false);

      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormData] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Erro ao gerar resultados",
          description:
            error instanceof Error ? error.message : "Tente novamente em instantes",
          variant: "destructive",
        });
      }
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    trackFormFieldInteraction(field);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">QC</span>
              </div>
              <span className="text-xl font-bold text-foreground">Qual Carreira</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Último passo
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Descubra seu <span className="text-gradient">caminho profissional</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Estamos quase lá! Preencha seus dados para acessar os resultados detalhados do
            seu teste vocacional.
          </p>
        </div>

        <Card className="bg-blue-50 border-blue-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Isso não é um cadastro!</strong> Apenas utilizamos esses dados
                para personalizar os seus resultados!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-8">
          <CardContent className="p-8">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span>Nome completo</span>
                </label>
                <Input
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Email</span>
                </label>
                <Input
                  type="email"
                  placeholder="Digite seu melhor email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Idade</span>
                </label>
                <Input
                  type="number"
                  placeholder="Digite a sua idade"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className={errors.age ? "border-red-500" : ""}
                  disabled={isLoading}
                  min="14"
                  max="100"
                />
                {errors.age && <p className="text-sm text-red-600">{errors.age}</p>}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gradient-primary hover:opacity-90 py-3 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando seus resultados...
                  </>
                ) : (
                  "Ver meus resultados"
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
              Seus dados estão seguros e serão utilizados apenas para gerar seu perfil profissional.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FormularioDadosPage;
