import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { pushToDataLayer } from '@/lib/gtm';
import { trackTestAbandoned, trackScrollDepth } from '@/lib/analytics';

// Hook para rastrear pageviews automaticamente
export const usePageView = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Aguardar um pouco para garantir que o título da página esteja definido
    const timeoutId = setTimeout(() => {
      pushToDataLayer({
        event: 'page_view',
        page_path: location.pathname,
        page_title: typeof document !== 'undefined' ? document.title : '',
      });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location]);
};

// Hook para rastrear abandono de teste
export const useTestAbandonment = (
  isTestActive: boolean,
  testId: string,
  currentQuestion: number,
  answersCount: number,
  totalQuestions: number
) => {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!isTestActive || !testId) return;
    
    const handleBeforeUnload = () => {
      if (answersCount < totalQuestions && !hasTrackedRef.current) {
        trackTestAbandoned(testId, currentQuestion + 1, answersCount, totalQuestions);
        hasTrackedRef.current = true;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && 
          answersCount < totalQuestions && 
          !hasTrackedRef.current) {
        trackTestAbandoned(testId, currentQuestion + 1, answersCount, totalQuestions);
        hasTrackedRef.current = true;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTestActive, testId, currentQuestion, answersCount, totalQuestions]);
};

// Hook para rastrear profundidade de scroll
export const useScrollDepth = () => {
  const trackedDepths = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

      // Track at 25%, 50%, 75%, 100%
      const depths = [25, 50, 75, 100];
      for (const depth of depths) {
        if (scrollPercent >= depth && !trackedDepths.current.has(depth)) {
          trackedDepths.current.add(depth);
          trackScrollDepth(depth);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
};
