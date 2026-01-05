import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Copy, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { getMercadoPagoConfig } from '@/config/mercadopago';
import { 
  trackBeginCheckout, 
  trackAddPaymentInfo, 
  trackPixCodeCopied, 
  trackPaymentError 
} from '@/lib/analytics';
import { getGaIdentifiers } from '@/lib/gaCookies';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testId: string;
  userEmail: string;
  userName: string;
  couponCode?: string | null;
  variant?: string;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  testId,
  userEmail,
  userName,
  couponCode,
  variant,
}: PaymentModalProps) => {
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'error'>('pending');
  const [error, setError] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const { toast } = useToast();
  
  const getPriceByVariant = (v?: string): number => {
    switch (v) {
      case 'A': return 9.90;
      case 'B': return 12.90;
      case 'C': return 14.90;
      default: return 9.90; // Default para A (9.90)
    }
  };
  
  const basePrice = getPriceByVariant(variant);
  const [finalPrice, setFinalPrice] = useState<number>(basePrice);
  
  // Validate coupon and calculate final price (revalidate when coupon changes)
  useEffect(() => {
    const validateCouponPrice = async () => {
      if (couponCode) {
        try {
          console.log('[PaymentModal] Validating coupon:', couponCode, 'variant:', variant);
          const { data } = await supabase.functions.invoke('validate-coupon', {
            body: { 
              code: couponCode,
              payment_variant: variant // CRÍTICO: Passar variant para calcular preço correto
            }
          });
          
          if (data?.valid) {
            setFinalPrice(data.final_price);
            setDiscountPercentage(data.discount_percentage);
            console.log('[PaymentModal] Coupon validated:', data);
          } else {
            // Reset to base price if invalid
            setFinalPrice(basePrice);
            setDiscountPercentage(0);
          }
        } catch (error) {
          console.error('[PaymentModal] Error validating coupon:', error);
          setFinalPrice(basePrice);
          setDiscountPercentage(0);
        }
      } else {
        // No coupon, use base price
        setFinalPrice(basePrice);
        setDiscountPercentage(0);
      }
    };
    
    validateCouponPrice();
  }, [couponCode, basePrice, variant]); // Revalidate when couponCode or variant changes

  // Track begin_checkout when modal opens and create/reuse payment
  useEffect(() => {
    if (isOpen && !paymentId) {
      trackBeginCheckout(testId, couponCode || undefined, finalPrice, variant);
      probeExistingPaymentOrCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentId]); // ← Depende de isOpen e paymentId (evita chamadas duplicadas)

  // Polling de status
  useEffect(() => {
    if (!paymentId || status !== 'pending') return;

    const interval = setInterval(async () => {
      await checkPaymentStatus();
    }, 5000); // Check a cada 5 segundos

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, status]);

  // Função para obter parâmetros de URL
  const getURLParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const campaign = urlParams.get('campaign');
    return { source, campaign };
  };

  const getGaFields = () => {
    try {
      const { ga_client_id, ga_session_id, ga_session_number } = getGaIdentifiers();
      if (!ga_client_id || !ga_session_id) {
        console.warn('[PaymentModal] GA identifiers not available yet');
      }
      return {
        ga_client_id,
        ga_session_id,
        ga_session_number: ga_session_number ? Number(ga_session_number) : null,
      };
    } catch (error) {
      console.warn('[PaymentModal] Error reading GA cookies', error);
      return {
        ga_client_id: null,
        ga_session_id: null,
        ga_session_number: null,
      };
    }
  };

  const probeExistingPaymentOrCreate = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obter parâmetros de rastreamento da URL
      const { source, campaign } = getURLParams();
      const gaFields = getGaFields();

      // Tenta criar/reusar pagamento (backend decide automaticamente)
      const { data: reuseData, error: reuseError } = await supabase.functions.invoke('create-payment', {
        body: {
          test_id: testId,
          email: userEmail,
          name: userName,
          coupon_code: couponCode || undefined,
          isProd: true,
          source: source,
          campaign: campaign,
          payment_variant: variant || 'A',
          ...gaFields
        },
      });

      if (!reuseError && reuseData && reuseData.payment_id) {
        console.log('[PaymentModal] Backend returned payment:', reuseData.payment_id, 'status:', reuseData.status);
        setPaymentId(reuseData.payment_id);
        setQrCode(reuseData.qr_code || '');
        setQrCodeBase64(reuseData.qr_code_base64 || '');
        setTicketUrl(reuseData.ticket_url || '');
        setStatus(reuseData.status || 'pending');
        setLoading(false);

        // Se já aprovado, desbloqueia imediatamente
        if (reuseData.status === 'approved') {
          toast({
            title: 'Pagamento aprovado!',
            description: 'Desbloqueando seu resultado...',
          });
          await unlockResult();
          return;
        }

        // Track add_payment_info para pagamento criado/reusado
        trackAddPaymentInfo(testId, reuseData.payment_id, couponCode || undefined, finalPrice, variant);
        return; // ← IMPORTANTE: Não criar novo payment
      }

      // Se houve erro, logar mas NÃO criar novo (evitar loop)
      if (reuseError) {
        console.error('[PaymentModal] Error from create-payment:', reuseError);
        setError('Erro ao criar pagamento. Tente novamente.');
        setLoading(false);
        return; // ← IMPORTANTE: Não tentar criar de novo
      }

      // Se chegou aqui, não há payment_id (improvável, mas possível)
      console.warn('[PaymentModal] create-payment succeeded but no payment_id returned');
      setError('Erro ao processar pagamento.');
      setLoading(false);
    } catch (err: any) {
      console.error('[PaymentModal] Unexpected error in probeExistingPaymentOrCreate:', err);
      setError(err.message || 'Erro ao criar pagamento.');
      setLoading(false);
      trackPaymentError(err.message, testId, variant);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      if (!paymentId) return;

    console.log('Checking payment status:', paymentId);

    // Chamada padrão: supabase.functions.invoke (envia os headers automaticamente)
    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { payment_id: paymentId }
    });

    if (error) {
      console.error('Error checking status:', error);
      return;
    }

    console.log('Payment status:', data); // { id, status, status_detail?, test_id? }

    if (data?.status === 'approved') {
      setStatus('approved');
      
      // Conversion event is now handled by backend webhook (send-whatsapp-on-payment)
      
      toast({
        title: "Pagamento aprovado!",
        description: "Seus resultados completos estão sendo desbloqueados...",
      });
      await unlockResult();
    } else if (data?.status === 'rejected') {
      setStatus('rejected');
      setError('Pagamento rejeitado. Tente novamente.');
      trackPaymentError('Pagamento rejeitado', testId, variant);
    }
    // Opcional: console.log('Detalhe do status:', data?.status_detail);

  } catch (err) {
    console.error('Error checking payment status:', err);
  }
};
  
  const unlockResult = async (skipPaymentCheck = false) => {
    try {
      console.log('Unlocking result:', { testId, paymentId, skipPaymentCheck });

      const { data, error } = await supabase.functions.invoke('unlock-result', {
        body: {
          result_id: testId,
          payment_id: skipPaymentCheck ? 'DEV_BYPASS' : paymentId,
        },
      });

      if (error) {
        console.error('Error unlocking result:', error);
        toast({
          title: "Erro ao desbloquear",
          description: "Pagamento aprovado, mas houve erro ao desbloquear. Contate o suporte.",
          variant: "destructive"
        });
        return;
      }

      if (data.error) {
        console.error('Unlock error:', data.error);
        toast({
          title: "Erro ao desbloquear",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      console.log('Result unlocked successfully:', data);
      
      toast({
        title: "Resultado desbloqueado!",
        description: "Recarregando seus resultados completos...",
      });

      // Wait 2 seconds then refresh the page to show unlocked content
      setTimeout(() => {
        onSuccess();
        onClose();
        // Force reload to ensure fresh data
        window.location.href = window.location.href;
      }, 2000);

    } catch (err: any) {
      console.error('Error in unlockResult:', err);
      const errorMessage =
        err?.message ||
        "Pagamento aprovado, mas houve erro ao desbloquear. Contate o suporte.";
      toast({
        title: "Erro ao desbloquear",
        description: errorMessage,
        variant: "destructive"
      });
      trackPaymentError(errorMessage, testId, variant);
    }
  };

  const copyPixCode = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      trackPixCodeCopied(testId, paymentId);
      toast({
        title: "Código copiado!",
        description: "Cole no seu app de pagamentos para pagar.",
      });
    }
  };

  const handleClose = () => {
    if (status !== 'approved') {
      onClose();
    }
  };

  const handleDevBypass = async () => {
    setStatus('approved');
    
    // Conversion event is now handled by backend webhook (send-whatsapp-on-payment)
    // Note: DEV bypass won't trigger webhook, so conversion won't be tracked in dev mode
    
    toast({
      title: "🎭 Simulando pagamento aprovado",
      description: "Desbloqueando resultado (modo DEV)...",
    });
    await unlockResult(true);
  };

  // Mantém o botão de dev bypass no localhost
  const isDev = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'approved' ? 'Pagamento Aprovado!' : 'Pagar com PIX'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {status === 'approved' 
              ? 'Seus resultados completos estão sendo desbloqueados...'
              : 'Escaneie o QR Code ou copie o código PIX para pagar'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando pagamento...</p>
            </div>
          )}

          {error && status === 'error' && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <X className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={probeExistingPaymentOrCreate} variant="outline" size="sm">
                Tentar Novamente
              </Button>
            </div>
          )}

          {status === 'approved' && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-3">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-green-500">Pagamento confirmado!</p>
            </div>
          )}

          {!loading && !error && status === 'pending' && qrCodeBase64 && (
            <>
              <div className="rounded-lg border-2 border-border p-4 bg-white">
                <img 
                  src={`data:image/png;base64,${qrCodeBase64}`} 
                  alt="QR Code PIX" 
                  className="w-64 h-64"
                />
              </div>

              <div className="text-center">
                {discountPercentage > 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-base text-muted-foreground line-through">
                        {basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{Math.round(discountPercentage)}% OFF
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      🎉 Cupom aplicado!
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    {finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Aguardando pagamento...
                </p>
              </div>

              <Button 
                onClick={copyPixCode} 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código PIX
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Verificando pagamento automaticamente...</span>
              </div>

              {isDev && (
                <Button 
                  onClick={handleDevBypass} 
                  variant="destructive" 
                  className="w-full mt-4"
                  size="sm"
                >
                  🎭 Simular Pagamento Aprovado (DEV)
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
