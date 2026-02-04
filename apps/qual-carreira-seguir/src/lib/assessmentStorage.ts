import type { ContextualAnswers } from "@/data/contextualQuestions";
import { getVisibleQuestions } from "@/data/contextualQuestions";

interface Answer {
  question_id: number;
  score: number;
}

interface AssessmentProgress {
  testId: string;
  answers: Answer[];
  currentQuestion: number;
  lastUpdated: string;
}

export type AssessmentStage = "questions" | "processing" | "contextual_questionnaire" | "form";

export interface AssessmentFlowState {
  testId: string;
  answers: Answer[];
  currentQuestion: number;
  contextualAnswers?: ContextualAnswers;
  contextualQuestionnaireCompleted?: boolean;
  formData?: {
    name: string;
    email: string;
    age: string;
  };
  currentStage: AssessmentStage;
  experimentVariant?: string; // "enabled" | "disabled" - NOVO
  lastUpdated: string;
  version: number;
}

const STORAGE_KEY = 'assessment_progress';
const FLOW_STATE_KEY = 'assessment_flow_state';
const CURRENT_VERSION = 1;

// ==================== Helper Functions ====================

/**
 * Valida estrutura do AssessmentFlowState
 */
function validateFlowState(data: any): AssessmentFlowState | null {
  if (!data || typeof data !== 'object') return null;
  
  // Validações obrigatórias
  if (!data.testId || typeof data.testId !== 'string') return null;
  if (!Array.isArray(data.answers)) return null;
  if (typeof data.currentQuestion !== 'number' || data.currentQuestion < 0) return null;
  if (!data.currentStage || !['questions', 'processing', 'contextual_questionnaire', 'form'].includes(data.currentStage)) return null;
  if (!data.lastUpdated || typeof data.lastUpdated !== 'string') return null;
  if (typeof data.version !== 'number') return null;
  
  // Validações opcionais
  if (data.contextualAnswers && typeof data.contextualAnswers !== 'object') return null;
  if (data.formData && typeof data.formData !== 'object') return null;
  if (data.experimentVariant && !['enabled', 'disabled'].includes(data.experimentVariant)) return null; // NOVO
  
  // Validar que stage não é "processing" (temporário, não deve ser salvo)
  if (data.currentStage === 'processing') {
    // Corrigir automaticamente baseado no estado
    if (data.formData?.name && data.formData?.email && data.formData?.age && data.contextualQuestionnaireCompleted) {
      data.currentStage = 'form';
    } else if (data.contextualAnswers) {
      data.currentStage = 'contextual_questionnaire';
    } else if (data.answers.length === 60) {
      // Considerar variante do experimento ao corrigir stage
      if (data.experimentVariant === "disabled" && !data.contextualAnswers) {
        data.currentStage = 'form';
      } else {
        data.currentStage = 'contextual_questionnaire';
      }
    } else {
      data.currentStage = 'questions';
    }
  }
  
  return data as AssessmentFlowState;
}

/**
 * Determina stage baseado em dados antigos (para migração)
 */
function determineStageFromOldData(
  oldProgress: AssessmentProgress | null,
  oldContextual: ContextualQuestionnaireProgress | null
): AssessmentStage {
  if (oldContextual?.answers && Object.keys(oldContextual.answers).length > 0) {
    // Validar se está completo
    try {
      const visible = getVisibleQuestions(oldContextual.answers as Partial<ContextualAnswers>);
      const answered = Object.keys(oldContextual.answers).filter(key => {
        const answer = oldContextual.answers[key];
        if (Array.isArray(answer)) return answer.length > 0;
        return answer !== undefined && answer !== null && String(answer).trim() !== '';
      });
      
      if (answered.length === visible.length && visible.length > 0) {
        return 'form'; // Questionário completo, deve estar no form
      }
      return 'contextual_questionnaire'; // Questionário incompleto
    } catch (error) {
      console.error('[determineStageFromOldData] Error validating contextual answers:', error);
      // Se erro na validação, assumir incompleto
      return 'contextual_questionnaire';
    }
  }
  
  if (oldProgress && oldProgress.answers.length === 60) {
    return 'contextual_questionnaire'; // 60 questões completas, próximo passo
  }
  
  return 'questions';
}

/**
 * Estado inicial para novo teste
 */
function getInitialFlowState(testId: string): AssessmentFlowState {
  return {
    testId,
    answers: [],
    currentQuestion: 0,
    currentStage: 'questions',
    lastUpdated: new Date().toISOString(),
    version: CURRENT_VERSION,
  };
}

/**
 * Determina stage baseado no estado (determinístico)
 */
function determineStage(state: Partial<AssessmentFlowState>): AssessmentStage {
  // 1. Se stage salvo é válido e não é "processing", usar
  if (state.currentStage && 
      state.currentStage !== 'processing' && 
      ['questions', 'contextual_questionnaire', 'form'].includes(state.currentStage)) {
    return state.currentStage;
  }
  
  // 2. Se formData existe e contextualQuestionnaireCompleted, está no form
  if (state.formData?.name && 
      state.formData?.email && 
      state.formData?.age && 
      state.contextualQuestionnaireCompleted) {
    return 'form';
  }
  
  // 3. Se contextualAnswers existe, validar se está completo
  if (state.contextualAnswers) {
    try {
      const visible = getVisibleQuestions(state.contextualAnswers);
      const answered = Object.keys(state.contextualAnswers).filter(key => {
        const answer = state.contextualAnswers![key as keyof ContextualAnswers];
        if (Array.isArray(answer)) return answer.length > 0;
        return answer !== undefined && answer !== null && String(answer).trim() !== '';
      });
      
      if (answered.length === visible.length && visible.length > 0) {
        return 'form'; // Completo, deve estar no form
      }
      return 'contextual_questionnaire'; // Incompleto
    } catch (error) {
      console.error('[determineStage] Error validating contextual answers:', error);
      // Se erro, assumir incompleto
      return 'contextual_questionnaire';
    }
  }
  
  // 4. Se 60 questões completas, verificar variante do experimento
  if (state.answers?.length === 60) {
    // Se variante é "disabled" e não tem contextualAnswers, ir direto para form
    if (state.experimentVariant === "disabled" && !state.contextualAnswers) {
      return 'form';
    }
    // Se tem contextualAnswers, já está no fluxo (compatibilidade com estado antigo)
    if (state.contextualAnswers) {
      // Verificar se está completo ou não
      try {
        const visible = getVisibleQuestions(state.contextualAnswers);
        const answered = Object.keys(state.contextualAnswers).filter(key => {
          const answer = state.contextualAnswers![key as keyof ContextualAnswers];
          if (Array.isArray(answer)) return answer.length > 0;
          return answer !== undefined && answer !== null && String(answer).trim() !== '';
        });
        return answered.length === visible.length && visible.length > 0 ? 'form' : 'contextual_questionnaire';
      } catch {
        return 'contextual_questionnaire';
      }
    }
    // Caso contrário, ir para contextual_questionnaire (compatibilidade com estado antigo sem variante)
    return 'contextual_questionnaire';
  }
  
  // 5. Default
  return 'questions';
}

/**
 * Migra dados do formato antigo para o novo formato
 */
function migrateOldData(testId: string, storage: typeof assessmentStorage): AssessmentFlowState | null {
  try {
    // Tentar carregar dados antigos
    const oldProgress = storage.loadProgress(testId);
    const oldContextual = contextualQuestionnaireStorage.loadProgress(testId);
    
    if (!oldProgress && !oldContextual) return null;
    
    // Mesclar dados antigos em novo formato
    const migrated: Partial<AssessmentFlowState> = {
      testId,
      answers: oldProgress?.answers || [],
      currentQuestion: oldProgress?.currentQuestion || 0,
      contextualAnswers: oldContextual?.answers as ContextualAnswers | undefined,
      currentStage: determineStageFromOldData(oldProgress, oldContextual),
      lastUpdated: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    
    const validated = validateFlowState(migrated);
    if (validated) {
      // Salvar formato novo
      try {
        localStorage.setItem(`${FLOW_STATE_KEY}_${testId}`, JSON.stringify(validated));
        
        // Limpar formato antigo após migração bem-sucedida
        if (oldProgress) {
          storage.clearProgress(testId);
        }
        if (oldContextual) {
          contextualQuestionnaireStorage.clearProgress(testId);
        }
        
        return validated;
      } catch (error) {
        console.error('[migrateOldData] Error saving migrated data:', error);
        return null;
      }
    } else {
      console.error('[migrateOldData] Migrated data validation failed');
      return null;
    }
  } catch (error) {
    console.error('[migrateOldData] Error migrating old data:', error);
    return null;
  }
}

// ==================== Assessment Storage ====================

export const assessmentStorage = {
  /**
   * Save assessment progress to localStorage
   */
  saveProgress(testId: string, answers: Answer[], currentQuestion: number): void {
    try {
      const progress: AssessmentProgress = {
        testId,
        answers,
        currentQuestion,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY}_${testId}`, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving assessment progress:', error);
    }
  },

  /**
   * Load assessment progress from localStorage
   */
  loadProgress(testId: string): AssessmentProgress | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${testId}`);
      if (!stored) return null;
      
      const progress: AssessmentProgress = JSON.parse(stored);
      
      // Check if progress is from last 24 hours
      const lastUpdated = new Date(progress.lastUpdated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 24) {
        // Progress too old, clear it
        this.clearProgress(testId);
        return null;
      }
      
      return progress;
    } catch (error) {
      console.error('Error loading assessment progress:', error);
      return null;
    }
  },

  /**
   * Clear assessment progress from localStorage
   */
  clearProgress(testId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${testId}`);
    } catch (error) {
      console.error('Error clearing assessment progress:', error);
    }
  },

  /**
   * Check if there is saved progress for a test
   */
  hasProgress(testId: string): boolean {
    return !!localStorage.getItem(`${STORAGE_KEY}_${testId}`);
  },

  /**
   * Operação atômica: atualiza apenas os campos especificados (read-modify-write)
   */
  updateFlowState(testId: string, updates: Partial<AssessmentFlowState>): void {
    try {
      // Validar testId antes de prosseguir
      if (!testId || testId.trim() === '') {
        console.error('[updateFlowState] Invalid testId provided');
        return;
      }
      
      // 1. Ler estado atual
      const current = this.loadFlowState(testId) || getInitialFlowState(testId);
      
      // 2. Mesclar atualizações
      const merged: Partial<AssessmentFlowState> = {
        ...current,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      
      // Garantir que testId está presente
      merged.testId = testId;
      
      // 3. Validar
      const validated = validateFlowState(merged);
      if (!validated) {
        console.error('[updateFlowState] Validation failed, skipping save. Updates:', updates);
        return;
      }
      
      // 4. Salvar
      localStorage.setItem(`${FLOW_STATE_KEY}_${testId}`, JSON.stringify(validated));
    } catch (error) {
      console.error('[updateFlowState] Error:', error);
    }
  },
  
  /**
   * Carrega estado completo com migração automática
   */
  loadFlowState(testId: string): AssessmentFlowState | null {
    try {
      // Tentar carregar formato novo
      const stored = localStorage.getItem(`${FLOW_STATE_KEY}_${testId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = validateFlowState(parsed);
        
        if (validated) {
          // Verificar TTL
          const lastUpdated = new Date(validated.lastUpdated);
          const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
          if (hoursSinceUpdate > 24) {
            this.clearFlowState(testId);
            return null;
          }
          
          return validated;
        } else {
          // Dados inválidos, limpar
          console.warn('[loadFlowState] Invalid data found, clearing');
          this.clearFlowState(testId);
          return null;
        }
      }
      
      // Se não encontrou formato novo, tentar migrar dados antigos
      return migrateOldData(testId, this);
    } catch (error) {
      console.error('[loadFlowState] Error:', error);
      // Se erro ao carregar, limpar e retornar null
      try {
        localStorage.removeItem(`${FLOW_STATE_KEY}_${testId}`);
      } catch (clearError) {
        console.error('[loadFlowState] Error clearing corrupted data:', clearError);
      }
      return null;
    }
  },
  
  /**
   * Determina stage baseado no estado (determinístico)
   */
  determineStage(state: Partial<AssessmentFlowState>): AssessmentStage {
    return determineStage(state);
  },
  
  /**
   * Estado inicial para novo teste
   */
  getInitialFlowState(testId: string): AssessmentFlowState {
    return getInitialFlowState(testId);
  },
  
  /**
   * Limpa todo o estado do fluxo
   */
  clearFlowState(testId: string): void {
    try {
      localStorage.removeItem(`${FLOW_STATE_KEY}_${testId}`);
      // Limpar também dados antigos para garantir
      this.clearProgress(testId);
      contextualQuestionnaireStorage.clearProgress(testId);
    } catch (error) {
      console.error('[clearFlowState] Error:', error);
    }
  },
};

// ==================== Contextual Questionnaire Storage ====================

const CONTEXTUAL_STORAGE_KEY = 'contextual_questionnaire';

interface ContextualQuestionnaireProgress {
  testId: string;
  answers: Record<string, string | string[]>;
  lastUpdated: string;
}

export const contextualQuestionnaireStorage = {
  /**
   * Save contextual questionnaire progress to localStorage
   */
  saveProgress(testId: string, answers: Record<string, string | string[]>): void {
    try {
      const progress: ContextualQuestionnaireProgress = {
        testId,
        answers,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`${CONTEXTUAL_STORAGE_KEY}_${testId}`, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving contextual questionnaire progress:', error);
    }
  },

  /**
   * Load contextual questionnaire progress from localStorage
   */
  loadProgress(testId: string): ContextualQuestionnaireProgress | null {
    try {
      const stored = localStorage.getItem(`${CONTEXTUAL_STORAGE_KEY}_${testId}`);
      if (!stored) return null;
      
      const progress: ContextualQuestionnaireProgress = JSON.parse(stored);
      
      // Check if progress is from last 24 hours
      const lastUpdated = new Date(progress.lastUpdated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 24) {
        // Progress too old, clear it
        this.clearProgress(testId);
        return null;
      }
      
      return progress;
    } catch (error) {
      console.error('Error loading contextual questionnaire progress:', error);
      return null;
    }
  },

  /**
   * Clear contextual questionnaire progress from localStorage
   */
  clearProgress(testId: string): void {
    try {
      localStorage.removeItem(`${CONTEXTUAL_STORAGE_KEY}_${testId}`);
    } catch (error) {
      console.error('Error clearing contextual questionnaire progress:', error);
    }
  },

  /**
   * Check if there is saved progress for a contextual questionnaire
   */
  hasProgress(testId: string): boolean {
    return !!localStorage.getItem(`${CONTEXTUAL_STORAGE_KEY}_${testId}`);
  },
};
