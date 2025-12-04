import { useState, useMemo, useEffect } from "react";
import { DateRange, CustomDateRange } from "@/types/metrics";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { MetricsTable } from "@/components/dashboard/MetricsTable";
import { startOfDay, subDays, format } from "date-fns";
import { useMetrics } from "@/hooks/useMetrics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAllCache } from "@/utils/cache";
import { Navigation } from "@/components/Navigation";

interface IndexProps {
  onLogout?: () => void;
}

const LOCAL_RANGE_KEY = "qc_performance_date_range";

const Index = ({ onLogout }: IndexProps) => {
  const [dateRange, setDateRange] = useState<DateRange>("7");
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>();

  // Restaurar range selecionado do localStorage (se existir)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_RANGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as {
        dateRange?: DateRange;
        customFrom?: string;
        customTo?: string;
      };

      if (parsed.dateRange) {
        setDateRange(parsed.dateRange);
      }

      if (parsed.dateRange === "custom" && parsed.customFrom && parsed.customTo) {
        const from = new Date(parsed.customFrom);
        const to = new Date(parsed.customTo);
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          setCustomRange({ from, to });
        }
      }
    } catch (e) {
      console.error("[Index] Failed to restore date range from localStorage", e);
    }
  }, []);

  // Persistir range selecionado no localStorage
  useEffect(() => {
    try {
      const payload: {
        dateRange: DateRange;
        customFrom?: string;
        customTo?: string;
      } = { dateRange };

      if (dateRange === "custom" && customRange?.from && customRange?.to) {
        payload.customFrom = customRange.from.toISOString();
        payload.customTo = customRange.to.toISOString();
      }

      localStorage.setItem(LOCAL_RANGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("[Index] Failed to persist date range to localStorage", e);
    }
  }, [dateRange, customRange]);

  // Calculate date range for API call
  // Use GMT-3 timezone to match backend logic
  const { startDate, endDate } = useMemo(() => {
    // Calculate today in GMT-3 (Brazil timezone)
    const now = new Date();
    const brazilOffset = -3 * 60; // GMT-3 in minutes
    const brazilTime = new Date(now.getTime() + (now.getTimezoneOffset() + brazilOffset) * 60000);
    const today = startOfDay(brazilTime);
    
    switch (dateRange) {
      case "today": {
        const todayStr = format(today, 'yyyy-MM-dd');
        return { startDate: todayStr, endDate: todayStr };
      }
      case "yesterday": {
        const yesterday = subDays(today, 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        return { startDate: yesterdayStr, endDate: yesterdayStr };
      }
      case "all": {
        // Get last 90 days for "all" (max allowed by API)
        const start = subDays(today, 90);
        return { 
          startDate: format(start, 'yyyy-MM-dd'), 
          endDate: format(today, 'yyyy-MM-dd')
        };
      }
      case "custom": {
        if (!customRange) {
          // Default to last 30 days if custom range not set
          const start = subDays(today, 30);
          return { 
            startDate: format(start, 'yyyy-MM-dd'), 
            endDate: format(today, 'yyyy-MM-dd')
          };
        }
        return {
          startDate: format(startOfDay(customRange.from), 'yyyy-MM-dd'),
          endDate: format(startOfDay(customRange.to), 'yyyy-MM-dd'),
        };
      }
      default: {
        const days = parseInt(dateRange);
        const start = subDays(today, days - 1);
        return { 
          startDate: format(start, 'yyyy-MM-dd'), 
          endDate: format(today, 'yyyy-MM-dd')
        };
      }
    }
  }, [dateRange, customRange]);

  // Validate date range (max 365 dias para UX / performance)
  const dateRangeValid = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays <= 365;
  }, [startDate, endDate]);

  // Fetch metrics from API
  const { metrics: filteredData, loading, error, refetch } = useMetrics(
    startDate, 
    endDate, 
    dateRangeValid
  );

  const kpis = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, d) => sum + d.revenue, 0);
    const totalAdSpend = filteredData.reduce((sum, d) => sum + d.adSpend, 0);
    const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
    const totalApproved = filteredData.reduce((sum, d) => sum + d.paymentApproved, 0);

    return {
      totalRevenue: `R$${totalRevenue.toFixed(2)}`,
      totalAdSpend: `R$${totalAdSpend.toFixed(2)}`,
      avgRoas: avgRoas.toFixed(2),
      totalApproved,
    };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLogout={onLogout} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground">QC Performance</h1>
                <img
                  src="/octopus.ico"
                  alt="MicroSaaS octopus logo"
                  className="w-7 h-7"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Dashboard de métricas de negócio e anúncios (dados em tempo quase real para o dia atual).
              </p>
            </div>
            <DateRangeSelector 
              selected={dateRange} 
              onChange={setDateRange}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => {
                clearAllCache();
                window.location.reload();
              }}
            >
              Hard refresh
            </Button>
          </div>
        </div>

        {/* Date Range Validation */}
        {!dateRangeValid && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Período muito grande</AlertTitle>
            <AlertDescription>
              O período selecionado excede 365 dias. Por favor, selecione um período menor (até 1 ano) para garantir boa performance.
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar métricas</AlertTitle>
            <AlertDescription>
              {error}
              <button 
                onClick={() => refetch()} 
                className="ml-4 underline hover:no-underline"
              >
                Tentar novamente
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Carregando métricas...</span>
          </div>
        )}

        {/* Content (show only when not loading and range is valid) */}
        {!loading && !error && dateRangeValid && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KpiCard title="Faturamento total" value={kpis.totalRevenue} />
              <KpiCard title="Gasto total em anúncios" value={kpis.totalAdSpend} />
              <KpiCard title="ROAS médio" value={kpis.avgRoas} />
              <KpiCard title="Pagamentos aprovados" value={kpis.totalApproved} />
            </div>

            {/* Charts */}
            <div className="space-y-6 mb-8">
              <RevenueChart data={filteredData} />
              <ProfitChart data={filteredData} />
              <FunnelChart data={filteredData} />
            </div>

            {/* Table */}
            <MetricsTable data={filteredData} />
          </>
        )}

        {/* Empty State */}
        {!loading && !error && dateRangeValid && filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Nenhuma métrica encontrada para o período selecionado
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
