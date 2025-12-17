import Link from "next/link";
import { Mail } from "lucide-react";
import logoQualCarreira from "@/assets/logo-qualcarreira.png";

const ResultsFooter = () => {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Brand */}
          <div>
            <Link href="/" className="flex items-center space-x-1 mb-4">
              <img
                src={
                  typeof logoQualCarreira === "string"
                    ? logoQualCarreira
                    : logoQualCarreira.src
                }
                alt="QualCarreira - Teste Vocacional"
                className="h-8 w-auto"
              />
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
                href="mailto:suporte@qualcarreira.com" 
                className="text-slate-300 hover:text-white transition-colors"
              >
                suporte@qualcarreira.com
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
            
            <div className="flex flex-wrap gap-4 md:gap-6 mt-4 md:mt-0 justify-center md:justify-end">
              <Link
                href="/como-funciona"
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Como Funciona
              </Link>
              <Link
                href="/termos-de-uso"
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Termos de Uso
              </Link>
              <Link
                href="/politica-de-privacidade"
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/faq"
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ResultsFooter;