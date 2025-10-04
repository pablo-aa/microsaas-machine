// Test profiles for automated testing
// Each profile generates responses based on RIASEC categories

import { questions } from "@/data/questions";

export type ProfileType = 'artistic' | 'investigative' | 'social' | 'enterprising' | 'realistic';

interface ProfileConfig {
  name: string;
  description: string;
  riasecScores: {
    R: number; // Realista
    I: number; // Investigativo
    A: number; // Artístico
    S: number; // Social
    E: number; // Empreendedor
    C: number; // Convencional
  };
}

export const profiles: Record<ProfileType, ProfileConfig> = {
  artistic: {
    name: "Perfil Artístico",
    description: "A > S > I - Designer, Artista, Arquiteto",
    riasecScores: { R: 1.5, I: 2.5, A: 4.5, S: 3.5, E: 2.5, C: 1.5 }
  },
  investigative: {
    name: "Perfil Investigativo",
    description: "I > S > C - Pesquisador, Cientista, Médico",
    riasecScores: { R: 2.5, I: 4.5, A: 2.5, S: 3.5, E: 2.5, C: 3.5 }
  },
  social: {
    name: "Perfil Social",
    description: "S > A > E - Professor, Psicólogo, Terapeuta",
    riasecScores: { R: 1.5, I: 2.5, A: 3.5, S: 4.5, E: 3.5, C: 2.5 }
  },
  enterprising: {
    name: "Perfil Empreendedor",
    description: "E > R > S - Empresário, Gestor, Vendedor",
    riasecScores: { R: 3.5, I: 2.5, A: 2.5, S: 3.5, E: 4.5, C: 3.5 }
  },
  realistic: {
    name: "Perfil Realista",
    description: "R > I > C - Engenheiro Mecânico, Técnico",
    riasecScores: { R: 4.5, I: 3.5, A: 1.5, S: 2.5, E: 2.5, C: 3.5 }
  }
};

// Generate answers based on profile
export const generateProfileAnswers = (profileType: ProfileType): Record<number, number> => {
  const profile = profiles[profileType];
  const answers: Record<number, number> = {};
  
  questions.forEach(question => {
    let score = 3; // Default neutral score
    
    // Adjust score based on RIASEC category
    if (question.riasec) {
      const categoryScore = profile.riasecScores[question.riasec as keyof typeof profile.riasecScores];
      // Add some randomness (±0.5) to make it more realistic
      const randomAdjustment = (Math.random() - 0.5);
      score = Math.round(Math.max(1, Math.min(5, categoryScore + randomAdjustment)));
    } else {
      // For questions without RIASEC, use slight variation around neutral
      score = Math.round(2 + Math.random() * 2); // 2-4 range
    }
    
    answers[question.id] = score;
  });
  
  return answers;
};
