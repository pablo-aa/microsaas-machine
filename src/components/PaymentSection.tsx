import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Crown, Mail } from "lucide-react";
import { getMercadoPagoConfig } from "@/config/mercadopago";
interface PaymentSectionProps {
  onPurchase: () => void;
}

const PaymentSection = ({ onPurchase }: PaymentSectionProps) => {
  const price = getMercadoPagoConfig().price;
  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          Desbloqueie sua análise completa
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Veja seus resultados completos
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
          Descubra seus pontos fortes cognitivos e desbloqueie insights detalhados 
          sobre suas habilidades intelectuais.
        </p>

        {/* Pricing Card */}
        <Card className="max-w-md mx-auto shadow-lg mb-8">
          <CardContent className="p-8">
            {/* Badge */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-white text-sm font-medium">
                <Crown className="w-4 h-4 mr-1" />
                Acesso Total
              </div>
            </div>

            {/* Plan Name */}
            <h3 className="text-2xl font-bold text-foreground mb-2">Premium</h3>
            <p className="text-muted-foreground mb-6">
              Desbloqueie seu perfil vocacional completo
            </p>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">{price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              <span className="text-muted-foreground ml-2">pagamento único</span>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-foreground">Avaliação completa de perfil vocacional</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-foreground">Análise de aptidões e interesses</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-foreground">Sugestões de áreas e carreiras</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-foreground">Insights personalizados do seu perfil</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={onPurchase}
              className="w-full gradient-primary hover:opacity-90 py-3 text-base font-semibold mb-4"
            >
              Desbloquear Perfil
            </Button>

            {/* Support Text */}
            <p className="text-xs text-muted-foreground">
              Em caso de dúvidas, entre em contato com o email:
            </p>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Mail className="w-4 h-4 text-primary" />
              <a 
                href="mailto:carrerium.suporte@gmail.com" 
                className="text-primary text-sm font-medium hover:underline"
              >
                carrerium.suporte@gmail.com
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PaymentSection;