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

const STORAGE_KEY = 'assessment_progress';

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
};
