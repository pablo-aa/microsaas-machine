import { useState, useMemo } from "react";
import { mockMetrics } from "@/data/mockMetrics";
import { DateRange, CustomDateRange } from "@/types/metrics";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { MetricsTable } from "@/components/dashboard/MetricsTable";
import { isWithinInterval, startOfDay, subDays } from "date-fns";

const Index = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>();

  const filteredData = useMemo(() => {
    const today = startOfDay(new Date());
    
    switch (dateRange) {
      case "today": {
        const todayStr = today.toISOString().split('T')[0];
        return mockMetrics.filter(m => m.date === todayStr);
      }
      case "yesterday": {
        const yesterday = subDays(today, 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return mockMetrics.filter(m => m.date === yesterdayStr);
      }
      case "custom": {
        if (!customRange) return mockMetrics;
        return mockMetrics.filter(m => {
          const metricDate = new Date(m.date);
          return isWithinInterval(metricDate, {
            start: startOfDay(customRange.from),
            end: startOfDay(customRange.to)
          });
        });
      }
      default: {
        const days = parseInt(dateRange);
        return mockMetrics.slice(-days);
      }
    }
  }, [dateRange, customRange]);

  const kpis = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, d) => sum + d.revenue, 0);
    const totalAdSpend = filteredData.reduce((sum, d) => sum + d.adSpend, 0);
    const avgRoas = totalRevenue / totalAdSpend;
    const totalApproved = filteredData.reduce((sum, d) => sum + d.paymentApproved, 0);

    return {
      totalRevenue: `$${totalRevenue.toFixed(2)}`,
      totalAdSpend: `$${totalAdSpend.toFixed(2)}`,
      avgRoas: avgRoas.toFixed(2),
      totalApproved,
    };
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">MicroSaaS Performance</h1>
          <DateRangeSelector 
            selected={dateRange} 
            onChange={setDateRange}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard title="Total Revenue" value={kpis.totalRevenue} />
          <KpiCard title="Total Ad Spend" value={kpis.totalAdSpend} />
          <KpiCard title="Average ROAS" value={kpis.avgRoas} />
          <KpiCard title="Total Approved" value={kpis.totalApproved} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={filteredData} />
          <FunnelChart data={filteredData} />
        </div>

        {/* Table */}
        <MetricsTable data={filteredData} />
      </div>
    </div>
  );
};

export default Index;
