import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Copy, CheckCircle, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import RiasecResults from "@/components/RiasecResults";
import GardnerResults from "@/components/GardnerResults";
import GopcResults from "@/components/GopcResults";
import PaymentSection from "@/components/PaymentSection";
import ResultsFooter from "@/components/ResultsFooter";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [result, setResult] = useState<ResultData | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

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

      const { data, error } = await supabase.functions.invoke('get-result', {
        body: { result_id: id }
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

  const handleDesbloquear = () => {
    // This will be handled by PaymentSection
    console.log('Initiating payment for result:', id);
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

  // Success state - show results
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Save Link Alert - ALWAYS VISIBLE */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="ml-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-blue-900 mb-1">
                  💾 Salve este link para consultar seus resultados a qualquer momento!
                </p>
                <code className="text-xs bg-white/50 px-2 py-1 rounded break-all">
                  {resultUrl}
                </code>
              </div>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {linkCopied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar link
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Olá, <span className="text-gradient">{result.name}</span>! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Aqui estão seus resultados do teste vocacional
          </p>
        </div>

        {/* Results Content */}
        <div className={result.is_unlocked ? '' : 'relative'}>
          {/* Blur overlay if locked */}
          {!result.is_unlocked && (
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/30 flex items-center justify-center">
              <Card className="max-w-md mx-4">
                <CardContent className="p-8 text-center">
                  <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Resultados Bloqueados</h3>
                  <p className="text-muted-foreground mb-6">
                    Desbloqueie seus resultados completos por apenas <strong>R$ 12,90</strong>
                  </p>
                  <PaymentSection onPurchase={handleDesbloquear} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Sections */}
          <div className="space-y-8">
            <RiasecResults 
              isBlurred={!result.is_unlocked}
              onDesbloquear={handleDesbloquear}
            />
            <GardnerResults 
              isBlurred={!result.is_unlocked}
            />
            <GopcResults 
              isBlurred={!result.is_unlocked}
            />
          </div>
        </div>

        {/* Payment Section (if locked) */}
        {!result.is_unlocked && (
          <div className="mt-12">
            <PaymentSection onPurchase={handleDesbloquear} />
          </div>
        )}

        {/* Footer */}
        <ResultsFooter />
      </main>
    </div>
  );
};

export default Resultado;
