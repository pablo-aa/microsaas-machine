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
  trackPurchase, 
  trackPixCodeCopied, 
  trackPaymentError 
} from '@/lib/analytics';

// Get Supabase URL from environment (kept for potential direct calls if needed)
const getSupabaseUrl = () => {
  const hostname = window.location.hostname;
  const isProduction = hostname === 'qualcarreira.com' || hostname === 'www.qualcarreira.com';
  return isProduction 
    ? 'https://iwovfvrmjaonzqlaavmi.supabase.co'
    : 'https://sqmkerddgvshfqwgwnyc.supabase.co';
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testId: string;
  userEmail: string;
  userName: string;
}

export const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  testId, 
  userEmail, 
  userName 
}: PaymentModalProps) => {
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'error'>('pending');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const price = getMercadoPagoConfig().price;
  
  // Track begin_checkout when modal opens
  useEffect(() => {
    if (isOpen && !paymentId) {
      trackBeginCheckout(testId);
      createPayment();
    }
  }, [isOpen]);

  // Polling de status
  useEffect(() => {
    if (!paymentId || status !== 'pending') return;

    const interval = setInterval(async () => {
      await checkPaymentStatus();
    }, 5000); // Check a cada 5 segundos

    return () => clearInterval(interval);
  }, [paymentId, status]);

  const createPayment = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Creating payment for test:', testId);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          test_id: testId,
          email: userEmail,
          name: userName,
          // Explicit environment flag for accurate pricing on Edge Functions
          isProd: window.location.hostname === 'qualcarreira.com' || window.location.hostname === 'www.qualcarreira.com',
        },
      });

      if (error) {
        console.error('Error creating payment:', error);
        throw new Error(error.message || 'Erro ao criar pagamento');
      }

      if (data.error) {
        console.error('Payment creation error:', data.error);
        throw new Error(data.error);
      }

      console.log('Payment created successfully:', data);

      setPaymentId(data.payment_id);
      setQrCode(data.qr_code);
      setQrCodeBase64(data.qr_code_base64);
      setTicketUrl(data.ticket_url);
      setStatus(data.status || 'pending');
      setLoading(false);
      
      // Track payment info added (QR Code generated)
      trackAddPaymentInfo(testId, data.payment_id);
    } catch (err: any) {
      console.error('Error in createPayment:', err);
      const errorMessage = err.message || 'Erro ao criar pagamento. Tente novamente.';
      setError(errorMessage);
      setStatus('error');
      setLoading(false);
      trackPaymentError(errorMessage, testId);
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
      
      // Track purchase event
      trackPurchase(testId, paymentId, userEmail);
      
      toast({
        title: "Pagamento aprovado!",
        description: "Seus resultados completos estão sendo desbloqueados...",
      });
      await unlockResult();
    } else if (data?.status === 'rejected') {
      setStatus('rejected');
      setError('Pagamento rejeitado. Tente novamente.');
      trackPaymentError('Pagamento rejeitado', testId);
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
      toast({
        title: "Erro ao desbloquear",
        description: "Pagamento aprovado, mas houve erro ao desbloquear. Contate o suporte.",
        variant: "destructive"
      });
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
    
    // Track purchase event for dev testing
    trackPurchase(testId, paymentId || 'DEV_PAYMENT_ID', userEmail);
    
    toast({
      title: "🎭 Simulando pagamento aprovado",
      description: "Desbloqueando resultado (modo DEV)...",
    });
    await unlockResult(true);
  };

  const isDev = !window.location.hostname.includes('qualcarreira.com');

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
              <Button onClick={createPayment} variant="outline" size="sm">
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
                <p className="text-2xl font-bold text-primary">
                  {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
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
