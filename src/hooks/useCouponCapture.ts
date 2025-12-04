import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getCoupon, validateAndSaveCoupon, clearCoupon } from '@/lib/couponStorage';

/**
 * Hook para capturar cupom da URL (?cupom=CODIGO)
 * Valida, salva no localStorage e mostra toast
 * Reutilizável em qualquer página
 */
export function useCouponCapture() {
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cupom = params.get('cupom');

    if (!cupom) return;

    const existingCoupon = getCoupon();

    console.log('[useCouponCapture] Cupom detectado na URL:', cupom);

    validateAndSaveCoupon(cupom)
      .then((result) => {
        if (result.valid) {
          // Determinar mensagem baseada no desconto
          const msg =
            result.discount_percentage >= 100
              ? '🎁 Acesso GRATUITO aplicado!'
              : `🎉 Cupom ${cupom.toUpperCase()} aplicado! ${result.discount_percentage}% OFF`;

          toast({
            title: msg,
            description: result.description || undefined,
          });

          // Se existia um cupom diferente, avisar que foi substituído
          if (existingCoupon && existingCoupon !== cupom.toUpperCase()) {
            setTimeout(() => {
              toast({
                title: 'Cupom anterior substituído',
                variant: 'default',
              });
            }, 1000);
          }
        } else {
          // Cupom inválido
          const reasonMessages: Record<string, string> = {
            invalid_code: 'Código não encontrado',
            expired: 'Cupom expirado',
            max_uses_reached: 'Cupom esgotado',
            inactive: 'Cupom não está ativo',
            error: 'Erro ao validar cupom',
          };

          toast({
            title: 'Cupom inválido',
            description: result.reason ? reasonMessages[result.reason] : 'Tente novamente',
            variant: 'destructive',
          });

          // Limpar cupom inválido
          clearCoupon();
        }
      })
      .catch((error) => {
        console.error('[useCouponCapture] Erro ao validar cupom:', error);
        toast({
          title: 'Erro ao validar cupom',
          description: 'Tente novamente mais tarde',
          variant: 'destructive',
        });
        clearCoupon();
      });

    // Limpar URL (remover ?cupom=)
    window.history.replaceState({}, '', window.location.pathname);
  }, []); // Empty deps: executa apenas uma vez no mount

  return null;
}

