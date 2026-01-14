import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Crown, Gift, Loader2 } from "lucide-react";
import { getMercadoPagoConfig } from "@/config/mercadopago";
import { getCoupon, validateAndSaveCoupon, ValidatedCoupon } from "@/lib/couponStorage";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { trackCustomPurchase } from "@/lib/analytics";

interface PaymentSectionProps {
  onPurchase: () => void;
  testId: string;
  userEmail: string;
  userName: string;
}

const PaymentSection = ({ onPurchase, testId, userEmail, userName }: PaymentSectionProps) => {
  const { toast } = useToast();
  const basePrice = 12.90;
  
  const [coupon, setCoupon] = useState<ValidatedCoupon | null>(null);
  const [isLoadingCoupon, setIsLoadingCoupon] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Validar cupom salvo no mount
  useEffect(() => {
    const loadCoupon = async () => {
      const savedCoupon = getCoupon();
      if (savedCoupon) {
        console.log('[PaymentSection] Validando cupom salvo:', savedCoupon);
        const validatedCoupon = await validateAndSaveCoupon(savedCoupon);
        if (validatedCoupon.valid) {
          setCoupon(validatedCoupon);
        }
      }
      setIsLoadingCoupon(false);
    };
    
    loadCoupon();
  }, []);

  const handleFreeUnlock = async () => {
    if (!coupon || !coupon.code) return;
    const discount = coupon.discount_percentage ?? 0;
    if (discount < 100) return;
    
    setIsUnlocking(true);
    try {
      console.log('[PaymentSection] Unlocking with FREE coupon');
      
      const { data, error } = await supabase.functions.invoke('unlock-free-result', {
        body: {
          test_id: testId,
          coupon_code: coupon.code
        }
      });
      
      if (error || data.error) {
        console.error('[PaymentSection] Error unlocking:', error || data.error);
        toast({
          title: 'Erro ao desbloquear',
          description: data.error || 'Tente novamente',
          variant: 'destructive'
        });
        return;
      }
      
      console.log('[PaymentSection] Unlocked successfully!');
      
      if (data.success && data.payment_id) {
        trackCustomPurchase(
          testId,
          data.payment_id,
          0, // amount é 0 para cupom grátis
          coupon.code
        );
      }
      
      toast({
        title: 'Resultado desbloqueado!',
        description: 'Recarregando...'
      });
      
      // Reload page after 1 second
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 1000);
      
    } catch (error) {
      console.error('[PaymentSection] Unexpected error:', error);
      toast({
        title: 'Erro ao desbloquear',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const finalPrice = coupon?.valid ? coupon.final_price : basePrice;
  const discount = coupon?.discount_percentage ?? 0;
  const isFree = coupon?.valid && discount >= 100;

  // Mostrar card especial para 100% desconto
  if (isFree) {
    return (
      <section className="bg-muted/30 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            🎁 Acesso Gratuito Liberado
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Você ganhou acesso completo gratuitamente!
          </h2>

          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Clique no botão abaixo para desbloquear seu perfil vocacional completo.
          </p>

          <Card className="max-w-md mx-auto shadow-lg mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500 text-white text-sm font-medium">
                  <Gift className="w-4 h-4 mr-1" />
                  Acesso Gratuito
                </div>
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-2">Gratuito</h3>
              <p className="text-muted-foreground mb-6">
                Cupom {coupon.code} aplicado com sucesso
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-green-500">R$ 0,00</span>
                <span className="text-muted-foreground ml-2 line-through">R$ {basePrice.toFixed(2)}</span>
              </div>

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

              <Button
                onClick={handleFreeUnlock}
                disabled={isUnlocking}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-base font-semibold"
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desbloqueando...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Desbloquear Gratuitamente
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Fluxo normal com ou sem desconto
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
              {coupon?.valid && discount > 0 ? (
                <>
                  <div className="flex items-center justify-center mb-3">
                    <span className="text-muted-foreground line-through mr-3 text-base">
                      R$ {basePrice.toFixed(2)}
                    </span>
                    <span className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                      -{Math.round(discount)}% OFF
                    </span>
                  </div>
                  <div className="text-green-600 text-sm font-medium mb-2">
                    🎉 Cupom {coupon.code} aplicado!
                  </div>
                  <span className="text-4xl font-bold text-green-600">
                    {finalPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-muted-foreground ml-2">pagamento único</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold text-foreground">
                    {basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-muted-foreground ml-2">pagamento único</span>
                </>
              )}
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
              className="w-full gradient-primary hover:opacity-90 py-3 text-base font-semibold"
            >
              Desbloquear Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PaymentSection;