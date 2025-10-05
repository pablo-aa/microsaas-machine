import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import ResultsFooter from "@/components/ResultsFooter";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageView } from "@/hooks/useGTM";

const PoliticaDePrivacidade = () => {
  usePageView();
  
  return (
    <>
      <Helmet>
        <title>Política de Privacidade | QualCarreira - Proteção de Dados LGPD</title>
        <meta 
          name="description" 
          content="Conheça nossa Política de Privacidade e como a QualCarreira protege seus dados pessoais conforme a LGPD. Transparência e segurança para você." 
        />
        <meta property="og:title" content="Política de Privacidade | QualCarreira" />
        <meta property="og:description" content="Conheça nossa Política de Privacidade e como a QualCarreira protege seus dados pessoais conforme a LGPD." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://qualcarreira.com/politica-de-privacidade" />
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
            <h1 className="text-4xl font-bold text-foreground mb-4">Política de Privacidade</h1>
            <p className="text-muted-foreground">
              A QualCarreira está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações ao utilizar o teste vocacional e demais recursos disponíveis em qualcarreira.com.
            </p>
            <p className="text-muted-foreground mt-2">
              Ao usar nossos serviços, você concorda com as práticas descritas abaixo.
            </p>
          </header>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Informações que coletamos</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">1.1 Informações fornecidas por você</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Coletamos as informações que você insere voluntariamente:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Informações básicas como nome, e-mail e idade</li>
                <li>Respostas do teste vocacional</li>
                <li>Dados necessários para faturamento e confirmação de pagamento quando aplicável</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">1.2 Informações coletadas automaticamente</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Podemos coletar automaticamente, por meio de cookies, pixels e tecnologias similares, inclusive via Google Tag Manager:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Dados analíticos como páginas visitadas, cliques e tempo de permanência</li>
                <li>Informações de dispositivo e navegador</li>
                <li>Dados de desempenho do site</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Uso de cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Utilizamos cookies para operar, medir e melhorar o site:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Cookies essenciais:</strong> necessários para o funcionamento do site</li>
                <li><strong>Cookies analíticos:</strong> para entender o uso e aprimorar a experiência</li>
                <li><strong>Cookies de marketing:</strong> para tornar comunicações e anúncios mais relevantes</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Você pode gerenciar preferências no banner de consentimento e nos ajustes do navegador. A retirada do consentimento para cookies não essenciais não afeta cookies estritamente necessários.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Como usamos suas informações</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Utilizamos seus dados para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Gerar seu relatório vocacional personalizado</li>
                <li>Enviar seu relatório por e-mail e manter comunicações operacionais</li>
                <li>Processar pagamentos de forma segura quando houver contratação</li>
                <li>Realizar análises agregadas para melhorar produtos e conteúdo</li>
                <li>Fornecer suporte ao cliente e cumprir obrigações legais</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Bases legais típicas: execução de contrato, cumprimento de obrigação legal, legítimo interesse e consentimento quando aplicável.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Pagamentos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Quando o acesso ao resultado completo for pago, o processamento é efetuado de forma segura via PIX. Dados sensíveis de pagamento não são armazenados pela QualCarreira. Registramos somente informações necessárias para conciliação e suporte.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Compartilhamento de informações</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Podemos compartilhar dados com prestadores que nos ajudam a operar o serviço, sempre com contratos e medidas de segurança adequadas:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Processadores de pagamento para liquidação e conciliação</li>
                <li>Serviços de analytics para métricas agregadas</li>
                <li>Provedores de e-mail e infraestrutura de nuvem</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Não vendemos seus dados pessoais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Seus direitos sob a LGPD</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Você pode, a qualquer tempo e mediante requisição:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Confirmar a existência de tratamento</li>
                <li>Acessar seus dados</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
                <li>Solicitar portabilidade a outro fornecedor, quando aplicável</li>
                <li>Solicitar eliminação de dados tratados com base no consentimento</li>
                <li>Revogar consentimento e se opor a tratamentos</li>
                <li>Solicitar revisão de decisões automatizadas</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Para exercer seus direitos, entre em contato em <a href="mailto:suporte@qualcarreira.com" className="text-primary hover:underline">suporte@qualcarreira.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Segurança da informação</h2>
              <p className="text-muted-foreground leading-relaxed">
                Adotamos medidas técnicas e administrativas proporcionais ao risco, incluindo conexões seguras HTTPS, controles de acesso e registro de eventos. Nenhuma transmissão pela internet é totalmente segura, mas trabalhamos para proteger seus dados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Retenção de dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos seus dados apenas pelo tempo necessário para as finalidades informadas, incluindo cumprimento de obrigações legais e resolução de disputas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Crianças e adolescentes</h2>
              <p className="text-muted-foreground leading-relaxed">
                O serviço é destinado a pessoas com 16 anos ou mais. Se você for responsável por um menor de 16 anos e acredita que houve fornecimento indevido de dados, entre em contato conosco.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Atualizações desta política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política periodicamente. Quando houver alterações relevantes, avisaremos no site e, quando aplicável, por e-mail.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Data de vigência: 05 de outubro de 2025.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Encarregado e contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                E-mail: <a href="mailto:suporte@qualcarreira.com" className="text-primary hover:underline">suporte@qualcarreira.com</a>
              </p>
            </section>
          </div>
        </article>

        <ResultsFooter />
      </main>
    </>
  );
};

export default PoliticaDePrivacidade;
