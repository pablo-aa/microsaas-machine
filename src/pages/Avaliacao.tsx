import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, CheckCircle, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import LikertScale from "@/components/LikertScale";
import FormularioDados from "./FormularioDados";
import ResultadosCompletos from "./ResultadosCompletos";
import { v4 as uuidv4 } from 'uuid';
import { questions, TOTAL_QUESTIONS } from "@/data/questions";
import { assessmentStorage } from "@/lib/assessmentStorage";
import { useToast } from "@/hooks/use-toast";

type AssessmentStage = 'questions' | 'processing' | 'form' | 'results-loading' | 'results';

interface Answer {
  question_id: number;
  score: number;
}

const Avaliacao = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>();
  const [stage, setStage] = useState<AssessmentStage>('questions');
  const [userData, setUserData] = useState<{name: string; email: string; age: string} | null>(null);
  const [testId, setTestId] = useState<string>('');

  // Generate unique test ID and load saved progress when component mounts
  useEffect(() => {
    const newTestId = id || uuidv4();
    setTestId(newTestId);
    
    // Try to load saved progress
    const savedProgress = assessmentStorage.loadProgress(newTestId);
    if (savedProgress) {
      setAnswers(savedProgress.answers);
      setCurrentQuestion(savedProgress.currentQuestion);
      
      // Set selected answer for current question
      const currentQuestionData = questions[savedProgress.currentQuestion];
      const currentAnswer = savedProgress.answers.find(a => a.question_id === currentQuestionData?.id);
      setSelectedAnswer(currentAnswer?.score);
      
      toast({
        title: "Progresso recuperado",
        description: `Continuando da questão ${savedProgress.currentQuestion + 1}/${TOTAL_QUESTIONS}`,
      });
    }
  }, [id]);

  const totalQuestions = TOTAL_QUESTIONS;
  const progress = ((currentQuestion + (selectedAnswer ? 1 : 0)) / totalQuestions) * 100;
  const answeredQuestions = answers.length;

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer === undefined) return;

    const newAnswers = [...answers];
    const currentQuestionData = questions[currentQuestion];
    
    // Update or add the answer for current question
    const existingIndex = newAnswers.findIndex(a => a.question_id === currentQuestionData.id);
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { question_id: currentQuestionData.id, score: selectedAnswer };
    } else {
      newAnswers.push({ question_id: currentQuestionData.id, score: selectedAnswer });
    }
    setAnswers(newAnswers);

    if (currentQuestion < totalQuestions - 1) {
      const nextQuestionIndex = currentQuestion + 1;
      setCurrentQuestion(nextQuestionIndex);
      
      // Save progress to localStorage
      assessmentStorage.saveProgress(testId, newAnswers, nextQuestionIndex);
      
      // Check if next question already has an answer
      const nextQuestionData = questions[nextQuestionIndex];
      const nextAnswer = newAnswers.find(a => a.question_id === nextQuestionData.id);
      setSelectedAnswer(nextAnswer?.score);
    } else {
      // Assessment completed - clear progress and show processing loading
      assessmentStorage.clearProgress(testId);
      setStage('processing');
      setTimeout(() => {
        setStage('form');
      }, 2000); // 2 second loading
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Find answer for previous question
      const prevQuestionData = questions[currentQuestion - 1];
      const prevAnswer = answers.find(a => a.question_id === prevQuestionData.id);
      setSelectedAnswer(prevAnswer?.score);
    }
  };

  const handleRestart = () => {
    assessmentStorage.clearProgress(testId);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(undefined);
    setStage('questions');
    setUserData(null);
  };

  const handleAutoFill = () => {
    const randomAnswers: Answer[] = questions.map(q => ({
      question_id: q.id,
      score: Math.floor(Math.random() * 5) + 1 // Random score between 1-5
    }));
    
    setAnswers(randomAnswers);
    setCurrentQuestion(totalQuestions - 1);
    setSelectedAnswer(randomAnswers[totalQuestions - 1].score);
    
    toast({
      title: "Respostas preenchidas",
      description: "Todas as 60 questões foram respondidas aleatoriamente para teste",
    });
  };

  const handleFormSubmit = (data: {name: string; email: string; age: string}) => {
    setUserData(data);
    setStage('results-loading');
    
    // Show loading then results
    setTimeout(() => {
      setStage('results');
    }, 2000); // 2 second loading
  };

  const handleDesbloquear = () => {
    // TODO: Implement unlock logic
    console.log('Desbloquear resultados:', userData);
  };

  // Processing stage
  if (stage === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Calculando seus resultados...</h2>
          <p className="text-muted-foreground">Analisando suas respostas com nossa IA avançada</p>
        </div>
      </div>
    );
  }

  // Form stage
  if (stage === 'form') {
    return (
      <FormularioDados 
        onSubmit={handleFormSubmit}
        isLoading={false}
      />
    );
  }

  // Results loading stage
  if (stage === 'results-loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Preparando seus resultados...</h2>
          <p className="text-muted-foreground">Criando seu perfil vocacional personalizado</p>
        </div>
      </div>
    );
  }

  // Results stage
  if (stage === 'results' && userData) {
    return (
      <ResultadosCompletos 
        userName={userData.name}
        userEmail={userData.email}
        testId={testId}
        onDesbloquear={handleDesbloquear}
      />
    );
  }

  // Questions stage - original assessment interface
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">QC</span>
              </div>
              <span className="text-xl font-bold text-foreground">Qual Carreira</span>
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
              <div className="flex items-center space-x-2 text-primary">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span>{answeredQuestions} respondidas</span>
              </div>
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
                {questions[currentQuestion].text}
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

            {/* DEV ONLY: Auto-fill button */}
            {import.meta.env.DEV && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAutoFill}
                className="ml-4"
              >
                🎲 Preencher Aleatoriamente
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {currentQuestion === totalQuestions - 1 && answers.length === totalQuestions - 1 && selectedAnswer ? (
              <Button
                onClick={handleNext}
                className="gradient-primary hover:opacity-90 px-8"
              >
                Finalizar
              </Button>
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