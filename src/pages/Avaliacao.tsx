import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import LikertScale from "@/components/LikertScale";

// Sample questions for the assessment
const questions = [
  "Prefiro atividades que envolvam ajudar pessoas.",
  "Gosto de trabalhar com números e dados.",
  "Me sinto confortável falando em público."
];

const Avaliacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>();

  const totalQuestions = questions.length;
  const progress = ((currentQuestion + (selectedAnswer ? 1 : 0)) / totalQuestions) * 100;
  const answeredQuestions = answers.length;

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer === undefined) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(newAnswers[currentQuestion + 1]);
    } else {
      // Assessment completed - for now just show restart option
      alert("Teste concluído! Por enquanto, apenas a opção de recomeçar está disponível.");
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-foreground">Carrerium</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Questão {currentQuestion + 1}/{totalQuestions}
            </h1>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="text-primary">⭕ {answeredQuestions} respondidas</span>
              <span>{Math.round(progress)}% Completo</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="mb-12" />

        {/* Question Card */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            {/* Section Title */}
            <div className="bg-primary text-white text-center py-3 px-6 rounded-lg mb-8">
              <h2 className="text-lg font-semibold">Avalie a afirmação</h2>
            </div>

            {/* Question */}
            <div className="text-center mb-12">
              <p className="text-xl text-foreground font-medium leading-relaxed">
                {questions[currentQuestion]}
              </p>
            </div>

            {/* Likert Scale */}
            <LikertScale 
              onSelect={handleAnswerSelect}
              selectedValue={selectedAnswer}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} de {totalQuestions}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {currentQuestion === totalQuestions - 1 && answers.length === totalQuestions - 1 && selectedAnswer ? (
              <>
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="px-6"
                >
                  Recomeçar
                </Button>
                <Button
                  onClick={handleNext}
                  className="gradient-primary hover:opacity-90 px-8"
                >
                  Finalizar
                </Button>
              </>
            ) : (
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === undefined}
                className="gradient-primary hover:opacity-90 px-8"
              >
                Próxima →
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Avaliacao;