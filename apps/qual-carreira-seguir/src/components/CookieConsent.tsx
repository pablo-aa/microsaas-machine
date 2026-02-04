import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Shield } from "lucide-react";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    // Here you would set cookies preferences
    localStorage.setItem('cookie-consent', 'all');
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    // Here you would set essential cookies only
    localStorage.setItem('cookie-consent', 'essential');
    setIsVisible(false);
  };

  const handleCustomize = () => {
    // Here you would open a modal for cookie customization
    console.log('Open cookie customization modal');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto">
      <Card className="animate-scale-in shadow-2xl border border-border/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Sua privacidade é importante
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Utilizamos cookies para melhorar sua experiência, personalizar 
            conteúdo e analisar o tráfego do site.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleEssentialOnly}
              className="border-muted-foreground/30 text-muted-foreground hover:bg-muted/50"
            >
              Apenas Essenciais
            </Button>
            <Button
              variant="outline"
              onClick={handleCustomize}
              className="border-primary text-primary hover:bg-primary/5"
            >
              Personalizar
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="gradient-primary hover:opacity-90 transition-opacity px-6"
            >
              Aceitar Todos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsent;