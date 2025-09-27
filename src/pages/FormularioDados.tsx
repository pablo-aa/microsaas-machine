import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useParams } from "react-router-dom";
import { User, Mail, Calendar, Loader2, Sparkles, Info } from "lucide-react";
import { z } from "zod";

// Validation schema
const formSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  age: z.string().trim().min(1, "Idade é obrigatória").refine((val) => {
    const num = parseInt(val);
    return num >= 14 && num <= 100;
  }, "Idade deve ser entre 14 e 100 anos")
});

type FormData = z.infer<typeof formSchema>;

interface FormularioDadosProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const FormularioDados = ({ onSubmit, isLoading }: FormularioDadosProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    age: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = formSchema.parse(formData);
      onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormData] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
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
          {/* Step indicator */}
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

        {/* Main Form Card */}
        <Card className="shadow-lg mb-8">
          <CardContent className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome completo */}
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
                  className={`${errors.name ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
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
                  className={`${errors.email ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Idade */}
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
                  className={`${errors.age ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  min="14"
                  max="100"
                />
                {errors.age && (
                  <p className="text-sm text-red-600">{errors.age}</p>
                )}
              </div>

              {/* Submit Button */}
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

            {/* Privacy Text */}
            <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
              Seus dados estão seguros e serão utilizados apenas para gerar seu perfil profissional.
            </p>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
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
      </main>
    </div>
  );
};

export default FormularioDados;