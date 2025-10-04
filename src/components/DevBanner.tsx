import { AlertTriangle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

export const DevBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isDev = !window.location.hostname.includes('qualcarreira.com');
  
  if (!isDev) return null;

  const handleRandomTest = () => {
    // Generate random answers for all 60 questions
    const randomAnswers: Record<number, number> = {};
    for (let i = 1; i <= 60; i++) {
      randomAnswers[i] = Math.floor(Math.random() * 5) + 1; // 1 to 5
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('testAnswers', JSON.stringify(randomAnswers));
    
    // Navigate to form page
    navigate('/formulario-dados');
  };

  const isOnAssessmentPage = location.pathname === '/avaliacao';

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-center font-medium flex items-center justify-center gap-2 relative">
      <AlertTriangle className="w-4 h-4" />
      <span>AMBIENTE DE DESENVOLVIMENTO</span>
      <AlertTriangle className="w-4 h-4" />
      
      {isOnAssessmentPage && (
        <Button
          onClick={handleRandomTest}
          size="sm"
          variant="secondary"
          className="ml-4 absolute right-4"
        >
          🎲 Responder Aleatoriamente
        </Button>
      )}
    </div>
  );
};
