import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import ResultsFooter from "@/components/ResultsFooter";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageView } from "@/hooks/useGTM";

const TermosDeUso = () => {
  usePageView();
  
  return (
    <>
      <Helmet>
        <title>Termos de Uso | QualCarreira - Teste Vocacional Online</title>
        <meta 
          name="description" 
          content="Leia os Termos de Uso da QualCarreira. Conheça as regras e condições para utilizar nosso teste vocacional e serviços de orientação profissional." 
        />
        <meta property="og:title" content="Termos de Uso | QualCarreira" />
        <meta property="og:description" content="Leia os Termos de Uso da QualCarreira. Conheça as regras e condições para utilizar nosso teste vocacional e serviços de orientação profissional." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://qualcarreira.com/termos-de-uso" />
      </Helmet>

      <main className="min-h-screen bg-background">
        <Header />
        
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary hover:text-primary-dark transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a página inicial
          </Link>

          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Termos de Uso</h1>
            <p className="text-muted-foreground">
              Bem-vindo à QualCarreira. Ao acessar ou utilizar nosso site em qualcarreira.com e realizar o teste vocacional oferecido pela QualCarreira (coletivamente, os "Serviços"), você concorda com estes Termos de Uso. Por favor, leia-os cuidadosamente.
            </p>
          </header>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar ou utilizar os Serviços, você concorda em ficar vinculado a estes Termos de Uso, à nossa Política de Privacidade e a quaisquer termos adicionais aplicáveis. Se você não concordar, não utilize os Serviços.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Elegibilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você deve ter pelo menos 16 anos de idade para utilizar os Serviços. Se tiver entre 16 e 18 anos, precisa de autorização de um responsável legal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Utilização do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                O teste vocacional pode ser realizado de forma anônima. Seus dados são solicitados apenas ao final, para envio e personalização dos resultados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Testes Vocacionais e Resultados</h2>
              <p className="text-muted-foreground leading-relaxed">
                O teste utiliza metodologias reconhecidas como RIASEC, Inteligências Múltiplas de Gardner e GOPC, para indicar carreiras compatíveis com seu perfil. Os resultados são orientativos e não substituem aconselhamento profissional.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Pagamentos e Reembolsos</h2>
              <p className="text-muted-foreground leading-relaxed">
                O acesso ao relatório completo está disponível mediante pagamento via PIX. Caso tenha algum problema, entre em contato pelo e-mail <a href="mailto:suporte@qualcarreira.com" className="text-primary hover:underline">suporte@qualcarreira.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Dados Pessoais e Privacidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                As informações coletadas são usadas exclusivamente para geração do resultado. Não há compartilhamento com terceiros para fins comerciais. Consulte a <Link to="/politica-de-privacidade" className="text-primary hover:underline">Política de Privacidade</Link> para mais detalhes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Conduta Proibida</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em não usar os Serviços para atividades ilegais, não tentar acesso indevido a sistemas, contas ou redes e não interferir no funcionamento do site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os testes são voltados ao autoconhecimento. A QualCarreira não se responsabiliza por decisões tomadas exclusivamente com base nos resultados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo do site pertence à QualCarreira. É proibida sua reprodução sem autorização prévia.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Modificações dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos alterar estes Termos a qualquer momento, com aviso no site. O uso contínuo dos Serviços implica aceitação das mudanças.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas, envie um e-mail para <a href="mailto:suporte@qualcarreira.com" className="text-primary hover:underline">suporte@qualcarreira.com</a>.
              </p>
            </section>
          </div>
        </article>

        <ResultsFooter />
      </main>
    </>
  );
};

export default TermosDeUso;
