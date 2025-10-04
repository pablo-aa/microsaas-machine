import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Star, Lightbulb, Lock, ChevronDown } from "lucide-react";
import RiasecResults from "@/components/RiasecResults";
import PaymentSection from "@/components/PaymentSection";
import ResultsFooter from "@/components/ResultsFooter";
import { PaymentModal } from "@/components/PaymentModal";

interface ResultadosCompletosProps {
  userName: string;
  userEmail: string;
  testId: string;
  onDesbloquear: () => void;
}

const ResultadosCompletos = ({ userName, userEmail, testId, onDesbloquear }: ResultadosCompletosProps) => {
  const [showFullResults, setShowFullResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'riasec' | 'gardner' | 'gopc'>('riasec');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleDesbloquearClick = () => {
    setShowFullResults(true);
    // Scroll to results section after state update
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePurchase = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    onDesbloquear();
  };

  const handleTabChange = (tab: 'riasec' | 'gardner' | 'gopc') => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Existing Design */}
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
            {userName.toLowerCase()}
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
            Desbloquear Resultados
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
            isBlurred={true}
            onDesbloquear={handlePurchase}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Payment Section */}
          <PaymentSection onPurchase={handlePurchase} />

          {/* Footer */}
          <ResultsFooter />
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        testId={testId}
        userEmail={userEmail}
        userName={userName}
      />
    </div>
  );
};

export default ResultadosCompletos;