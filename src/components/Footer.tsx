import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoQualCarreira from "@/assets/logo-qualcarreira.png";

const Footer = () => {
  return (
    <footer className="bg-muted py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Solution Name & Logo */}
          <Link to="/" className="flex items-center justify-center space-x-1 mb-4">
            <img 
              src={logoQualCarreira} 
              alt="QualCarreira - Teste Vocacional" 
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold text-foreground">Qual Carreira</span>
          </Link>

          {/* Subtitle */}
          <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Descubra sua carreira ideal com nosso teste vocacional cientificamente comprovado.
          </p>

          {/* CTA Button */}
          <Link to="/comeco">
            <Button 
              className="gradient-primary hover:opacity-90 transition-opacity mb-8 px-8 py-3 text-base font-semibold"
            >
              Começar Teste
            </Button>
          </Link>

          {/* Contact Email */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Entre em contato:</p>
            <a 
              href="mailto:suporte@qualcarreira.com" 
              className="text-primary hover:text-primary-dark transition-colors font-medium"
            >
              suporte@qualcarreira.com
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <Link to="/termos-de-uso" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Termos de Uso
            </Link>
            <Link to="/politica-de-privacidade" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Política de Privacidade
            </Link>
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              FAQ
            </Link>
          </div>

          {/* Copyright */}
          <div className="border-t border-border/50 pt-8">
            <p className="text-sm text-muted-foreground">
              © 2024 Qual Carreira. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;