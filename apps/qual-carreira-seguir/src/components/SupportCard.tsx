import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const SupportCard = () => {
  return (
    <section className="bg-muted/30 pt-8 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            {/* Ícone */}
            <Mail className="h-8 w-8 text-primary mx-auto" />
            
            {/* Título */}
            <h3 className="text-xl font-bold">Precisa de ajuda?</h3>
            
            {/* Texto */}
            <p className="text-muted-foreground">
              Estamos aqui para ajudar você! Entre em contato conosco pelo e-mail:
            </p>
            
            {/* Email destacado */}
            <div className="bg-background rounded-lg p-4 border border-primary/20">
              <a 
                href="mailto:suporte@qualcarreira.com" 
                className="text-lg font-semibold text-primary hover:underline"
              >
                suporte@qualcarreira.com
              </a>
            </div>
            
            {/* Botão */}
            <Button variant="outline" size="lg" asChild>
              <a href="mailto:suporte@qualcarreira.com">
                Enviar E-mail
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SupportCard;

