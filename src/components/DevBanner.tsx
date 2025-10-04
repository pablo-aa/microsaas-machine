import { AlertTriangle, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { profiles, generateProfileAnswers, type ProfileType } from "@/lib/testProfiles";

export const DevBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isDev = !window.location.hostname.includes('qualcarreira.com');
  
  if (!isDev) return null;

  const handleProfileTest = (profileType: ProfileType) => {
    // Generate answers based on selected profile
    const profileAnswers = generateProfileAnswers(profileType);
    
    // Store in sessionStorage
    sessionStorage.setItem('testAnswers', JSON.stringify(profileAnswers));
    
    // Navigate to form page
    navigate('/formulario-dados');
  };

  const handleRandomTest = () => {
    // Generate completely random answers for all 60 questions
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
        <div className="absolute right-4 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="flex items-center gap-2"
              >
                🎯 Perfis de Teste
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Selecione um perfil</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.entries(profiles) as [ProfileType, typeof profiles[ProfileType]][]).map(([key, profile]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleProfileTest(key)}
                  className="cursor-pointer flex flex-col items-start py-3"
                >
                  <span className="font-semibold">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">{profile.description}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleRandomTest}
                className="cursor-pointer"
              >
                🎲 Aleatório (não recomendado)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
