import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-foreground">Carrerium</span>
            </div>
          </Link>

          {/* CTA Button */}
          <Link to="/comeco">
            <Button 
              variant="default" 
              className="gradient-primary hover:opacity-90 transition-opacity px-6 py-2 font-medium"
            >
              Começar Teste
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;