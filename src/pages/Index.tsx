import { useState, useMemo } from "react";
import { mockMetrics } from "@/data/mockMetrics";
import { DateRange, CustomDateRange, Granularity } from "@/types/metrics";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { MetricsTable } from "@/components/dashboard/MetricsTable";
import { isWithinInterval, startOfDay, subDays } from "date-fns";
import { aggregateData } from "@/utils/dataAggregation";

const Index = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>();
  const [granularity, setGranularity] = useState<Granularity>("day");

  const filteredData = useMemo(() => {
    const today = startOfDay(new Date());
    
    let rawData;
    switch (dateRange) {
      case "today": {
        const todayStr = today.toISOString().split('T')[0];
        rawData = mockMetrics.filter(m => m.date === todayStr);
        break;
      }
      case "yesterday": {
        const yesterday = subDays(today, 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        rawData = mockMetrics.filter(m => m.date === yesterdayStr);
        break;
      }
      case "all": {
        rawData = mockMetrics;
        break;
      }
      case "custom": {
        if (!customRange) {
          rawData = mockMetrics;
        } else {
          rawData = mockMetrics.filter(m => {
            const metricDate = new Date(m.date);
            return isWithinInterval(metricDate, {
              start: startOfDay(customRange.from),
              end: startOfDay(customRange.to)
            });
          });
        }
        break;
      }
      default: {
        const days = parseInt(dateRange);
        rawData = mockMetrics.slice(-days);
      }
    }
    
    return aggregateData(rawData, granularity);
  }, [dateRange, customRange, granularity]);

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
            granularity={granularity}
            onGranularityChange={setGranularity}
            dataPointsCount={filteredData.length}
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
        <div className="space-y-6 mb-8">
          <RevenueChart data={filteredData} granularity={granularity} />
          <FunnelChart data={filteredData} granularity={granularity} />
        </div>

        {/* Table */}
        <MetricsTable data={filteredData} />
      </div>
    </div>
  );
};

export default Index;
