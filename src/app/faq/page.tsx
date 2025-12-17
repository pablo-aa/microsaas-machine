"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import Header from "@/components/Header";
import ResultsFooter from "@/components/ResultsFooter";
import { usePageView } from "@/hooks/useGTM";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Quanto tempo leva para fazer o teste?",
    answer:
      "O teste vocacional da QualCarreira leva em média de 5 a 10 minutos para ser concluído. O tempo pode variar de acordo com o seu ritmo.",
  },
  {
    question: "Como o teste vocacional funciona?",
    answer:
      "Nosso teste utiliza metodologias reconhecidas, como RIASEC, Inteligências Múltiplas de Gardner e GOPC, para identificar seus interesses, habilidades e valores. Com base nas suas respostas, geramos um perfil vocacional com áreas de afinidade e sugestões de carreiras compatíveis.",
  },
  {
    question: "Preciso me cadastrar para fazer o teste?",
    answer:
      "Não. A QualCarreira funciona de forma anônima durante o teste. Você só precisa informar seus dados ao final para receber o resultado completo por e-mail.",
  },
  {
    question: "Os resultados são realmente precisos?",
    answer:
      "Sim. O teste da QualCarreira é baseado em referências científicas amplamente utilizadas em orientação profissional. Ainda assim, os resultados têm caráter orientativo e devem ser combinados com reflexão pessoal e, se possível, com apoio de um especialista.",
  },
  {
    question: "Como funciona o acesso ao relatório completo?",
    answer:
      "Após concluir o teste, você pode liberar o relatório detalhado efetuando o pagamento via PIX. O acesso é individual e gerado no próprio site.",
  },
  {
    question: "Posso fazer o teste mais de uma vez?",
    answer:
      "Sim. Você pode refazer o teste sempre que julgar necessário, por exemplo quando estiver passando por mudanças de interesse ou de objetivos.",
  },
  {
    question: "O que inclui o relatório detalhado?",
    answer:
      "O relatório inclui: Seu perfil vocacional principal e secundário; Áreas profissionais compatíveis com suas preferências; Sugestões de cursos e carreiras relacionadas; Interpretação personalizada das suas respostas; Dicas práticas para próximos passos.",
  },
  {
    question: "Quais métodos científicos são utilizados?",
    answer:
      "Combinamos três bases metodológicas: 1) RIASEC, teoria das personalidades profissionais de John Holland; 2) Inteligências Múltiplas de Gardner; 3) GOPC, Modelo de Gosto Ocupacional e Personalidade de Carreira.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Sim. Seguimos a LGPD e adotamos práticas de segurança como HTTPS, controles de acesso e uso dos dados apenas para gerar o seu resultado. Não compartilhamos seus dados com terceiros para fins comerciais.",
  },
  {
    question: "O teste funciona para qualquer idade?",
    answer:
      "Recomendamos a partir de 16 anos. Adultos em transição de carreira também se beneficiam dos resultados.",
  },
  {
    question: "E se eu não concordar com os resultados?",
    answer:
      "Tudo bem. O teste é um instrumento de autoconhecimento. Você pode refazer o teste ou usar as informações como ponto de reflexão sobre seus interesses e possibilidades.",
  },
];

export default function FAQPage() {
  usePageView();

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-primary-dark transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a página inicial
        </Link>

        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Perguntas Frequentes</h1>
          <p className="text-muted-foreground text-lg">
            Tire suas dúvidas sobre o teste vocacional da QualCarreira
          </p>
        </header>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <section className="mt-12 p-8 bg-muted rounded-lg text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground mb-6">
            Nossa equipe está pronta para ajudar você
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Mail className="w-5 h-5 text-primary" />
            <a
              href="mailto:suporte@qualcarreira.com"
              className="text-primary text-lg font-medium hover:underline"
            >
              suporte@qualcarreira.com
            </a>
          </div>
        </section>
      </article>

      <ResultsFooter />
    </main>
  );
}



