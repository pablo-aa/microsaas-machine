import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const ResultsFooter = () => {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">QC</span>
              </div>
              <span className="text-xl font-bold text-white">Qual Carreira</span>
            </Link>
            
            <p className="text-slate-300 leading-relaxed max-w-md">
              Ajudamos pessoas a descobrirem seu caminho profissional 
              ideal através de testes vocacionais.
            </p>
          </div>

          {/* Right Column - Contact */}
          <div className="md:text-right">
            <h3 className="text-lg font-semibold text-white mb-4">Contato</h3>
            <div className="flex items-center space-x-2 md:justify-end">
              <Mail className="w-5 h-5 text-primary" />
              <a 
                href="mailto:carrerium.suporte@gmail.com" 
                className="text-slate-300 hover:text-white transition-colors"
              >
                carrerium.suporte@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-400">
              © 2025 Qual Carreira. Todos os direitos reservados.
            </p>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Termos de Uso
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                Política de Privacidade
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ResultsFooter;