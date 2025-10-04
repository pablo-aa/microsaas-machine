import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Copy, CheckCircle, Lock, BookOpen, Star, Lightbulb, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import RiasecResults from "@/components/RiasecResults";
import PaymentSection from "@/components/PaymentSection";
import ResultsFooter from "@/components/ResultsFooter";
import { PaymentModal } from "@/components/PaymentModal";

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
  
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [result, setResult] = useState<ResultData | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'riasec' | 'gardner' | 'gopc'>('riasec');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const resultUrl = `${window.location.origin}/resultado/${id}`;

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

  const handlePaymentSuccess = () => {
    console.log('Payment success, refetching result...');
    setShowPaymentModal(false);
    fetchResult(); // Refresh to get unlocked status
  };

  const handleTabChange = (tab: 'riasec' | 'gardner' | 'gopc') => {
    setActiveTab(tab);
  };

  // Loading state
  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Carregando seus resultados...</h2>
          <p className="text-muted-foreground">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // Expired state
  if (loadingState === 'expired') {
    return (
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
    );
  }

  // Not found state
  if (loadingState === 'not-found') {
    return (
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
    );
  }

  // Error state
  if (loadingState === 'error' || !result) {
    return (
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
    );
  }

  // Success state - show results with original UI/UX
  return (
    <div className="min-h-screen">
      {/* Hero Section - Original Design */}
      <section className="min-h-screen gradient-primary relative">
        {/* Header */}
        <header className="w-full bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">QC</span>
                </div>
                <span className="text-xl font-bold text-white">Qual Carreira</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-white">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-8">
            Resultados Completos
          </div>

          {/* User Name */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up">
            {result.name.toLowerCase()}
          </h1>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            esse é o seu Perfil Vocacional
          </h2>

          {/* Subtitle */}
          <p className="text-xl text-white/90 mb-16 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Baseado nas suas respostas, identificamos suas principais 
            aptidões e áreas de interesse.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-8 text-center">
                <div className="bg-white/20 rounded-full p-4 w-fit mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Perfil Detalhado</h3>
                <p className="text-white/80 text-sm">
                  Análise completa das suas aptidões e interesses
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-8 text-center">
                <div className="bg-white/20 rounded-full p-4 w-fit mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Áreas Recomendadas</h3>
                <p className="text-white/80 text-sm">
                  Carreiras alinhadas com seu perfil vocacional
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <CardContent className="p-8 text-center">
                <div className="bg-white/20 rounded-full p-4 w-fit mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Descubra Seu Potencial</h3>
                <p className="text-white/80 text-sm">
                  Explore seu perfil e saiba exatamente onde focar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleDesbloquearClick}
            size="lg"
            className="bg-white hover:bg-white/90 text-primary text-lg font-bold px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce-in mb-8"
            style={{ animationDelay: '0.6s' }}
          >
            <Lock className="mr-2 h-5 w-5" />
            {result.is_unlocked ? 'Ver Resultados' : 'Desbloquear Resultados'}
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
            isBlurred={!result.is_unlocked}
            onDesbloquear={handlePurchase}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Payment Section (if locked) */}
          {!result.is_unlocked && (
            <PaymentSection onPurchase={handlePurchase} />
          )}

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
      />
    </div>
  );
};

export default Resultado;
