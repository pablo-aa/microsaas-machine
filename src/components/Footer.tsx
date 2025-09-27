import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-muted py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Solution Name & Logo */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Carrerium</span>
          </div>

          {/* Subtitle */}
          <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Descubra sua carreira ideal com nosso teste vocacional cientificamente comprovado.
          </p>

          {/* CTA Button */}
          <Button 
            className="gradient-primary hover:opacity-90 transition-opacity mb-8 px-8 py-3 text-base font-semibold"
          >
            Começar Teste
          </Button>

          {/* Contact Email */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Entre em contato:</p>
            <a 
              href="mailto:contato@gmail.com" 
              className="text-primary hover:text-primary-dark transition-colors font-medium"
            >
              contato@gmail.com
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Termos de uso
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Políticas de Privacidade
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              FAQ
            </a>
          </div>

          {/* Copyright */}
          <div className="border-t border-border/50 pt-8">
            <p className="text-sm text-muted-foreground">
              © 2024 Carrerium. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;