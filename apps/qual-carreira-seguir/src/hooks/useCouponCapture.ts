import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getCoupon, validateAndSaveCoupon, clearCoupon } from '@/lib/couponStorage';

/**
 * Hook para capturar cupom da URL (?cupom=CODIGO)
 * Valida, salva no localStorage e mostra toast
 * Reutilizável em qualquer página
 */
export function useCouponCapture() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    // Só executar no cliente
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const cupom = params.get('cupom');

    if (!cupom) return;

    // Evitar processar o mesmo cupom múltiplas vezes
    if (processedRef.current === cupom) return;
    processedRef.current = cupom;

    const existingCoupon = getCoupon();

    console.log('[useCouponCapture] Cupom detectado na URL:', cupom);

    // Limpar URL imediatamente para evitar problemas de navegação
    // Usar apenas o pathname sem query params
    if (pathname && window.location.search) {
      router.replace(pathname, { scroll: false });
    }

    validateAndSaveCoupon(cupom)
      .then((result) => {
        if (result.valid) {
          // Determinar mensagem baseada no desconto
          const discountPercentage = result.discount_percentage ?? 0;
          const msg =
            discountPercentage >= 100
              ? '🎁 Acesso GRATUITO aplicado!'
              : `🎉 Cupom ${cupom.toUpperCase()} aplicado! ${Math.round(discountPercentage)}% OFF`;

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
  }, [pathname, router, toast]); // Dependências corretas

  return null;
}

