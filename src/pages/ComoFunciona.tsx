import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Brain, Users, Target, Zap, Shield, Clock, Award } from "lucide-react";
import Header from "@/components/Header";
import ResultsFooter from "@/components/ResultsFooter";

const ComoFunciona = () => {
  return (
    <>
      <Helmet>
        <title>Como Funciona | QualCarreira - Teste Vocacional Científico</title>
        <meta 
          name="description" 
          content="Descubra como funciona o teste vocacional da QualCarreira. Metodologias científicas RIASEC, Gardner e GOPC para identificar sua carreira ideal em minutos." 
        />
        <meta property="og:title" content="Como Funciona | QualCarreira - Teste Vocacional Científico" />
        <meta property="og:description" content="Descubra como funciona o teste vocacional da QualCarreira. Metodologias científicas RIASEC, Gardner e GOPC para identificar sua carreira ideal em minutos." />
        <meta property="og:url" content="https://www.qualcarreira.com/como-funciona" />
        <meta property="og:image" content="https://www.qualcarreira.com/og-image.png" />
        <link rel="canonical" href="https://www.qualcarreira.com/como-funciona" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 gradient-hero">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Como Funciona a <span className="text-gradient">QualCarreira</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma de teste vocacional baseada em ciência que utiliza algoritmos de psicometria 
              para analisar sua personalidade, habilidades e interesses, oferecendo orientação personalizada para sua carreira.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <Brain className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Baseado em Ciência</h3>
                <p className="text-muted-foreground">
                  Utilizamos três metodologias científicas reconhecidas internacionalmente para garantir 
                  resultados precisos e confiáveis.
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Personalizado</h3>
                <p className="text-muted-foreground">
                  Cada resultado é único e personalizado com base nas suas respostas específicas, 
                  oferecendo orientação direcionada para seu perfil.
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Privado e Seguro</h3>
                <p className="text-muted-foreground">
                  Seus dados são protegidos e o teste pode ser realizado de forma anônima, 
                  garantindo total privacidade durante o processo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Scientific Methodologies */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-4">
              Três Pilares Científicos
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Nosso teste combina três modelos reconhecidos mundialmente para criar um perfil 
              vocacional completo e abrangente.
            </p>

            <div className="space-y-8">
              {/* RIASEC */}
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground">RIASEC</h3>
                    <p className="text-sm text-muted-foreground">Modelo de Holland</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Identifica seu tipo de personalidade profissional através de seis categorias:
                </p>
                <ul className="grid md:grid-cols-2 gap-3">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Realista:</span>
                      <span className="text-muted-foreground"> Atividades práticas e técnicas</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Investigativo:</span>
                      <span className="text-muted-foreground"> Pesquisa e análise</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Artístico:</span>
                      <span className="text-muted-foreground"> Criatividade e expressão</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Social:</span>
                      <span className="text-muted-foreground"> Ajuda e interação humana</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Empreendedor:</span>
                      <span className="text-muted-foreground"> Liderança e negócios</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Convencional:</span>
                      <span className="text-muted-foreground"> Organização e estrutura</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Gardner */}
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground">Gardner</h3>
                    <p className="text-sm text-muted-foreground">Inteligências Múltiplas</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Identifica suas inteligências dominantes para potencializar seus talentos naturais:
                </p>
                <ul className="grid md:grid-cols-2 gap-3">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Linguística:</span>
                      <span className="text-muted-foreground"> Comunicação e palavras</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Lógico-Matemática:</span>
                      <span className="text-muted-foreground"> Números e lógica</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Espacial:</span>
                      <span className="text-muted-foreground"> Visualização e design</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Musical:</span>
                      <span className="text-muted-foreground"> Ritmo e harmonia</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Interpessoal:</span>
                      <span className="text-muted-foreground"> Relacionamentos</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">Intrapessoal:</span>
                      <span className="text-muted-foreground"> Autoconhecimento</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* GOPC */}
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground">GOPC</h3>
                    <p className="text-sm text-muted-foreground">Orientação Profissional</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Modelo brasileiro que analisa três dimensões comportamentais no trabalho:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">AK (Atividade-Conhecimento):</span>
                      <span className="text-muted-foreground"> Como você prefere trabalhar</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">PC (Pessoas-Coisas):</span>
                      <span className="text-muted-foreground"> Preferência por interação humana ou técnica</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">TD (Tomada de Decisão):</span>
                      <span className="text-muted-foreground"> Estilo de liderança e autonomia</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-4">
              Como Funciona o Processo
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Um processo simples e intuitivo que leva de 15 a 20 minutos para descobrir 
              sua carreira ideal de forma científica e personalizada.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Responda o Questionário</h3>
                <p className="text-muted-foreground">
                  Complete perguntas sobre personalidade, habilidades e interesses. 
                  Não há respostas certas ou erradas - seja honesto!
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Processamento</h3>
                <p className="text-muted-foreground">
                  Nossos algoritmos analisam suas respostas usando as três metodologias científicas 
                  para criar seu perfil único.
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Pagamento Seguro</h3>
                <p className="text-muted-foreground">
                  Faça o pagamento via PIX de forma rápida e segura para acessar seus resultados 
                  completos e personalizados.
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">
                  4
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Receba os Resultados</h3>
                <p className="text-muted-foreground">
                  Acesse seu relatório completo com análise detalhada, carreiras compatíveis 
                  e orientações personalizadas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-4">
              Pagamento Simples e Seguro
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Utilizamos o Mercado Pago com PIX para garantir transações rápidas, 
              seguras e acessíveis para todos os usuários.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <Zap className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">PIX Instantâneo</h3>
                <p className="text-sm text-muted-foreground mb-4">Pagamento em segundos</p>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">QR Code gerado automaticamente</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Confirmação em tempo real</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Funciona 24/7, incluindo fins de semana</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Sem taxas adicionais para o usuário</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <Shield className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Segurança Total</h3>
                <p className="text-sm text-muted-foreground mb-4">via Mercado Pago</p>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Criptografia de ponta a ponta</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Monitoramento anti-fraude</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Dados protegidos pela LGPD</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Como Funciona o Pagamento?</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Após completar o teste, você verá o valor e o QR Code PIX
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Escaneie o código com seu app bancário ou copie o código PIX
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    O pagamento é confirmado automaticamente em segundos
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-primary font-bold flex-shrink-0">•</span>
                  <span className="text-muted-foreground">
                    Você recebe acesso imediato aos resultados completos
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* What You Get Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-4">
              O Que Você Recebe
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Um relatório completo e personalizado com insights profundos sobre sua 
              personalidade profissional e orientações de carreira.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Análise RIASEC Completa", desc: "Seu código de personalidade profissional com explicações detalhadas" },
                { title: "Inteligências Dominantes", desc: "Suas três inteligências múltiplas mais desenvolvidas" },
                { title: "Perfil GOPC", desc: "Análise comportamental no ambiente de trabalho" },
                { title: "Lista de Carreiras Compatíveis", desc: "Profissões ranqueadas por compatibilidade com seu perfil" },
                { title: "Descrições Detalhadas", desc: "Informações completas sobre cada carreira recomendada" },
                { title: "Gráficos e Visualizações", desc: "Representações visuais dos seus resultados" },
                { title: "Orientações Personalizadas", desc: "Sugestões específicas para seu desenvolvimento profissional" },
                { title: "Acesso Permanente", desc: "Consulte seus resultados quantas vezes quiser" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 bg-card p-4 rounded-lg border border-border">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Por Que Escolher a QualCarreira?
            </h2>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <Clock className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Rápido</h3>
                <p className="text-sm text-muted-foreground">15-20 minutos para resultados completos</p>
              </div>
              <div className="text-center">
                <Brain className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Científico</h3>
                <p className="text-sm text-muted-foreground">Baseado em metodologias validadas</p>
              </div>
              <div className="text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Privado</h3>
                <p className="text-sm text-muted-foreground">Seus dados são protegidos</p>
              </div>
              <div className="text-center">
                <Target className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Preciso</h3>
                <p className="text-sm text-muted-foreground">Resultados personalizados para você</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 gradient-hero">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Pronto Para Descobrir Sua Carreira Ideal?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Junte-se a milhares de pessoas que já descobriram seu caminho profissional 
              com base em ciência e metodologias reconhecidas mundialmente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link to="/comeco">
                <Button size="lg" className="gradient-primary hover:opacity-90 transition-opacity px-8 py-3 text-base font-semibold w-full sm:w-auto">
                  Começar Teste Agora
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 px-8 py-3 text-base font-semibold w-full sm:w-auto">
                  Voltar para a Página Inicial
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              ✓ Sem cadastro inicial • ✓ Resultados em minutos • ✓ Pagamento seguro
            </p>
          </div>
        </section>
      </main>

      <ResultsFooter />
    </>
  );
};

export default ComoFunciona;
