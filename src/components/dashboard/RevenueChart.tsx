import { useState, useMemo } from "react";
import { DailyMetrics, Granularity } from "@/types/metrics";
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aggregateData, formatDateByGranularity } from "@/utils/dataAggregation";

interface RevenueChartProps {
  data: DailyMetrics[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const [granularity, setGranularity] = useState<Granularity>("day");
  
  const aggregatedData = useMemo(() => {
    return aggregateData(data, granularity);
  }, [data, granularity]);
  
  const chartData = aggregatedData.map((d) => ({
    date: formatDateByGranularity(d.date, granularity),
    revenue: d.revenue,
    adSpend: d.adSpend,
    roas: d.roas,
  }));
  
  const showLabels = aggregatedData.length <= 14;
  const showGranularitySelector = data.length > 14;

  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Receita vs Gastos com Anúncios & ROAS</h3>
        {showGranularitySelector && (
          <Select value={granularity} onValueChange={(value) => setGranularity(value as Granularity)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por dia</SelectItem>
              <SelectItem value="week">Por semana</SelectItem>
              <SelectItem value="month">Por mês</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => value.toFixed(2)}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill="hsl(217, 91%, 60%)" name="Receita ($)">
            {showLabels && (
              <LabelList 
                dataKey="revenue" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => value.toFixed(2)}
              />
            )}
          </Bar>
          <Bar yAxisId="left" dataKey="adSpend" fill="hsl(220, 13%, 70%)" name="Gasto com Anúncios ($)">
            {showLabels && (
              <LabelList 
                dataKey="adSpend" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => value.toFixed(2)}
              />
            )}
          </Bar>
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="roas" 
            stroke="hsl(142, 76%, 36%)" 
            strokeWidth={2}
            name="ROAS"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};
