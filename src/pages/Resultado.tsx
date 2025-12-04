import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Copy, CheckCircle, Lock, BookOpen, Star, Lightbulb, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useCouponCapture } from "@/hooks/useCouponCapture";
import { getCoupon } from "@/lib/couponStorage";
import RiasecResults from "@/components/RiasecResults";
import RecommendedCareers from "@/components/RecommendedCareers";
import PaymentSection from "@/components/PaymentSection";
import SupportCard from "@/components/SupportCard";
import ResultsFooter from "@/components/ResultsFooter";
import { PaymentModal } from "@/components/PaymentModal";
import logoQualCarreira from "@/assets/logo-qualcarreira.png";

interface ResultData {
  id: string;
  session_id: string;
  name: string;
  email: string;
  age: number;
  riasec_scores: Record<string, number>;
  gardner_scores: Record<string, number>;
  gopc_scores: Record<string, number>;
  is_unlocked: boolean;
  unlocked_at?: string;
  created_at: string;
  expires_at: string;
}

type LoadingState = 'loading' | 'success' | 'error' | 'expired' | 'not-found';

const Resultado = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  useCouponCapture(); // Captura cupom da URL se presente
  
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [result, setResult] = useState<ResultData | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'riasec' | 'gardner' | 'gopc'>('riasec');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  const resultUrl = `${window.location.origin}/resultado/${id}`;

  // Buscar cupom aplicado pelo backend (dashboard) no payment
  useEffect(() => {
    const checkBackendCoupon = async () => {
      if (!id) return;
      
      try {
        console.log('[Resultado] Verificando cupom aplicado no backend...');
        const { data, error } = await supabase
          .from('payments')
          .select('coupon_code, original_amount, amount')
          .eq('test_id', id)
          .not('coupon_code', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!error && data?.coupon_code) {
          console.log('[Resultado] Cupom encontrado no backend:', data.coupon_code);
          const savedCoupon = getCoupon();
          
          // Se é diferente do localStorage, aplicar o do backend
          if (savedCoupon !== data.coupon_code) {
            console.log('[Resultado] Aplicando cupom do backend:', data.coupon_code);
            
            // Validar e salvar
            const { validateAndSaveCoupon } = await import('@/lib/couponStorage');
            const validated = await validateAndSaveCoupon(data.coupon_code);
            
            if (validated.valid) {
              setCouponCode(data.coupon_code);
              toast({
                title: '🎯 Cupom especial aplicado!',
                description: `${data.coupon_code} - ${validated.discount_percentage}% de desconto`,
              });
            }
          } else {
            setCouponCode(savedCoupon);
          }
        } else {
          // Não tem cupom no backend, usar do localStorage
          const savedCoupon = getCoupon();
          setCouponCode(savedCoupon);
        }
      } catch (error) {
        console.error('[Resultado] Erro ao buscar cupom do backend:', error);
        // Fallback para localStorage
        const savedCoupon = getCoupon();
        setCouponCode(savedCoupon);
      }
    };
    
    checkBackendCoupon();
  }, [id]);
  
  // Ouvir mudanças no localStorage (quando cupom é atualizado via URL)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentCoupon = getCoupon();
      if (currentCoupon !== couponCode) {
        console.log('[Resultado] Cupom do localStorage mudou:', currentCoupon);
        setCouponCode(currentCoupon);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [couponCode]);

  useEffect(() => {
    if (!id) {
      setLoadingState('error');
      return;
    }

    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      setLoadingState('loading');

      // Add timestamp to prevent caching
      const timestamp = Date.now();
      console.log('Fetching result with timestamp:', timestamp);

      const { data, error } = await supabase.functions.invoke('get-result', {
        body: { result_id: id, _t: timestamp }
      });

      if (error) {
        console.error('Error fetching result:', error);
        
        if (error.message?.includes('expired')) {
          setLoadingState('expired');
        } else if (error.message?.includes('not found')) {
          setLoadingState('not-found');
        } else {
          setLoadingState('error');
        }
        return;
      }

      if (!data) {
        setLoadingState('not-found');
        return;
      }

      setResult(data);
      setLoadingState('success');
      
      console.log('Result fetched:', {
        id: data.id,
        name: data.name,
        is_unlocked: data.is_unlocked,
        unlocked_at: data.unlocked_at
      });

      if (data.is_unlocked) {
        setShowFullResults(true);
      }

    } catch (error) {
      console.error('Error fetching result:', error);
      setLoadingState('error');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resultUrl);
    setLinkCopied(true);
    
    toast({
      title: "Link copiado!",
      description: "Você pode acessar seus resultados a qualquer momento",
    });

    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleDesbloquearClick = () => {
    setShowFullResults(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePurchase = () => {
    setShowPaymentModal(true);
  };
  
  const handleScrollToPayment = () => {
    setShowFullResults(true);
    setTimeout(() => {
      paymentRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePaymentSuccess = () => {
    console.log('Payment success, refetching result...');
    setShowPaymentModal(false);
    fetchResult(); // Refresh to get unlocked status
  };

  const handleTabChange = (tab: 'riasec' | 'gardner' | 'gopc') => {
    setActiveTab(tab);
  };

  // Background check: if resultado está bloqueado e o modal não está aberto,
  // verifica periodicamente se há pagamento aprovado e tenta desbloquear.
  useEffect(() => {
    let interval: number | undefined;

    const startBackgroundCheck = () => {
      if (!result || result.is_unlocked || showPaymentModal) return;

      interval = window.setInterval(async () => {
        try {
          console.log('[BG] Checking existing payment for auto-unlock...');
          const { data, error } = await supabase.functions.invoke('create-payment', {
            body: {
              test_id: result.id,
              email: result.email,
              name: result.name,
              reuse_only: true,
            },
          });

          if (error) {
            console.warn('[BG] Reuse check error:', error.message);
            return;
          }

          if (data?.status === 'approved' && data?.payment_id) {
            console.log('[BG] Payment approved, unlocking...', data.payment_id);
            const { data: unlockData, error: unlockError } = await supabase.functions.invoke('unlock-result', {
              body: { result_id: result.id, payment_id: data.payment_id },
            });

            if (unlockError || unlockData?.error) {
              console.warn('[BG] Unlock error:', unlockError || unlockData?.error);
              return;
            }

            // Refresh result to reflect unlocked state
            await fetchResult();
            toast({
              title: 'Resultado desbloqueado!',
              description: 'Detectamos seu pagamento e liberamos o acesso.',
            });
          }
        } catch (e) {
          console.warn('[BG] Unexpected error during background check:', e);
        }
      }, 20000); // a cada 20 segundos
    };

    startBackgroundCheck();

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [result?.id, result?.email, result?.name, result?.is_unlocked, showPaymentModal]);

  // Loading state
  if (loadingState === 'loading') {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Carregando seus resultados...</h2>
            <p className="text-muted-foreground">Aguarde um momento</p>
          </div>
        </div>
      </>
    );
  }

  // Expired state
  if (loadingState === 'expired') {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Resultado Expirado</h2>
              <p className="text-muted-foreground mb-6">
                Este resultado expirou após 30 dias. Faça um novo teste para obter resultados atualizados.
              </p>
              <Button asChild className="gradient-primary">
                <Link to="/">Fazer novo teste</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Not found state
  if (loadingState === 'not-found') {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Resultado não encontrado</h2>
              <p className="text-muted-foreground mb-6">
                Não encontramos um resultado com este identificador. Verifique o link e tente novamente.
              </p>
              <Button asChild className="gradient-primary">
                <Link to="/">Voltar para início</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Error state
  if (loadingState === 'error' || !result) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Erro ao carregar</h2>
              <p className="text-muted-foreground mb-6">
                Ocorreu um erro ao carregar seus resultados. Tente novamente.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchResult} variant="outline">
                  Tentar novamente
                </Button>
                <Button asChild className="gradient-primary">
                  <Link to="/">Voltar para início</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Success state - show results with original UI/UX
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen">
        {/* Hero Section - Original Design */}
        <section className="min-h-screen gradient-primary relative">
        {/* Header */}
        <header className="w-full bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-1">
                <img 
                  src={logoQualCarreira} 
                  alt="QualCarreira - Teste Vocacional" 
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-white">Qual Carreira</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 text-center text-white">
          {/* Badge */}
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 text-white text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            Resultados Completos
          </div>

          {/* User Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 animate-fade-in-up break-words px-2">
            {result.name.toLowerCase()}
          </h1>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 animate-fade-in-up px-2" style={{ animationDelay: '0.1s' }}>
            esse é o seu Perfil Vocacional
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 sm:mb-12 lg:mb-16 max-w-2xl mx-auto animate-fade-in-up px-4" style={{ animationDelay: '0.2s' }}>
            Baseado nas suas respostas, identificamos suas principais 
            aptidões e áreas de interesse.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16 px-2">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                <div className="bg-white/20 rounded-full p-3 sm:p-4 w-fit mx-auto mb-3 sm:mb-4">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3">Perfil Detalhado</h3>
                <p className="text-white/80 text-xs sm:text-sm">
                  Análise completa das suas aptidões e interesses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                <div className="bg-white/20 rounded-full p-3 sm:p-4 w-fit mx-auto mb-3 sm:mb-4">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3">Áreas Recomendadas</h3>
                <p className="text-white/80 text-xs sm:text-sm">
                  Carreiras alinhadas com seu perfil vocacional
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                <div className="bg-white/20 rounded-full p-3 sm:p-4 w-fit mx-auto mb-3 sm:mb-4">
                  <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3">Descubra Seu Potencial</h3>
                <p className="text-white/80 text-xs sm:text-sm">
                  Explore seu perfil e saiba exatamente onde focar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleDesbloquearClick}
            size="lg"
            className="bg-white hover:bg-white/90 text-primary text-base sm:text-lg font-bold px-6 sm:px-10 lg:px-12 py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce-in mb-6 sm:mb-8 w-full sm:w-auto max-w-full mx-0 gap-2 min-w-0"
            style={{ animationDelay: '0.6s' }}
          >
            <Lock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate max-w-full">
              {result.is_unlocked ? 'Ver Resultados' : 'Desbloquear Resultados'}
            </span>
          </Button>

          {/* Scroll Indicator */}
          {showFullResults && (
            <div className="animate-bounce">
              <ChevronDown className="h-8 w-8 text-white/70 mx-auto" />
            </div>
          )}
        </main>
      </section>

      {/* Results Sections - Only show after unlock */}
      {showFullResults && (
        <div ref={resultsRef}>
          {/* RIASEC Results Section */}
          <RiasecResults 
            riasecScores={result.riasec_scores}
            gardnerScores={result.gardner_scores}
            gopcScores={result.gopc_scores}
            isBlurred={!result.is_unlocked}
            onDesbloquear={handleScrollToPayment}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isUnlocked={result.is_unlocked}
          />

          {/* Recommended Careers Section */}
          <RecommendedCareers 
            riasecScores={result.riasec_scores}
            gardnerScores={result.gardner_scores}
            gopcScores={result.gopc_scores}
            isBlurred={!result.is_unlocked}
          />

          {/* Payment Section (if locked) */}
          {!result.is_unlocked && (
            <div ref={paymentRef}>
              <PaymentSection 
                onPurchase={handlePurchase} 
                testId={id || ''}
                userEmail={result.email}
                userName={result.name}
              />
            </div>
          )}

          {/* Support Card - sempre visível, após pagamento ou profissões */}
          <SupportCard />

          {/* Footer */}
          <ResultsFooter />
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        testId={id || ''}
        userEmail={result.email}
        userName={result.name}
        couponCode={couponCode}
      />
    </div>
    </>
  );
};

export default Resultado;
