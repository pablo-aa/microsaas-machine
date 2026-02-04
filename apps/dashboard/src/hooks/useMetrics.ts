// Custom hook for fetching and transforming metrics data
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DailyMetrics } from '@/types/metrics';
import { fetchDailyMetrics, DayMetricResponse, MetricsApiResponse } from '@/services/supabase';
import { getCache, setCache, getCacheKey, clearCache } from '@/utils/cache';

/**
 * Transform API response to frontend format
 */
function transformMetrics(apiData: DayMetricResponse[]): DailyMetrics[] {
  return apiData.map(day => {
    const formsSubmitted = day.forms_submitted;
    const paymentStarted = day.payments_initiated;
    const paymentApproved = day.payments_approved;
    const revenue = day.revenue;
    const adSpend = day.cost;
    
    // Calculate conversions (percentages)
    const conversionFormToStart = formsSubmitted > 0 
      ? Math.round((paymentStarted / formsSubmitted) * 100 * 100) / 100
      : 0;
    
    const conversionStartToApproved = paymentStarted > 0 
      ? Math.round((paymentApproved / paymentStarted) * 100 * 100) / 100
      : 0;
    
    const conversionFormToApproved = formsSubmitted > 0 
      ? Math.round((paymentApproved / formsSubmitted) * 100 * 100) / 100
      : 0;
    
    // ROAS from API or calculate if null
    const roas = day.roas ?? (adSpend > 0 ? revenue / adSpend : 0);

    return {
      date: day.date,
      revenue: Math.round(revenue * 100) / 100,
      adSpend: Math.round(adSpend * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      formsSubmitted,
      paymentStarted,
      paymentApproved,
      conversionFormToStart,
      conversionStartToApproved,
      conversionFormToApproved,
    };
  });
}

/**
 * Remove prefixo de dias completamente vazios (sem receita, gasto ou eventos)
 * Útil para o caso de "Histórico", onde o range é maior que o período real de dados.
 */
function trimLeadingEmptyDays(data: DailyMetrics[]): DailyMetrics[] {
  const firstIndexWithData = data.findIndex((d) => {
    return (
      d.revenue !== 0 ||
      d.adSpend !== 0 ||
      d.formsSubmitted !== 0 ||
      d.paymentStarted !== 0 ||
      d.paymentApproved !== 0
    );
  });

  if (firstIndexWithData <= 0) {
    // -1 (nenhum dia com dado) ou 0 (já começa com dado) → retorna como está
    return data;
  }

  return data.slice(firstIndexWithData);
}

interface UseMetricsResult {
  metrics: DailyMetrics[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch metrics for a date range
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @param enabled - Whether to fetch data (default: true)
 */
export function useMetrics(
  startDate: string,
  endDate: string,
  enabled: boolean = true
): UseMetricsResult {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const currentRequestRef = useRef<string | null>(null);

  // Hoje no fuso horário do Brasil (GMT-3)
  const todayBrazilISO = useMemo(() => {
    const now = new Date();
    const brazilOffset = -3 * 60; // minutos
    const brazilTime = new Date(
      now.getTime() + (now.getTimezoneOffset() + brazilOffset) * 60000
    );
    return brazilTime.toISOString().split('T')[0];
  }, []);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Create unique request ID for this fetch
    const requestId = `${startDate}_${endDate}_${Date.now()}`;
    currentRequestRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const endsToday = endDate === todayBrazilISO;
      
      // Calculate number of days in range to decide if we should trim empty days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      // Only trim empty days for ranges > 30 days (like "Histórico")
      const shouldTrimEmptyDays = daysInRange > 30;

      // Caso 1: range termina ANTES de hoje -> cache simples por range (24h)
      if (!endsToday) {
        const cacheKey = getCacheKey(startDate, endDate);
        const cached = getCache<MetricsApiResponse>(cacheKey);

        if (cached) {
          console.log('[useMetrics] Using cached metrics data (past range)', {
            startDate,
            endDate,
            cachedDays: cached.days.map(d => ({ date: d.date, revenue: d.revenue })),
          });
          // CRITICAL: Filter to only include days in the requested range
          const filteredDays = cached.days.filter(d => d.date >= startDate && d.date <= endDate);
          
          // Safety check: if filtered days don't match expected range, clear cache and refetch
          if (filteredDays.length === 0 || (daysInRange === 1 && filteredDays.length !== 1)) {
            console.warn('[useMetrics] Cache data mismatch, clearing cache and refetching', {
              expectedRange: { startDate, endDate },
              cachedDays: cached.days.length,
              filteredDays: filteredDays.length,
            });
            clearCache(cacheKey);
            // Fall through to fetch fresh data
          } else {
            const transformed = transformMetrics(filteredDays);
            const finalData = shouldTrimEmptyDays ? trimLeadingEmptyDays(transformed) : transformed;
            console.log('[useMetrics] Transformed data (filtered to range):', finalData.map(d => ({ date: d.date, revenue: d.revenue })));
            
            // Only update if this is still the current request
            if (currentRequestRef.current === requestId) {
              setMetrics(finalData);
              setLoading(false);
            }
            return;
          }
        }

        console.log('[useMetrics] No cache for past range, fetching from API', {
          startDate,
          endDate,
        });
        const data = await fetchDailyMetrics(startDate, endDate);
        console.log('[useMetrics] Raw API response:', {
          days: data.days.map(d => ({ date: d.date, revenue: d.revenue, cost: d.cost })),
          totals: data.totals,
        });
        setCache(cacheKey, data);

        // CRITICAL: Filter to only include days in the requested range (safety check)
        const filteredDays = data.days.filter(d => d.date >= startDate && d.date <= endDate);
        const transformed = transformMetrics(filteredDays);
        console.log('[useMetrics] Transformed data (filtered to range):', transformed.map(d => ({ date: d.date, revenue: d.revenue, adSpend: d.adSpend })));
        const finalData = shouldTrimEmptyDays ? trimLeadingEmptyDays(transformed) : transformed;
        console.log('[useMetrics] Final data after trim:', finalData.map(d => ({ date: d.date, revenue: d.revenue })));
        
        // Only update if this is still the current request
        if (currentRequestRef.current === requestId) {
          setMetrics(finalData);
          setLoading(false);
        }
        return;
      }

      // Caso 2: range termina HOJE -> cache incremental até ontem
      // BUT: if range is just "today", don't use incremental cache - fetch directly
      if (startDate === endDate && endDate === todayBrazilISO) {
        // Single day = today: fetch directly, no cache logic
        console.log('[useMetrics] Fetching single day (today) directly', {
          date: todayBrazilISO,
        });
        const todayData = await fetchDailyMetrics(todayBrazilISO, todayBrazilISO);
        
        // CRITICAL: Filter to only include the requested day
        const filteredDays = todayData.days.filter(d => d.date === todayBrazilISO);
        const transformed = transformMetrics(filteredDays);
        
        // Only update if this is still the current request
        if (currentRequestRef.current === requestId) {
          setMetrics(transformed);
          setLoading(false);
        }
        return;
      }

      const yesterday = new Date(todayBrazilISO);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString().split('T')[0];

      // Cache apenas da parte histórica até ontem
      const historyCacheKey = getCacheKey(startDate, yesterdayISO);
      const historyCached = getCache<MetricsApiResponse>(historyCacheKey);

      if (historyCached) {
        console.log('[useMetrics] Using cached history until yesterday, fetching only today', {
          startDate,
          historyEnd: yesterdayISO,
          today: todayBrazilISO,
        });

        // Busca apenas o dia de hoje
        console.log('[useMetrics] Fetching only today from API', {
          today: todayBrazilISO,
        });
        const todayData = await fetchDailyMetrics(todayBrazilISO, todayBrazilISO);

        const combinedDays = [
          ...historyCached.days,
          ...todayData.days,
        ];

        // CRITICAL: Filter to only include days in the requested range
        const filteredDays = combinedDays.filter(d => d.date >= startDate && d.date <= endDate);
        const transformed = transformMetrics(filteredDays);
        const finalData = shouldTrimEmptyDays ? trimLeadingEmptyDays(transformed) : transformed;
        console.log('[useMetrics] Combined and filtered data:', finalData.map(d => ({ date: d.date, revenue: d.revenue })));
        
        // Only update if this is still the current request
        if (currentRequestRef.current === requestId) {
          setMetrics(finalData);
          setLoading(false);
        }
        return;
      }

      // Não há histórico em cache: busca range completo uma vez
      console.log('[useMetrics] No history cache, fetching full range including today', {
        startDate,
        endDate,
      });
      const fullData = await fetchDailyMetrics(startDate, endDate);

      // CRITICAL: Filter to only include days in the requested range
      const filteredFullDays = fullData.days.filter(d => d.date >= startDate && d.date <= endDate);

      // Separa apenas dias até ontem para cache (only if range includes history)
      if (startDate < todayBrazilISO) {
        const historyDays = filteredFullDays.filter((d) => d.date < todayBrazilISO);

        if (historyDays.length > 0) {
          console.log('[useMetrics] Creating history snapshot until yesterday for future cache', {
            startDate,
            historyEnd: yesterdayISO,
            daysCount: historyDays.length,
          });
          // Recalcula totais para o histórico (não é usado no front, mas mantemos coerente)
          const historyTotals = historyDays.reduce(
            (acc, day) => ({
              forms_submitted: acc.forms_submitted + day.forms_submitted,
              payments_initiated: acc.payments_initiated + day.payments_initiated,
              payments_approved: acc.payments_approved + day.payments_approved,
              revenue: acc.revenue + day.revenue,
              cost: acc.cost + day.cost,
              profit: acc.profit + day.profit,
              roas: null,
            }),
            {
              forms_submitted: 0,
              payments_initiated: 0,
              payments_approved: 0,
              revenue: 0,
              cost: 0,
              profit: 0,
              roas: null as number | null,
            }
          );

          if (historyTotals.cost > 0) {
            historyTotals.roas = parseFloat(
              (historyTotals.revenue / historyTotals.cost).toFixed(2)
            );
          }

          const historySnapshot: MetricsApiResponse = {
            period: {
              start: startDate,
              end: yesterdayISO,
            },
            days: historyDays,
            totals: historyTotals,
          };

          setCache(historyCacheKey, historySnapshot);
        }
      }

        const transformed = transformMetrics(filteredFullDays);
        const finalData = shouldTrimEmptyDays ? trimLeadingEmptyDays(transformed) : transformed;
        console.log('[useMetrics] Final data (filtered to range):', finalData.map(d => ({ date: d.date, revenue: d.revenue })));
        
        // Only update if this is still the current request
        if (currentRequestRef.current === requestId) {
          setMetrics(finalData);
          setLoading(false);
        }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMessage);
      console.error('Error in useMetrics:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, enabled, todayBrazilISO]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Helper hook to get metrics for common date ranges
 */
export function useMetricsForRange(days: number): UseMetricsResult {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return useMetrics(startDate, endDate);
}

