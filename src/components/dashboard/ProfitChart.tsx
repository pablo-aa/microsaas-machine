import { useState, useMemo } from "react";
import { DailyMetrics, Granularity } from "@/types/metrics";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Area,
  ComposedChart,
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

interface ProfitChartProps {
  data: DailyMetrics[];
}

export const ProfitChart = ({ data }: ProfitChartProps) => {
  const [granularity, setGranularity] = useState<Granularity>("day");
  
  const aggregatedData = useMemo(() => {
    return aggregateData(data, granularity);
  }, [data, granularity]);
  
  const chartData = aggregatedData.map((d) => ({
    date: formatDateByGranularity(d.date, granularity),
    profit: Math.round((d.revenue - d.adSpend) * 100) / 100,
  }));
  
  const showLabels = aggregatedData.length <= 14;
  const showGranularitySelector = data.length >= 7;

  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Evolução do Lucro</h3>
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
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `R$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => `R$${value.toFixed(2)}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="profit"
            fill="hsl(142, 76%, 36%)"
            fillOpacity={0.2}
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={2}
            name="Lucro (R$)"
            dot={{ fill: "hsl(142, 76%, 36%)", r: 4 }}
            activeDot={{ r: 6 }}
          >
            {showLabels && (
              <LabelList 
                dataKey="profit" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => `R$${value.toFixed(2)}`}
              />
            )}
          </Area>
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};

